import { prisma } from '../config/database';
interface UserGroupMembership {
  group: object;
  position: number;
  hasReceivedPayout: boolean;
}

interface ScheduleMember {
  position: number;
  hasReceivedPayout: boolean;
  payoutDate: Date | null;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export class GroupService {
  async createGroup(userId: string, data: {
    name: string;
    description?: string;
    memberCount: number;
    dailyContribution: number;
    dailyPayout: number;
    surplusUse?: string;
    verificationMethod: 'MANUAL' | 'AUTO_VERIFY';
    appFeePerMember: number;
    securityDepositRequired?: number;
    securityDepositPercent?: number;
    holdBackPercentage?: number;
    holdBackDays?: number;
  }) {
    const dailySurplus = (data.dailyContribution * data.memberCount) - data.dailyPayout;

    const group = await prisma.susuGroup.create({
      data: {
        name: data.name,
        description: data.description,
        createdById: userId,
        memberCount: data.memberCount,
        dailyContribution: data.dailyContribution,
        dailyPayout: data.dailyPayout,
        dailySurplus,
        surplusUse: data.surplusUse,
        totalDays: data.memberCount,
        verificationMethod: data.verificationMethod,
        appFeePerMember: data.appFeePerMember,
        securityDepositRequired: data.securityDepositRequired || 0,
        securityDepositPercent: data.securityDepositPercent || 0,
        holdBackPercentage: data.holdBackPercentage || 0,
        holdBackDays: data.holdBackDays || 5,
      },
    });

    // Add creator as first member
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        position: 1,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        groupId: group.id,
        action: 'GROUP_CREATED',
        details: `Created group "${data.name}" with ${data.memberCount} members`,
      },
    });

    return group;
  }

  async getUserGroups(userId: string) {
    const memberships: UserGroupMembership[] = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((membership) => ({
      ...membership.group,
      myPosition: membership.position,
      hasReceivedPayout: membership.hasReceivedPayout,
    }));
  }

  async getGroupDetails(groupId: string) {
    const group = await prisma.susuGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!group) {
      throw Object.assign(new Error('Group not found'), { statusCode: 404 });
    }

    return group;
  }

  async addMember(groupId: string, data: { userId: string; position: number }) {
    const group = await prisma.susuGroup.findUnique({ where: { id: groupId } });
    if (!group) throw Object.assign(new Error('Group not found'), { statusCode: 404 });
    if (group.status !== 'FORMING') {
      throw Object.assign(new Error('Cannot add members to an active group'), { statusCode: 400 });
    }

    // Check position availability
    const existingMember = await prisma.groupMember.findFirst({
      where: { groupId, position: data.position },
    });
    if (existingMember) {
      throw Object.assign(new Error('Position already taken'), { statusCode: 409 });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId: data.userId,
        position: data.position,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return member;
  }

  async startGroup(groupId: string, userId: string) {
    const group = await prisma.susuGroup.findUnique({ where: { id: groupId } });
    if (!group) throw Object.assign(new Error('Group not found'), { statusCode: 404 });
    if (group.createdById !== userId) {
      throw Object.assign(new Error('Only the group admin can start the group'), { statusCode: 403 });
    }
    if (group.status !== 'FORMING') {
      throw Object.assign(new Error('Group is not in forming stage'), { statusCode: 400 });
    }

    const memberCount = await prisma.groupMember.count({ where: { groupId } });
    if (memberCount < group.memberCount) {
      throw Object.assign(
        new Error(`Need ${group.memberCount} members. Currently have ${memberCount}.`),
        { statusCode: 400 }
      );
    }

    const requiredDeposit = Math.max(group.securityDepositRequired, group.dailyPayout * group.securityDepositPercent / 100);
    if (requiredDeposit > 0) {
      const unpaid = await prisma.groupMember.count({ where: { groupId, isActive: true, securityDepositPaid: false } });
      if (unpaid > 0) throw Object.assign(new Error(`${unpaid} member(s) must pay the GHS ${requiredDeposit.toFixed(2)} security deposit before starting`), { statusCode: 400 });
    }

    // Start the group
    await prisma.$transaction([
      prisma.susuGroup.update({
        where: { id: groupId },
        data: {
          status: 'ACTIVE',
          currentDay: 1,
          startDate: new Date(),
        },
      }),
      // Create first payout
      prisma.payout.create({
        data: {
          groupId,
          recipientId: (await prisma.groupMember.findFirst({
            where: { groupId, position: 1 },
          }))!.id,
          day: 1,
          amount: group.dailyPayout,
        },
      }),
    ]);

    return { status: 'ACTIVE', currentDay: 1 };
  }

  async getPayoutSchedule(groupId: string) {
    const members: ScheduleMember[] = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { position: 'asc' },
    });

    const group = await prisma.susuGroup.findUnique({ where: { id: groupId } });
    if (!group) throw Object.assign(new Error('Group not found'), { statusCode: 404 });

    return members.map((member) => ({
      position: member.position,
      name: `${member.user.firstName} ${member.user.lastName}`,
      phone: member.user.phone,
      hasReceived: member.hasReceivedPayout,
      payoutDate: member.payoutDate,
      isToday: group.status === 'ACTIVE' && member.position === group.currentDay,
      isPast: member.position < group.currentDay,
    }));
  }
}