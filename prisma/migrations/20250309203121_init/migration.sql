-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authProviderId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verb" (
    "id" TEXT NOT NULL,
    "norwegian" TEXT NOT NULL,
    "englishMeanings" TEXT NOT NULL,
    "past" TEXT,
    "pastParticiple" TEXT,
    "mnemonic" TEXT,
    "lastReviewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVerbProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verbId" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVerbProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authProviderId_key" ON "User"("authProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Verb_norwegian_key" ON "Verb"("norwegian");

-- CreateIndex
CREATE UNIQUE INDEX "UserVerbProgress_userId_verbId_key" ON "UserVerbProgress"("userId", "verbId");

-- AddForeignKey
ALTER TABLE "UserVerbProgress" ADD CONSTRAINT "UserVerbProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVerbProgress" ADD CONSTRAINT "UserVerbProgress_verbId_fkey" FOREIGN KEY ("verbId") REFERENCES "Verb"("id") ON DELETE CASCADE ON UPDATE CASCADE;
