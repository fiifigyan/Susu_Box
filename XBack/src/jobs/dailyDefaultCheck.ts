import cron from 'node-cron';
import { prisma } from '../config/database';
import { defaultService } from '../services/default.service';
import { logger } from '../utils/logger';
export async function runDailyDefaultCheck(): Promise<void> { const groups = await prisma.susuGroup.findMany({ where: { status: 'ACTIVE' }, include: { members: true } }); for (const group of groups) for (const member of group.members) { try { if (await defaultService.checkMemberDefault(member.id, group.id)) await defaultService.flagAsDefaulted(member.id, group.id, 'Three or more missed post-payout contributions'); } catch (error) { logger.error('Default check failed', { memberId: member.id, groupId: group.id, error }); } } }
export function startDailyDefaultCheckJob(): void { cron.schedule('0 23 * * *', () => runDailyDefaultCheck().catch(error => logger.error('Daily default job failed', error))); }
