"use client"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, BookOpen } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define the Verb type based on your database schema
type Progress = {
  totalAttempts: number
  correctAttempts: number
  exerciseType: string
}

type Verb = {
  id: string
  norwegian: string
  englishMeanings: string
  past: string | null
  pastParticiple: string | null
  mnemonic: string | null
  progress: Progress[]
}

export default function VocabularyPage() {
  const [verbs, setVerbs] = useState<Verb[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")

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

  // Get progress for the active tab
  const getProgress = (verb: Verb, type: string) => {
    if (type === "all") {
      // Combine all progress types
      const totalAttempts = verb.progress.reduce((sum, p) => sum + p.totalAttempts, 0)
      const correctAttempts = verb.progress.reduce((sum, p) => sum + p.correctAttempts, 0)
      return { totalAttempts, correctAttempts }
    } else {
      // Get progress for specific type
      const progress = verb.progress.find(p => p.exerciseType === type)
      return progress ? 
        { totalAttempts: progress.totalAttempts, correctAttempts: progress.correctAttempts } : 
        { totalAttempts: 0, correctAttempts: 0 }
    }
  }

  // Sort verbs based on the active tab's progress
  const sortedVerbs = [...filteredVerbs].sort((a, b) => {
    const aProgress = getProgress(a, activeTab)
    const bProgress = getProgress(b, activeTab)
    
    // Calculate correctness percentages
    const aPercentage = aProgress.totalAttempts > 0 ? 
      (aProgress.correctAttempts / aProgress.totalAttempts) : -1
    const bPercentage = bProgress.totalAttempts > 0 ? 
      (bProgress.correctAttempts / bProgress.totalAttempts) : -1
    
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
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search verbs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All Progress</TabsTrigger>
                    <TabsTrigger value="nor-to-eng">Nor → Eng</TabsTrigger>
                    <TabsTrigger value="eng-to-nor">Eng → Nor</TabsTrigger>
                  </TabsList>
                </Tabs>
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
                        <TableHead>
                          {activeTab === "all" ? "Overall Progress" : 
                           activeTab === "nor-to-eng" ? "Norwegian → English" : 
                           "English → Norwegian"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedVerbs.map((verb) => {
                        const progress = getProgress(verb, activeTab)
                        
                        return (
                          <TableRow key={verb.id}>
                            <TableCell className="font-medium">{verb.norwegian}</TableCell>
                            <TableCell>{verb.englishMeanings}</TableCell>
                            <TableCell>{verb.past || "-"}</TableCell>
                            <TableCell>{verb.pastParticiple || "-"}</TableCell>
                            <TableCell>
                              {progress.totalAttempts > 0 ? (
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                    <div 
                                      className={`${activeTab === "eng-to-nor" ? "bg-green-600" : activeTab === "nor-to-eng" ? "bg-blue-600" : "bg-purple-600"} h-2.5 rounded-full`}
                                      style={{ width: `${(progress.correctAttempts / progress.totalAttempts) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {Math.round((progress.correctAttempts / progress.totalAttempts) * 100)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">Not tested</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
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