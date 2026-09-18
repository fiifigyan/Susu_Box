ALTER TABLE "User" DROP COLUMN IF EXISTS "defaultCount", DROP COLUMN IF EXISTS "creditReported", DROP COLUMN IF EXISTS "creditReportedAt";
ALTER TABLE "GroupMember" DROP COLUMN IF EXISTS "isDefaulted", DROP COLUMN IF EXISTS "defaultedAt", DROP COLUMN IF EXISTS "defaultReason", DROP COLUMN IF EXISTS "consecutiveMisses";
