"use server"

import { OpenAI } from "openai"
import { getOrCreateUser } from "@/lib/user"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function gradeAnswer(verbId: string, userAnswer: string, direction: "nor-to-eng" | "eng-to-nor") {
  const user = await getOrCreateUser()

  // Get the verb from the database
  const verb = await prisma.verb.findUnique({
    where: { id: verbId },
  })

  if (!verb) {
    throw new Error("Verb not found")
  }

  // Parse the English meanings
  const englishMeanings = verb.englishMeanings.split(",").map((m: string) => m.trim())

  // Determine correct answer based on direction
  const correctAnswer = direction === "nor-to-eng" ? englishMeanings[0] : verb.norwegian

  // Normalize answers for comparison
  const normalizedUserAnswer = normalizeAnswer(userAnswer)

  // For Norwegian to English, check against all possible meanings
  let isCorrect = false

  if (direction === "nor-to-eng") {
    isCorrect = englishMeanings.some((meaning) => normalizeAnswer(meaning) === normalizedUserAnswer)
  } else {
    // For English to Norwegian, just check against the Norwegian word
    isCorrect = normalizeAnswer(verb.norwegian) === normalizedUserAnswer
  }

  // If not an exact match, use AI to check for semantic equivalence
  if (!isCorrect && process.env.OPENAI_API_KEY) {
    isCorrect = await checkWithAI(userAnswer, correctAnswer, direction)
  }

  // Update user progress - MODIFIED to include exerciseType
  await prisma.userVerbProgress.upsert({
    where: {
      userId_verbId_exerciseType: {
        userId: user.id,
        verbId: verb.id,
        exerciseType: direction, // Use direction as the exercise type
      },
    },
    update: {
      totalAttempts: { increment: 1 },
      correctAttempts: isCorrect ? { increment: 1 } : undefined,
      lastReviewed: new Date(),
    },
    create: {
      userId: user.id,
      verbId: verb.id,
      exerciseType: direction, // Use direction as the exercise type
      totalAttempts: 1,
      correctAttempts: isCorrect ? 1 : 0,
    },
  })

  // Generate hint and context
  const hint = verb.mnemonic || (await generateHint(verb, direction))

  revalidatePath("/exercise")

  return {
    isCorrect,
    correctAnswer: direction === "nor-to-eng" ? englishMeanings.join(", ") : verb.norwegian,
    hint,
    verb: {
      ...verb,
      englishMeanings,
    },
  }
}

function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?'"()]/g, "")
    .replace(/^(to|å) /, "") // Remove leading "to" or "å"
}

async function checkWithAI(
  userAnswer: string,
  correctAnswer: string,
  direction: "nor-to-eng" | "eng-to-nor",
): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Norwegian language expert. Evaluate if the user's translation is semantically correct.
          ${
            direction === "nor-to-eng"
              ? "The user is translating from Norwegian to English."
              : "The user is translating from English to Norwegian."
          }`,
        },
        {
          role: "user",
          content: `Is "${userAnswer}" a valid translation of "${correctAnswer}"? Answer only with "yes" or "no".`,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    })

    const aiResponse = response.choices[0]?.message?.content?.toLowerCase() || ""
    return aiResponse.includes("yes")
  } catch (error) {
    console.error("Error checking with AI:", error)
    // Fall back to exact match if AI check fails
    return false
  }
}

async function generateHint(verb: any, direction: "nor-to-eng" | "eng-to-nor"): Promise<string> {
  // Generate a simple hint without AI
  if (direction === "nor-to-eng") {
    const englishMeanings = verb.englishMeanings.split(",").map((m: string) => m.trim())
    return `Think about what "${verb.norwegian}" might mean in English. It's related to ${englishMeanings[0].split(" ")[1] || "an action"}.`
  } else {
    return `The Norwegian word starts with "${verb.norwegian.charAt(0)}". It's a common verb used in everyday conversation.`
  }
}

