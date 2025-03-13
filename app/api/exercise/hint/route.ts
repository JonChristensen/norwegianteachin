import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@auth0/nextjs-auth0/edge"
import OpenAI from "openai"
import { cookies } from "next/headers"

// This tells Next.js to always render this route dynamically
export const dynamic = 'force-dynamic'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to generate context for a verb
async function generateContextForVerb(verb: any): Promise<string> {
  const prompt = `
    Provide a concise explanation, an example sentence, and a mnemonic to help a student remember 
    the Norwegian verb '${verb.norwegian}'. The common English meanings are: ${verb.englishMeanings}.
    
    Format your response exactly like this, with exactly one line break between sections:
    Concise Explanation: [Your explanation here]
    Example Sentence: [Your example sentence here]
    Mnemonic: [Your mnemonic here]
    
    Keep each section brief and clear.
  `
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert language tutor who provides helpful context." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    })
    
    let hint = response.choices[0].message.content?.trim() || "No additional context is available at this time."
    
    // Normalize the formatting to ensure consistent spacing
    hint = hint.replace(/\n+/g, '\n').replace(/Concise Explanation:/g, "Concise Explanation:")
               .replace(/Example Sentence:/g, "\nExample Sentence:")
               .replace(/Mnemonic:/g, "\nMnemonic:");
    
    return hint;
  } catch (error) {
    console.error("Error generating context:", error)
    return "No additional context is available at this time."
  }
}

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
    
    // Get the verb ID from the query parameters
    const { searchParams } = new URL(request.url)
    const verbId = searchParams.get("verbId")
    
    if (!verbId) {
      return NextResponse.json(
        { error: "Verb ID is required" },
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
    
    // Generate a hint for the verb
    const hint = await generateContextForVerb(verb)
    
    // Set a cookie to track that a hint was requested for this verb
    const cookieStore = cookies()
    const response = NextResponse.json({ hint })
    response.cookies.set(`hint_requested_${verbId}`, "true", {
      maxAge: 60 * 60, // 1 hour
      path: "/"
    })
    
    return response
  } catch (error) {
    console.error("Error getting hint:", error)
    return NextResponse.json(
      { error: "Failed to get hint" },
      { status: 500 }
    )
  }
} 