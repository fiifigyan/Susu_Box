import { prisma } from '../config/database';

/** Contribution states that represent money actually received. */
const SETTLED_CONTRIBUTIONS = ['PAID', 'VERIFIED'] as const;

/** Days of history returned for the sparkline. */
const TREND_DAYS = 7;

export interface TrendPoint {
  /** ISO date (YYYY-MM-DD) for the bucket. */
  date: string;
  amount: number;
}

export interface NextPayoutSummary {
  groupId: string;
  groupName: string;
  amount: number;
  /** The payout day, which equals the member's position in the rotation. */
  day: number;
  /** Days until the payout. 0 means today. */
  daysAway: number;
}

export interface DashboardSummary {
  totalContributed: number;
  totalReceived: number;
  /** Payout money withheld under the group's hold-back rule. */
  heldBack: number;
  /** Received minus contributed. Negative while still saving towards a payout. */
  netPosition: number;
  groupsJoined: number;
  activeGroups: number;
  contributionsCount: number;
  payoutsReceived: number;
  /** Active groups where today's contribution has not been recorded yet. */
  pendingTodayCount: number;
  nextPayout: NextPayoutSummary | null;
  trend: TrendPoint[];
  /** Change in contributions over the last 7 days vs the 7 before. */
  trendChangePercent: number;
}

/** The contribution fields the trend calculation needs. */
interface ContributionRecord {
  amount: number;
  createdAt: Date;
  paidAt: Date | null;
}

/** Midnight local time, `daysAgo` days back. */
function startOfDay(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class DashboardService {
  /**
   * Aggregates everything the Home and Profile screens display for one user.
   *
   * Returned as a single payload so both screens share one request and one
   * cache entry rather than fanning out per statistic.
   */
  async getSummary(userId: string): Promise<DashboardSummary> {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
    });

    const memberIds = memberships.map((membership) => membership.id);
    const activeMemberships = memberships.filter(
      (membership) => membership.group.status === 'ACTIVE'
    );

    // Two full weeks, so the trend can be compared against the preceding week.
    const trendWindowStart = startOfDay(TREND_DAYS * 2 - 1);

    const [contributionTotals, payoutTotals, heldBackTotals, recentContributions] =
      await Promise.all([
        prisma.contribution.aggregate({
          where: { userId, status: { in: [...SETTLED_CONTRIBUTIONS] } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        memberIds.length > 0
          ? prisma.payout.aggregate({
              where: { recipientId: { in: memberIds }, status: 'DISTRIBUTED' },
              _sum: { amount: true },
              _count: { _all: true },
            })
          : null,
        memberIds.length > 0
          ? prisma.payout.aggregate({
              where: { recipientId: { in: memberIds }, heldBackReleased: false },
              _sum: { heldBackAmount: true },
            })
          : null,
        prisma.contribution.findMany({
          where: {
            userId,
            status: { in: [...SETTLED_CONTRIBUTIONS] },
            createdAt: { gte: trendWindowStart },
          },
          select: { amount: true, createdAt: true, paidAt: true },
        }),
      ]);

    const totalContributed = round2(contributionTotals._sum.amount ?? 0);
    const totalReceived = round2(payoutTotals?._sum.amount ?? 0);
    const heldBack = round2(heldBackTotals?._sum.heldBackAmount ?? 0);

    const { trend, trendChangePercent } = this.buildTrend(recentContributions);

    return {
      totalContributed,
      totalReceived,
      heldBack,
      netPosition: round2(totalReceived - totalContributed),
      groupsJoined: memberships.length,
      activeGroups: activeMemberships.length,
      contributionsCount: contributionTotals._count._all,
      payoutsReceived: payoutTotals?._count._all ?? 0,
      pendingTodayCount: await this.countPendingToday(userId, activeMemberships),
      nextPayout: this.findNextPayout(activeMemberships),
      trend,
      trendChangePercent,
    };
  }

  /**
   * Buckets contributions into daily totals and compares the last week with the
   * one before it.
   */
  private buildTrend(
    contributions: ContributionRecord[]
  ): { trend: TrendPoint[]; trendChangePercent: number } {
    const buckets = new Map<string, number>();

    // Seed every day in the window so gaps render as zero rather than vanishing.
    for (let offset = TREND_DAYS * 2 - 1; offset >= 0; offset -= 1) {
      buckets.set(toDateKey(startOfDay(offset)), 0);
    }

    for (const contribution of contributions) {
      // `paidAt` is when the money moved; `createdAt` is the fallback for
      // records written before payment confirmation.
      const key = toDateKey(contribution.paidAt ?? contribution.createdAt);
      const current = buckets.get(key);
      if (current !== undefined) {
        buckets.set(key, current + contribution.amount);
      }
    }

    const ordered: TrendPoint[] = Array.from(buckets.entries()).map(([date, amount]) => ({
      date,
      amount: round2(amount),
    }));

    const previousWeek = ordered.slice(0, TREND_DAYS);
    const currentWeek = ordered.slice(TREND_DAYS);

    const sum = (points: TrendPoint[]): number =>
      points.reduce((total, point) => total + point.amount, 0);

    const previousTotal = sum(previousWeek);
    const currentTotal = sum(currentWeek);

    // With no prior activity any contribution is new, so report +100% rather
    // than dividing by zero.
    const trendChangePercent =
      previousTotal === 0
        ? currentTotal > 0
          ? 100
          : 0
        : round2(((currentTotal - previousTotal) / previousTotal) * 100);

    return { trend: currentWeek, trendChangePercent };
  }

  /** Active groups where the user still owes today's contribution. */
  private async countPendingToday(
    userId: string,
    activeMemberships: Array<{ groupId: string; group: { currentDay: number } }>
  ): Promise<number> {
    if (activeMemberships.length === 0) return 0;

    const settled: Array<{ groupId: string }> = await prisma.contribution.findMany({
      where: {
        userId,
        status: { in: [...SETTLED_CONTRIBUTIONS] },
        OR: activeMemberships.map((membership) => ({
          groupId: membership.groupId,
          day: membership.group.currentDay,
        })),
      },
      select: { groupId: true },
    });

    const settledGroupIds = new Set(settled.map((contribution) => contribution.groupId));
    return activeMemberships.filter(
      (membership) => !settledGroupIds.has(membership.groupId)
    ).length;
  }

  /**
   * The user's soonest upcoming payout across all active groups.
   *
   * A member's payout day equals their position in the rotation, so days away is
   * simply position minus the group's current day.
   */
  private findNextPayout(
    activeMemberships: Array<{
      position: number;
      hasReceivedPayout: boolean;
      group: { id: string; name: string; dailyPayout: number; currentDay: number };
    }>
  ): NextPayoutSummary | null {
    const upcoming = activeMemberships
      .filter((membership) => !membership.hasReceivedPayout)
      .map((membership) => ({
        groupId: membership.group.id,
        groupName: membership.group.name,
        amount: round2(membership.group.dailyPayout),
        day: membership.position,
        daysAway: membership.position - membership.group.currentDay,
      }))
      .filter((payout) => payout.daysAway >= 0)
      .sort((first, second) => first.daysAway - second.daysAway);

    return upcoming[0] ?? null;
  }
}
