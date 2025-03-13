"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, BookOpen } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Define the Verb type based on your database schema
type Verb = {
  id: string
  norwegian: string
  englishMeanings: string
  past: string | null
  pastParticiple: string | null
  mnemonic: string | null
  totalAttempts: number
  correctAttempts: number
}

export default function VocabularyPage() {
  const [verbs, setVerbs] = useState<Verb[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVerbs = async () => {
      try {
        const response = await fetch("/api/verbs")
        if (!response.ok) {
          throw new Error("Failed to fetch verbs")
        }
        const data = await response.json()
        setVerbs(data)
      } catch (error) {
        console.error("Error fetching verbs:", error)
        setError("Failed to load vocabulary. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchVerbs()
  }, [])

  // Filter verbs based on search term
  const filteredVerbs = verbs.filter(verb => 
    verb.norwegian.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verb.englishMeanings.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort verbs: tested verbs by correctness percentage (descending), then alphabetically, then untested verbs
  const sortedVerbs = [...filteredVerbs].sort((a, b) => {
    // Calculate correctness percentages
    const aPercentage = a.totalAttempts > 0 ? (a.correctAttempts / a.totalAttempts) : -1
    const bPercentage = b.totalAttempts > 0 ? (b.correctAttempts / b.totalAttempts) : -1
    
    // If both are untested, sort alphabetically
    if (aPercentage === -1 && bPercentage === -1) {
      return a.norwegian.localeCompare(b.norwegian)
    }
    
    // If only one is untested, put it at the end
    if (aPercentage === -1) return 1
    if (bPercentage === -1) return -1
    
    // If percentages are different, sort by percentage (descending)
    if (aPercentage !== bPercentage) {
      return bPercentage - aPercentage
    }
    
    // If percentages are the same, sort alphabetically
    return a.norwegian.localeCompare(b.norwegian)
  })

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-6 w-6 mr-2" />
                Vocabulary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search verbs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              {error ? (
                <div className="text-red-500">{error}</div>
              ) : loading ? (
                <div className="text-center py-4">Loading vocabulary...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Norwegian</TableHead>
                        <TableHead>English</TableHead>
                        <TableHead>Past Tense</TableHead>
                        <TableHead>Past Participle</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedVerbs.map((verb) => (
                        <TableRow key={verb.id}>
                          <TableCell className="font-medium">{verb.norwegian}</TableCell>
                          <TableCell>{verb.englishMeanings}</TableCell>
                          <TableCell>{verb.past || "-"}</TableCell>
                          <TableCell>{verb.pastParticiple || "-"}</TableCell>
                          <TableCell>
                            {verb.totalAttempts > 0 ? (
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className="bg-green-600 h-2.5 rounded-full" 
                                    style={{ width: `${(verb.correctAttempts / verb.totalAttempts) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {Math.round((verb.correctAttempts / verb.totalAttempts) * 100)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Not tested</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 