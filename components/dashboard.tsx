"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Brain, ChevronLeft, Clock, Heart, Star, Trophy, Flame, Award, CheckCircle } from "lucide-react"
import { useDatabase } from "@/hooks/use-db"
import type { TestResult, WordEntry } from "@/lib/db"

export default function Dashboard({ onBack }: { onBack: () => void }) {
  const { userProgress, words, getFavoriteWords } = useDatabase()
  const [favoriteWords, setFavoriteWords] = useState<WordEntry[]>([])
  const [period, setPeriod] = useState<"week" | "month" | "all">("week")

  const loadFavorites = useCallback(async () => {
    if (!userProgress || !getFavoriteWords) return
    const favorites = await getFavoriteWords()
    setFavoriteWords(favorites)
  }, [userProgress, getFavoriteWords])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  if (!userProgress) return null

  // Filter test history by period
  const filterByPeriod = (tests: TestResult[]) => {
    const now = new Date()
    const cutoff = new Date()

    if (period === "week") {
      cutoff.setDate(now.getDate() - 7)
    } else if (period === "month") {
      cutoff.setMonth(now.getMonth() - 1)
    } else {
      return tests
    }

    return tests.filter((test) => new Date(test.date) >= cutoff)
  }

  const filteredTests = filterByPeriod(userProgress.testHistory)

  // Calculate stats
  const totalTests = filteredTests.length
  const avgScore = totalTests
    ? Math.round(filteredTests.reduce((sum, test) => sum + (test.score / test.totalPossible) * 100, 0) / totalTests)
    : 0
  const totalTime = filteredTests.reduce((sum, test) => sum + test.timeSpent, 0)
  const avgTime = totalTests ? Math.round(totalTime / totalTests) : 0

  // Test type distribution
  const testTypes = filteredTests.reduce(
    (acc, test) => {
      acc[test.testType] = (acc[test.testType] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate progress
  const learnedPercent = words.length ? Math.round((userProgress.learned.length / words.length) * 100) : 0
  const favoritesPercent = words.length ? Math.round((favoriteWords.length / words.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 text-transparent bg-clip-text">
          Learning Dashboard
        </h1>
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Learning
        </Button>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
        <TabsList className="bg-violet-100 dark:bg-violet-900/50 w-full justify-start">
          <TabsTrigger value="week" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            This Week
          </TabsTrigger>
          <TabsTrigger value="month" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            This Month
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            All Time
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-amber-500" /> Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userProgress.level}</div>
            <Progress value={(userProgress.experience / (userProgress.level * 100)) * 100} className="h-2 mt-2" />
            <p className="text-sm text-muted-foreground mt-1">
              {userProgress.experience} / {userProgress.level * 100} XP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Flame className="h-5 w-5 mr-2 text-orange-500" /> Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userProgress.streakDays}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {userProgress.streakDays > 0 ? "Keep it going!" : "Start learning today!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-emerald-500" /> Words Learned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userProgress.learned.length}</div>
            <Progress value={learnedPercent} className="h-2 mt-2" />
            <p className="text-sm text-muted-foreground mt-1">{learnedPercent}% of total words</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-500" /> Favorite Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{favoriteWords.length}</div>
            <Progress value={favoritesPercent} className="h-2 mt-2" />
            <p className="text-sm text-muted-foreground mt-1">{favoritesPercent}% of total words</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-violet-500" /> Test Performance
            </CardTitle>
            <CardDescription>
              {totalTests} tests taken{" "}
              {period === "week" ? "this week" : period === "month" ? "this month" : "in total"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg">
                <div className="text-sm text-violet-700 dark:text-violet-300 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" /> Avg. Score
                </div>
                <div className="text-2xl font-bold">{avgScore}%</div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                <div className="text-sm text-indigo-700 dark:text-indigo-300 flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> Avg. Time
                </div>
                <div className="text-2xl font-bold">{avgTime}s</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Test Types</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(testTypes).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="bg-white/80 dark:bg-gray-800/50">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-amber-500" /> Achievements
            </CardTitle>
            <CardDescription>{userProgress.achievements.length} of 10 achievements unlocked</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={(userProgress.achievements.length / 10) * 100} className="h-2 mb-4" />

            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
              {userProgress.achievements.map((achievement) => (
                <div
                  key={achievement}
                  className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 p-2 rounded-lg flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-xs">
                    <p className="font-medium">{achievement}</p>
                    <p className="text-green-600 dark:text-green-400">Unlocked!</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {favoriteWords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-500" /> Favorite Words
            </CardTitle>
            <CardDescription>Your collection of favorite words</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
              {favoriteWords.map((word) => (
                <div key={word.id} className="bg-white/80 dark:bg-gray-800/50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-violet-700 dark:text-violet-300">{word.word}</h3>
                    <Badge variant="outline" className="text-xs">
                      {word.type}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">{word.definition}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
