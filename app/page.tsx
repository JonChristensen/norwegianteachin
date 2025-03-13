"use client"

import { Layout } from "@/components/layout"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function HomePage() {
  const { user, error, isLoading } = useUser()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(false)

  useEffect(() => {
    if (error) {
      console.error("Auth0 error:", error)
      setErrorMessage(error.message)
    }
  }, [error])

  useEffect(() => {
    if (user) {
      fetchProgress()
    }
  }, [user])

  const fetchProgress = async () => {
    setLoadingProgress(true)
    try {
      const response = await fetch('/api/progress')
      const data = await response.json()
      setProgressData(data)
    } catch (err) {
      console.error('Error fetching progress:', err)
    } finally {
      setLoadingProgress(false)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (errorMessage) return <div>Error: {errorMessage}</div>

  return (
    <Layout>
      {user ? (
        // Content for logged-in users
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Welcome to Norwegian Teachin</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <p className="text-lg text-gray-700 mb-4">
              You are logged in. Use the menu above to access your exercises and vocabulary list.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold text-blue-800 mb-2">Practice Verbs</h2>
                <p className="text-gray-600 mb-4">
                  Test your knowledge of Norwegian verbs with our interactive exercises.
                </p>
                <a
                  href="/exercise/nor-to-eng"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Start practicing →
                </a>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-5 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold text-green-800 mb-2">Review Vocabulary</h2>
                <p className="text-gray-600 mb-4">Browse and study your saved Norwegian vocabulary words.</p>
                <a
                  href="/vocabulary"
                  className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
                >
                  View vocabulary →
                </a>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProgress ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Tabs defaultValue="nor-to-eng" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="nor-to-eng">Norwegian → English</TabsTrigger>
                    <TabsTrigger value="eng-to-nor">English → Norwegian</TabsTrigger>
                    <TabsTrigger value="tenses">Tenses</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="nor-to-eng" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-blue-700">
                          {progressData?.stats?.norToEng?.accuracy?.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-blue-700">
                          {progressData?.stats?.norToEng?.verbsAttempted || 0}/{progressData?.stats?.totalVerbs || 0}
                        </div>
                        <div className="text-sm text-gray-600">Verbs Attempted</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Mastery</span>
                          <span className="text-sm font-medium text-gray-700">
                            {progressData?.stats?.norToEng?.masteryPercentage?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${progressData?.stats?.norToEng?.masteryPercentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Coverage</span>
                          <span className="text-sm font-medium text-gray-700">
                            {progressData?.stats?.norToEng?.verbsAttempted && progressData?.stats?.totalVerbs ? 
                              ((progressData.stats.norToEng.verbsAttempted / progressData.stats.totalVerbs) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-indigo-400 h-2.5 rounded-full" 
                            style={{ 
                              width: `${progressData?.stats?.norToEng?.verbsAttempted && progressData?.stats?.totalVerbs ? 
                                (progressData.stats.norToEng.verbsAttempted / progressData.stats.totalVerbs) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="eng-to-nor" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-green-700">
                          {progressData?.stats?.engToNor?.accuracy?.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-green-700">
                          {progressData?.stats?.engToNor?.verbsAttempted || 0}/{progressData?.stats?.totalVerbs || 0}
                        </div>
                        <div className="text-sm text-gray-600">Verbs Attempted</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Mastery</span>
                          <span className="text-sm font-medium text-gray-700">
                            {progressData?.stats?.engToNor?.masteryPercentage?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${progressData?.stats?.engToNor?.masteryPercentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Coverage</span>
                          <span className="text-sm font-medium text-gray-700">
                            {progressData?.stats?.engToNor?.verbsAttempted && progressData?.stats?.totalVerbs ? 
                              ((progressData.stats.engToNor.verbsAttempted / progressData.stats.totalVerbs) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-emerald-400 h-2.5 rounded-full" 
                            style={{ 
                              width: `${progressData?.stats?.engToNor?.verbsAttempted && progressData?.stats?.totalVerbs ? 
                                (progressData.stats.engToNor.verbsAttempted / progressData.stats.totalVerbs) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tenses" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-purple-700">
                          {progressData?.stats?.tenses?.accuracy?.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-purple-700">
                          {progressData?.stats?.tenses?.verbsAttempted || 0}/{progressData?.stats?.totalVerbs || 0}
                        </div>
                        <div className="text-sm text-gray-600">Verbs Attempted</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Mastery</span>
                          <span className="text-sm font-medium text-gray-700">
                            {progressData?.stats?.tenses?.masteryPercentage?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-purple-600 h-2.5 rounded-full" 
                            style={{ width: `${progressData?.stats?.tenses?.masteryPercentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Coverage</span>
                          <span className="text-sm font-medium text-gray-700">
                            {progressData?.stats?.tenses?.verbsAttempted && progressData?.stats?.totalVerbs ? 
                              ((progressData.stats.tenses.verbsAttempted / progressData.stats.totalVerbs) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-violet-400 h-2.5 rounded-full" 
                            style={{ 
                              width: `${progressData?.stats?.tenses?.verbsAttempted && progressData?.stats?.totalVerbs ? 
                                (progressData.stats.tenses.verbsAttempted / progressData.stats.totalVerbs) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Content for logged-out users
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">Welcome to Norwegian Teachin</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <p className="text-xl text-gray-700 mb-6">
              Your interactive platform for learning Norwegian verbs and vocabulary.
            </p>
            
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Features</h2>
              <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600">
                <li>• Interactive verb exercises</li>
                <li>• Vocabulary management</li>
                <li>• Progress tracking</li>
                <li>• Personalized learning experience</li>
              </ul>
            </div>
            
            <a
              href="/api/auth/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Log In / Sign Up to Get Started
            </a>
          </div>
          
          <div className="text-gray-600">
            <p>
              Norwegian Teachin helps you master Norwegian verbs through interactive practice.
            </p>
          </div>
        </div>
      )}
    </Layout>
  )
}

