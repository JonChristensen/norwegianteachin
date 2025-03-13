import { NextResponse } from "next/server"
import { getSession } from "@auth0/nextjs-auth0/edge"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get or create the user in the database
    let user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    })

    // If user doesn't exist, create a new one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0]
        }
      })
    }

    const totalVerbs = await prisma.verb.count()

    // Get progress for nor-to-eng
    const norToEngProgress = await prisma.userVerbProgress.findMany({
      where: { 
        userId: user.id,
        exerciseType: "nor-to-eng"
      },
      include: { verb: true },
    })

    // Get progress for eng-to-nor
    const engToNorProgress = await prisma.userVerbProgress.findMany({
      where: { 
        userId: user.id,
        exerciseType: "eng-to-nor"
      },
      include: { verb: true },
    })

    // Get progress for tenses
    const tensesProgress = await prisma.userVerbProgress.findMany({
      where: { 
        userId: user.id,
        exerciseType: "tenses"
      },
      include: { verb: true },
    })

    // Calculate stats for nor-to-eng
    const norToEngStats = calculateStats(norToEngProgress, totalVerbs)
    
    // Calculate stats for eng-to-nor
    const engToNorStats = calculateStats(engToNorProgress, totalVerbs)
    
    // Calculate stats for tenses
    const tensesStats = calculateStats(tensesProgress, totalVerbs)

    // Calculate overall stats
    const overallStats = {
      verbsAttempted: Math.max(norToEngStats.verbsAttempted, engToNorStats.verbsAttempted, tensesStats.verbsAttempted),
      masteredVerbs: Math.max(norToEngStats.masteredVerbs, engToNorStats.masteredVerbs, tensesStats.masteredVerbs),
      masteryPercentage: (norToEngStats.masteryPercentage + engToNorStats.masteryPercentage + tensesStats.masteryPercentage) / 3,
      accuracy: (norToEngStats.accuracy + engToNorStats.accuracy + tensesStats.accuracy) / 3,
    }

    return NextResponse.json({
      progress: {
        norToEng: norToEngProgress,
        engToNor: engToNorProgress,
        tenses: tensesProgress
      },
      stats: {
        totalVerbs,
        norToEng: norToEngStats,
        engToNor: engToNorStats,
        tenses: tensesStats,
        overall: overallStats
      },
    })
  } catch (error) {
    console.error("Error fetching progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    )
  }
}

// Helper function to calculate stats for a specific exercise type
function calculateStats(progress: any[], totalVerbs: number) {
  const totalAttempts = progress.reduce((sum, p) => sum + p.totalAttempts, 0)
  const totalCorrect = progress.reduce((sum, p) => sum + p.correctAttempts, 0)
  const verbsAttempted = progress.length
  
  // Consider a verb mastered if it has at least 3 correct attempts and 80% accuracy
  const masteredVerbs = progress.filter(
    (p) => p.correctAttempts >= 3 && (p.totalAttempts > 0 ? p.correctAttempts / p.totalAttempts >= 0.8 : false)
  ).length

  // Calculate accuracy - avoid division by zero
  const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0
  
  // For mastery percentage, we can use either:
  // 1. Percentage of total verbs mastered (masteredVerbs / totalVerbs)
  // 2. Percentage of attempted verbs mastered (masteredVerbs / verbsAttempted)
  // Let's use a weighted approach that considers both attempts and accuracy
  const masteryPercentage = verbsAttempted > 0 
    ? (accuracy * 0.5) + ((masteredVerbs / totalVerbs) * 100 * 0.5)
    : 0

  return {
    verbsAttempted,
    masteredVerbs,
    masteryPercentage,
    accuracy,
    totalAttempts,
    totalCorrect
  }
} 