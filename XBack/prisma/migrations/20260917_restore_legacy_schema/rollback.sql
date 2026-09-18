DROP TABLE IF EXISTS "PendingInvite"; DROP TABLE IF EXISTS "SecurityLog"; DROP INDEX IF EXISTS "SusuGroup_shareCode_key"; ALTER TABLE "SusuGroup" DROP COLUMN IF EXISTS "shareCode";
