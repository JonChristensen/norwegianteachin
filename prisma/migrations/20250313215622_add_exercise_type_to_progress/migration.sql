/*
  Warnings:

  - A unique constraint covering the columns `[userId,verbId,exerciseType]` on the table `prisma_user_verb_progress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `exerciseType` to the `prisma_user_verb_progress` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column allowing NULL values
ALTER TABLE "prisma_user_verb_progress" ADD COLUMN "exerciseType" TEXT;

-- Update existing records with a default value
UPDATE "prisma_user_verb_progress" SET "exerciseType" = 'general';

-- Now make the column NOT NULL
ALTER TABLE "prisma_user_verb_progress" ALTER COLUMN "exerciseType" SET NOT NULL;

-- Add the unique constraint
ALTER TABLE "prisma_user_verb_progress" DROP CONSTRAINT IF EXISTS "prisma_user_verb_progress_userId_verbId_key";
ALTER TABLE "prisma_user_verb_progress" ADD CONSTRAINT "prisma_user_verb_progress_userId_verbId_exerciseType_key" UNIQUE ("userId", "verbId", "exerciseType");
