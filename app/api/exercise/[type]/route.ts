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

    // Get the exercise type from the query parameters
    const { searchParams } = new URL(request.url)
    let exerciseType = searchParams.get("type") || "random"
    
    // If random, choose a random exercise type
    if (exerciseType === "random") {
      const types = ["nor-to-eng", "eng-to-nor", "tenses"]
      exerciseType = types[Math.floor(Math.random() * types.length)]
    }

    // Get all verbs
    const verbs = await prisma.verb.findMany({
      include: {
        progressEntries: {
          where: {
            userId: user.id
          }
        }
      }
    })

    if (verbs.length === 0) {
      return NextResponse.json(
        { error: "No verbs found in the database" },
        { status: 404 }
      )
    }

    // Categorize verbs based on user progress
    const untested = verbs.filter(verb => verb.progressEntries.length === 0)
    const needsImprovement = verbs.filter(verb => {
      const progress = verb.progressEntries[0]
      return progress && progress.totalAttempts > 0 && 
             (progress.correctAttempts / progress.totalAttempts) < 0.7
    })
    const mastered = verbs.filter(verb => {
      const progress = verb.progressEntries[0]
      return progress && progress.totalAttempts > 0 && 
             (progress.correctAttempts / progress.totalAttempts) >= 0.7
    })

    // Select a verb based on user progress
    let selectedVerb
    if (untested.length > 0) {
      selectedVerb = untested[Math.floor(Math.random() * untested.length)]
    } else if (needsImprovement.length > 0) {
      selectedVerb = needsImprovement[Math.floor(Math.random() * needsImprovement.length)]
    } else {
      selectedVerb = verbs[Math.floor(Math.random() * verbs.length)]
    }

    // Format the verb for the response
    const verb = {
      id: selectedVerb.id,
      norwegian: selectedVerb.norwegian,
      englishMeanings: selectedVerb.englishMeanings,
      past: selectedVerb.past,
      pastParticiple: selectedVerb.pastParticiple,
      mnemonic: selectedVerb.mnemonic
    }

    return NextResponse.json({ verb, exerciseType })
  } catch (error) {
    console.error("Error fetching exercise:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercise" },
      { status: 500 }
    )
  }
} 