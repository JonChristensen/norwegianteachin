import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@auth0/nextjs-auth0"

// This tells Next.js to always render this route dynamically
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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

    // Get all verbs with user progress
    const verbs = await prisma.verb.findMany({
      include: {
        progressEntries: {
          where: {
            userId: user.id
          }
        }
      }
    })

    // Format the verbs for the response
    const verbsWithProgress = verbs.map(verb => {
      const progress = verb.progressEntries[0] || { totalAttempts: 0, correctAttempts: 0 }
      
      return {
        id: verb.id,
        norwegian: verb.norwegian,
        englishMeanings: verb.englishMeanings,
        past: verb.past,
        pastParticiple: verb.pastParticiple,
        mnemonic: verb.mnemonic,
        totalAttempts: progress.totalAttempts,
        correctAttempts: progress.correctAttempts
      }
    })

    return NextResponse.json(verbsWithProgress)
  } catch (error) {
    console.error("Error fetching verbs:", error)
    return NextResponse.json(
      { error: "Failed to fetch verbs" },
      { status: 500 }
    )
  }
} 