ALTER TABLE "Payout" DROP COLUMN IF EXISTS "heldBackAmount", DROP COLUMN IF EXISTS "heldBackReleased", DROP COLUMN IF EXISTS "heldBackReleasedAt", DROP COLUMN IF EXISTS "holdBackDays";
ALTER TABLE "SusuGroup" DROP COLUMN IF EXISTS "holdBackPercentage", DROP COLUMN IF EXISTS "holdBackDays";
