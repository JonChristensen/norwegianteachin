"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BookOpen, Check, X, HelpCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

type Verb = {
  id: string
  norwegian: string
  englishMeanings: string
  past: string | null
  pastParticiple: string | null
  mnemonic: string | null
}

export default function ExercisePage() {
  const params = useParams()
  const router = useRouter()
  const [verb, setVerb] = useState<Verb | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState("")
  const [pastTense, setPastTense] = useState("")
  const [pastParticiple, setPastParticiple] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const pastTenseInputRef = useRef<HTMLInputElement>(null)
  const pastParticipleInputRef = useRef<HTMLInputElement>(null)
  const answerInputRef = useRef<HTMLInputElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  const fetchExercise = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/exercise?type=${params.type}`)
      if (!response.ok) {
        throw new Error("Failed to fetch exercise")
      }
      const data = await response.json()
      setVerb(data.verb)
    } catch (error) {
      console.error("Error fetching exercise:", error)
      setError("Failed to load exercise. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Use useCallback to memoize the function
  const handleNextExercise = useCallback(() => {
    setAnswer("")
    setPastTense("")
    setPastParticiple("")
    setIsCorrect(null)
    setFeedback(null)
    setHint(null)
    fetchExercise()
  }, [fetchExercise])

  // Add a keydown event listener for the Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && feedback !== null) {
        handleNextExercise()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [feedback, handleNextExercise])

  useEffect(() => {
    fetchExercise()
  }, [params.type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verb) return

    let userAnswer = ""
    if (params.type === "tenses") {
      userAnswer = `${pastTense}, ${pastParticiple}`
    } else {
      userAnswer = answer
    }

    try {
      const response = await fetch("/api/exercise/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verbId: verb.id,
          userAnswer,
          exerciseType: params.type,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit answer")
      }

      const data = await response.json()
      setIsCorrect(data.isCorrect)
      setFeedback(data.feedback)
      
      // Focus the next button after submitting
      if (nextButtonRef.current) {
        nextButtonRef.current.focus()
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
      setFeedback("Error submitting answer. Please try again.")
    }
  }

  const handleGetHint = async () => {
    if (!verb) return

    try {
      const response = await fetch(`/api/exercise/hint?verbId=${verb.id}`)
      if (!response.ok) {
        throw new Error("Failed to get hint")
      }
      const data = await response.json()
      setHint(data.hint)
    } catch (error) {
      console.error("Error getting hint:", error)
      setHint("Error getting hint. Please try again.")
    }
  }

  // Handle tab key in tenses exercise
  const handlePastTenseKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      pastParticipleInputRef.current?.focus()
    }
  }

  // Change exercise type
  const changeExerciseType = (type: string) => {
    router.push(`/exercise/${type}`)
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="h-6 w-6 mr-2" />
                  {params.type === "nor-to-eng" && "Norwegian to English"}
                  {params.type === "eng-to-nor" && "English to Norwegian"}
                  {params.type === "tenses" && "Verb Tenses"}
                  {params.type === "random" && "Random Exercise"}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant={params.type === "nor-to-eng" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => changeExerciseType("nor-to-eng")}
                  >
                    NO → EN
                  </Button>
                  <Button 
                    variant={params.type === "eng-to-nor" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => changeExerciseType("eng-to-nor")}
                  >
                    EN → NO
                  </Button>
                  <Button 
                    variant={params.type === "tenses" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => changeExerciseType("tenses")}
                  >
                    Tenses
                  </Button>
                  <Button 
                    variant={params.type === "random" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => changeExerciseType("random")}
                  >
                    Random
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-red-500">{error}</div>
              ) : loading ? (
                <div className="text-center py-4">Loading exercise...</div>
              ) : verb ? (
                <div>
                  <div className="mb-6">
                    {params.type === "nor-to-eng" && (
                      <div className="text-xl font-semibold">{verb.norwegian}</div>
                    )}
                    {params.type === "eng-to-nor" && (
                      <div className="text-xl font-semibold">{verb.englishMeanings}</div>
                    )}
                    {params.type === "tenses" && (
                      <div className="text-xl font-semibold">
                        Provide the past tense and past participle of: {verb.norwegian}
                      </div>
                    )}
                    {params.type === "random" && (
                      <>
                        {verb.norwegian && verb.englishMeanings && (
                          <div className="text-xl font-semibold">
                            {Math.random() > 0.5 ? verb.norwegian : verb.englishMeanings}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {feedback === null ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {params.type === "tenses" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Past Tense</div>
                            <Input
                              id="pastTense"
                              ref={pastTenseInputRef}
                              value={pastTense}
                              onChange={(e) => setPastTense(e.target.value)}
                              onKeyDown={handlePastTenseKeyDown}
                              placeholder="Enter past tense..."
                              autoFocus
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Past Participle</div>
                            <Input
                              id="pastParticiple"
                              ref={pastParticipleInputRef}
                              value={pastParticiple}
                              onChange={(e) => setPastParticiple(e.target.value)}
                              placeholder="Enter past participle..."
                            />
                          </div>
                        </div>
                      ) : (
                        <Input
                          ref={answerInputRef}
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Enter your answer..."
                          autoFocus
                        />
                      )}

                      <div className="flex space-x-2">
                        <Button type="submit">Submit</Button>
                        <Button type="button" variant="outline" onClick={handleGetHint}>
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Hint
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-md ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <div className="flex items-center">
                          {isCorrect ? (
                            <Check className="h-5 w-5 mr-2" />
                          ) : (
                            <X className="h-5 w-5 mr-2" />
                          )}
                          {feedback}
                        </div>
                      </div>
                      <Button ref={nextButtonRef} onClick={handleNextExercise}>Next Exercise</Button>
                    </div>
                  )}

                  {hint && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <h3 className="text-sm font-semibold text-blue-800 mb-1">Hint:</h3>
                      <div className="text-blue-700">
                        {hint.split(/\n+/).map((section, index) => {
                          // Only add margin to sections after the first one
                          const className = index > 0 ? "mt-2" : "";
                          return (
                            <p key={index} className={className}>
                              {section.trim()}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">No exercise available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 