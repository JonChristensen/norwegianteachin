"use server"

import { getOrCreateUser } from "@/lib/user"
import { prisma } from "@/lib/prisma"

export async function getRandomVerb(direction: "nor-to-eng" | "eng-to-nor") {
  const user = await getOrCreateUser()

  // Get a random verb, prioritizing ones the user has practiced less
  const verbs = await prisma.verb.findMany({
    include: {
      progressEntries: {
        where: { userId: user.id },
      },
    },
    orderBy: {
      progressEntries: {
        _count: "asc",
      },
    },
    take: 10,
  })

  if (verbs.length === 0) {
    throw new Error("No verbs found in the database")
  }

  // Select a random verb from the top 10 least practiced
  const randomIndex = Math.floor(Math.random() * verbs.length)
  const verb = verbs[randomIndex]

  // Parse the English meanings string into an array
  const englishMeanings = verb.englishMeanings.split(",").map((m) => m.trim())

  return {
    id: verb.id,
    norwegian: verb.norwegian,
    englishMeanings,
    past: verb.past,
    pastParticiple: verb.pastParticiple,
    mnemonic: verb.mnemonic,
    progress: verb.progressEntries[0] || null,
    direction,
  }
}

export async function getUserProgress() {
  const user = await getOrCreateUser()

  // Get progress for each exercise type
  const norToEngProgress = await prisma.userVerbProgress.findMany({
    where: { 
      userId: user.id,
      exerciseType: "nor-to-eng"
    },
    include: { verb: true },
  })

  const engToNorProgress = await prisma.userVerbProgress.findMany({
    where: { 
      userId: user.id,
      exerciseType: "eng-to-nor"
    },
    include: { verb: true },
  })

  // You can add a third type if needed (e.g., "vocabReview")

  const totalVerbs = await prisma.verb.count()

  // Calculate stats for nor-to-eng
  const norToEngStats = calculateStats(norToEngProgress, totalVerbs)
  
  // Calculate stats for eng-to-nor
  const engToNorStats = calculateStats(engToNorProgress, totalVerbs)

  return {
    progress: {
      norToEng: norToEngProgress,
      engToNor: engToNorProgress,
    },
    stats: {
      totalVerbs,
      norToEng: norToEngStats,
      engToNor: engToNorStats,
    },
  }
}

// Helper function to calculate stats for a specific exercise type
function calculateStats(progress: any[], totalVerbs: number) {
  const totalAttempts = progress.reduce((sum, p) => sum + p.totalAttempts, 0)
  const totalCorrect = progress.reduce((sum, p) => sum + p.correctAttempts, 0)
  const verbsAttempted = progress.length
  const masteredVerbs = progress.filter(
    (p) => p.correctAttempts >= 3 && p.correctAttempts / p.totalAttempts >= 0.8,
  ).length

  return {
    verbsAttempted,
    masteredVerbs,
    masteryPercentage: totalVerbs > 0 ? (masteredVerbs / totalVerbs) * 100 : 0,
    accuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
  }
}

