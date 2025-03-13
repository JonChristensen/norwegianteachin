import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@auth0/nextjs-auth0/edge"

// This tells Next.js to always render this route dynamically
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

    // Get all verbs with progress for this user
    const verbs = await prisma.verb.findMany({
      include: {
        progressEntries: {
          where: {
            userId: user.id
          },
          select: {
            totalAttempts: true,
            correctAttempts: true,
            exerciseType: true
          }
        }
      }
    })

    // Format the verbs for the response
    const formattedVerbs = verbs.map(verb => ({
      id: verb.id,
      norwegian: verb.norwegian,
      englishMeanings: verb.englishMeanings,
      past: verb.past,
      pastParticiple: verb.pastParticiple,
      mnemonic: verb.mnemonic,
      progress: verb.progressEntries
    }))

    return NextResponse.json(formattedVerbs)
  } catch (error) {
    console.error("Error fetching verbs:", error)
    return NextResponse.json(
      { error: "Failed to fetch verbs" },
      { status: 500 }
    )
  }
} 