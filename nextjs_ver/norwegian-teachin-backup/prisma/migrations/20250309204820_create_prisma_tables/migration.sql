/*
  Warnings:

  - You are about to drop the `UserVerbProgress` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserVerbProgress" DROP CONSTRAINT "UserVerbProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserVerbProgress" DROP CONSTRAINT "UserVerbProgress_verbId_fkey";

-- DropTable
DROP TABLE "UserVerbProgress";

-- CreateTable
CREATE TABLE "prisma_user_verb_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verbId" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prisma_user_verb_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prisma_user_verb_progress_userId_verbId_key" ON "prisma_user_verb_progress"("userId", "verbId");

-- AddForeignKey
ALTER TABLE "prisma_user_verb_progress" ADD CONSTRAINT "prisma_user_verb_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prisma_user_verb_progress" ADD CONSTRAINT "prisma_user_verb_progress_verbId_fkey" FOREIGN KEY ("verbId") REFERENCES "Verb"("id") ON DELETE CASCADE ON UPDATE CASCADE;
