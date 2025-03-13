import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@auth0/nextjs-auth0"
import OpenAI from "openai"
import { cookies } from "next/headers"

// This tells Next.js to always render this route dynamically
export const dynamic = 'force-dynamic'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to expand answers (similar to your Python code)
function expandAnswers(correctAnswers: string[]): string[] {
  const expanded: string[] = []
  for (const ans of correctAnswers) {
    const parts = ans.split("/").map((part: string) => part.trim())
    expanded.push(...parts)
  }
  return expanded
}

// Helper function to grade free-form answers using OpenAI
async function gradeFreeFormAnswer(userAnswer: string, correctAnswers: string[]): Promise<boolean> {
  // Expand the correct answers
  const expandedAnswers = expandAnswers(correctAnswers)
  
  // Normalize acceptable answers: remove a leading "to " if present and lowercase
  const normalizedAnswers: string[] = []
  for (const ans of expandedAnswers) {
    let norm = ans.trim().toLowerCase()
    if (norm.startsWith("to ")) {
      norm = norm.substring(3)
    }
    normalizedAnswers.push(norm)
  }
  
  // Normalize the user's answer similarly
  let normalizedUser = userAnswer.trim().toLowerCase()
  if (normalizedUser.startsWith("to ")) {
    normalizedUser = normalizedUser.substring(3)
  }
  
  // First, try a direct comparison
  if (normalizedAnswers.includes(normalizedUser)) {
    return true
  }
  
  // If direct comparison fails, use OpenAI to evaluate
  try {
    const prompt = `
      I'm learning Norwegian verbs. For the verb with these English meanings: ${correctAnswers.join(", ")}
      I answered: "${userAnswer}"
      
      Is my answer correct? Consider synonyms, alternative phrasings, and common variations.
      Answer with just "yes" or "no".
    `
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful language tutor who evaluates answers." },
        { role: "user", content: prompt }
      ],
      max_tokens: 10,
      temperature: 0.3,
    })
    
    const answer = response.choices[0].message.content?.trim().toLowerCase() || ""
    return answer.includes("yes")
  } catch (error) {
    console.error("Error grading with OpenAI:", error)
    // Fall back to direct comparison if OpenAI fails
    return normalizedAnswers.includes(normalizedUser)
  }
}

export async function POST(request: Request) {
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
    
    // Parse the request body
    const body = await request.json()
    const { verbId, userAnswer, exerciseType } = body
    
    if (!verbId || !userAnswer || !exerciseType) {
      return NextResponse.json(
        { error: "Verb ID, user answer, and exercise type are required" },
        { status: 400 }
      )
    }
    
    // Get the verb from the database
    const verb = await prisma.verb.findUnique({
      where: {
        id: verbId
      }
    })
    
    if (!verb) {
      return NextResponse.json(
        { error: "Verb not found" },
        { status: 404 }
      )
    }
    
    // Check if a hint was requested for this verb
    const cookieStore = cookies()
    const hintRequested = cookieStore.get(`hint_requested_${verbId}`)
    
    let isCorrect = false
    let feedback = ""
    
    // If a hint was requested, don't count the answer as correct
    if (hintRequested) {
      isCorrect = false
      feedback = "You got a hint for this exercise; this attempt will not count as correct."
      
      // Clear the hint cookie
      cookieStore.delete(`hint_requested_${verbId}`)
    } else {
      // Grade the answer based on the exercise type
      if (exerciseType === "nor-to-eng") {
        isCorrect = await gradeFreeFormAnswer(userAnswer, verb.englishMeanings.split(","))
        feedback = isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${verb.englishMeanings}`
      } else if (exerciseType === "eng-to-nor") {
        isCorrect = userAnswer.trim().toLowerCase() === verb.norwegian.trim().toLowerCase()
        feedback = isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${verb.norwegian}`
      } else if (exerciseType === "tenses") {
        const parts = userAnswer.split(",").map((part: string) => part.trim().toLowerCase())
        const correctPast = verb.past?.trim().toLowerCase() || ""
        const correctPastParticiple = verb.pastParticiple?.trim().toLowerCase() || ""
        
        if (parts.length === 2) {
          isCorrect = parts[0] === correctPast && parts[1] === correctPastParticiple
          feedback = isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${verb.past}, ${verb.pastParticiple}`
        } else {
          isCorrect = false
          feedback = "Please provide both past tense and past participle separated by a comma."
        }
      } else {
        isCorrect = await gradeFreeFormAnswer(userAnswer, verb.englishMeanings.split(","))
        feedback = isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${verb.englishMeanings}`
      }
    }
    
    // Update the user's progress only if no hint was requested
    if (!hintRequested) {
      const progress = await prisma.userVerbProgress.upsert({
        where: {
          userId_verbId: {
            userId: user.id,
            verbId: verb.id
          }
        },
        update: {
          totalAttempts: { increment: 1 },
          correctAttempts: isCorrect ? { increment: 1 } : undefined,
          lastReviewed: new Date()
        },
        create: {
          userId: user.id,
          verbId: verb.id,
          totalAttempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          lastReviewed: new Date()
        }
      })
    }
    
    return NextResponse.json({ isCorrect, feedback })
  } catch (error) {
    console.error("Error submitting answer:", error)
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    )
  }
} 