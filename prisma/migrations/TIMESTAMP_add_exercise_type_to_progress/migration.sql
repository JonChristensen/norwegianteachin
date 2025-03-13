-- First add the column allowing NULL values
ALTER TABLE "prisma_user_verb_progress" ADD COLUMN "exerciseType" TEXT;

-- Update existing records with a default value
UPDATE "prisma_user_verb_progress" SET "exerciseType" = 'general';

-- Now make the column NOT NULL
ALTER TABLE "prisma_user_verb_progress" ALTER COLUMN "exerciseType" SET NOT NULL;

-- Add the unique constraint
ALTER TABLE "prisma_user_verb_progress" DROP CONSTRAINT IF EXISTS "prisma_user_verb_progress_userId_verbId_key";
ALTER TABLE "prisma_user_verb_progress" ADD CONSTRAINT "prisma_user_verb_progress_userId_verbId_exerciseType_key" UNIQUE ("userId", "verbId", "exerciseType"); 