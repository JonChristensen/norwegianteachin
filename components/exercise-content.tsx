"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react"
import { getRandomVerb } from "@/actions/excercise"
import { gradeAnswer } from "@/actions/grading"

interface ExerciseContentProps {
  type: string
}

export function ExerciseContent({ type }: ExerciseContentProps) {
  const router = useRouter()
  const [answer, setAnswer] = useState("")
  const [showHint, setShowHint] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [exerciseData, setExerciseData] = useState<any>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const [direction, setDirection] = useState<"nor-to-eng" | "eng-to-nor">(
    type === "eng-to-nor" ? "eng-to-nor" : "nor-to-eng",
  )

  useEffect(() => {
    loadExercise()
  }, [direction])

  async function loadExercise() {
    setLoading(true)
    setAnswer("")
    setShowHint(false)
    setIsCorrect(null)
    setFeedback(null)

    try {
      const data = await getRandomVerb(direction)
      setExerciseData(data)
    } catch (error) {
      console.error("Error loading exercise:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectionChange = (value: string) => {
    const newDirection = value as "nor-to-eng" | "eng-to-nor"
    setDirection(newDirection)
    router.push(`/exercise/${value}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exerciseData || !answer.trim()) return

    try {
      const result = await gradeAnswer(exerciseData.id, answer, direction)
      setIsCorrect(result.isCorrect)
      setFeedback(result)
    } catch (error) {
      console.error("Error submitting answer:", error)
    }
  }

  const handleNextVerb = () => {
    loadExercise()
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-8 flex justify-center items-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!exerciseData) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-medium text-red-600 mb-2">Error loading exercise</h2>
              <p className="text-gray-600 mb-4">We couldn't load an exercise. Please try again later.</p>
              <Button onClick={loadExercise}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const questionText =
    direction === "nor-to-eng"
      ? `Translate the Norwegian verb: ${exerciseData.norwegian}`
      : `Translate to Norwegian: ${exerciseData.englishMeanings[0]}`

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Exercise: {direction === "nor-to-eng" ? "Norwegian to English" : "English to Norwegian"}
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current mode: {direction === "nor-to-eng" ? "Norwegian to English" : "English to Norwegian"}</span>
            <Select value={direction} onValueChange={handleDirectionChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nor-to-eng">Norwegian to English</SelectItem>
                <SelectItem value="eng-to-nor">English to Norwegian</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium text-gray-800 mb-2">{questionText}</h2>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Answer:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="flex-1"
                      placeholder="Type your answer here"
                      disabled={isCorrect !== null}
                    />
                    <Button type="submit" disabled={isCorrect !== null || !answer.trim()}>
                      Submit Answer
                    </Button>
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-1"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {showHint ? "Hide Hint" : "Hint"}
                  </Button>
                </div>
              </form>
            </div>

            {isCorrect !== null && feedback && (
              <div
                className={`p-4 rounded-md ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                <div className="flex items-start">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                  )}
                  <div>
                    <p className={`font-medium ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                      {isCorrect ? "Correct!" : "Not quite right."}
                    </p>
                    {!isCorrect && (
                      <p className="text-red-700 mt-1">
                        The correct answer is: <span className="font-medium">{feedback.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(showHint || isCorrect === false) && feedback && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Explanation:</h3>
                <p className="text-gray-800 mb-3">
                  {direction === "nor-to-eng"
                    ? `"${exerciseData.norwegian}" is the Norwegian verb meaning "${exerciseData.englishMeanings.join(", ")}".`
                    : `"${exerciseData.englishMeanings[0]}" in Norwegian is "${exerciseData.norwegian}".`}
                </p>

                {exerciseData.past && (
                  <>
                    <h3 className="font-semibold text-blue-800 mb-1">Past tense:</h3>
                    <p className="text-gray-800 mb-3">{exerciseData.past}</p>
                  </>
                )}

                {exerciseData.pastParticiple && (
                  <>
                    <h3 className="font-semibold text-blue-800 mb-1">Past participle:</h3>
                    <p className="text-gray-800 mb-3">{exerciseData.pastParticiple}</p>
                  </>
                )}

                {exerciseData.mnemonic && (
                  <>
                    <h3 className="font-semibold text-blue-800 mb-1">Mnemonic:</h3>
                    <p className="text-gray-800">{exerciseData.mnemonic}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-200 bg-gray-50 flex justify-between">
          <Button variant="outline" size="sm" onClick={loadExercise}>
            Skip
          </Button>
          {isCorrect !== null && (
            <Button variant="default" size="sm" onClick={handleNextVerb}>
              Next Verb
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

