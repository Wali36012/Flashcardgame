"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BarChart3,
  Trophy,
  Flame,
  Brain,
  Zap,
  Heart,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  ChevronLeft,
  ArrowUpRight,
  LineChart,
  BarChart,
  PieChart,
  LayoutDashboard
} from "lucide-react"
import { useTheme } from "next-themes"
import { useDatabase } from "@/hooks/use-db"
import { useRouter } from "next/navigation"
import type { TestResult } from "@/lib/db"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { userProgress, words, isLoading } = useDatabase()
  const { theme } = useTheme()
  const router = useRouter()

  if (isLoading || !userProgress) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Calculate statistics
  const totalWords = words.length
  const learnedWords = userProgress.learned.length
  const completionPercentage = Math.round((learnedWords / totalWords) * 100) || 0
  const testAccuracy = userProgress.totalScore > 0 
    ? Math.round((userProgress.totalScore / (userProgress.totalTests * 10)) * 100) || 0
    : 0
  
  // Calculate last 7 days progress
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const recentTests = userProgress.testResults
    ? userProgress.testResults.filter((test: TestResult) => new Date(test.date) > sevenDaysAgo)
    : []
  
  const recentWordsLearned = recentTests.reduce((total: number, test: TestResult) => total + test.score, 0)

  // Calculate level progress
  const currentLevel = userProgress.level || 1
  const currentXP = userProgress.experience || 0
  const xpToNextLevel = currentLevel * 100
  const levelProgress = Math.round((currentXP / xpToNextLevel) * 100)

  // Analytics data
  const testTypeDistribution = userProgress.testResults ? userProgress.testResults.reduce((acc: Record<string, number>, test: TestResult) => {
    acc[test.testType] = (acc[test.testType] || 0) + 1
    return acc
  }, {}) : {}

  // Daily activity data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  })

  const dailyActivity = last30Days.reduce((acc: Record<string, number>, date) => {
    acc[date] = 0
    return acc
  }, {})

  // Fill in activity data
  if (userProgress.testResults) {
    userProgress.testResults.forEach((test: TestResult) => {
      const testDate = new Date(test.date).toISOString().split('T')[0]
      if (dailyActivity[testDate] !== undefined) {
        dailyActivity[testDate] += 1
      }
    })
  }

  // Calculate category distribution
  const categoryDistribution = words.reduce((acc: Record<string, {total: number, learned: number}>, word) => {
    const category = word.category || 'Uncategorized'
    
    if (!acc[category]) {
      acc[category] = {total: 0, learned: 0}
    }
    
    acc[category].total += 1
    
    if (userProgress.learned.includes(word.id)) {
      acc[category].learned += 1
    }
    
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2" 
            onClick={() => router.push('/')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Flashcards
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track your learning progress and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="flex gap-1 py-1.5 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-800"
          >
            <Flame className="w-4 h-4" />
            <span>{userProgress.streak || 0} Day Streak</span>
          </Badge>
          <Badge 
            variant="outline" 
            className="flex gap-1 py-1.5 text-purple-500 dark:text-purple-400 border-purple-200 dark:border-purple-800"
          >
            <Zap className="w-4 h-4" />
            <span>Level {currentLevel}</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart className="w-4 h-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <LineChart className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Learned Words</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{learnedWords} / {totalWords}</div>
                <Progress value={completionPercentage} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {completionPercentage}% Complete
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Test Accuracy</CardTitle>
                <Brain className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testAccuracy}%</div>
                <Progress value={testAccuracy} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  From {userProgress.totalTests || 0} tests
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentWordsLearned}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Words learned this week
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Level Progress</CardTitle>
                <Award className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentXP} / {xpToNextLevel} XP</div>
                <Progress value={levelProgress} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {levelProgress}% to Level {currentLevel + 1}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTests.length > 0 ? (
                <div className="space-y-4">
                  {recentTests.slice(0, 5).map((test, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="bg-muted rounded-full p-2">
                        {test.testType === 'multipleChoice' && <Brain className="h-4 w-4" />}
                        {test.testType === 'fillBlank' && <Zap className="h-4 w-4" />}
                        {test.testType === 'matching' && <Heart className="h-4 w-4" />}
                        {test.testType === 'spelling' && <BookOpen className="h-4 w-4" />}
                        {test.testType === 'rapidFire' && <Flame className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {test.testType.replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())} Test
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(test.date).toLocaleDateString()} · Score: {test.score}/{test.totalPossible}
                        </p>
                      </div>
                      <Badge variant={test.score / test.totalPossible >= 0.8 ? "success" : 
                              test.score / test.totalPossible >= 0.5 ? "default" : "destructive"}>
                        {Math.round((test.score / test.totalPossible) * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent activity to display</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Words:</span>
                  <span className="font-medium">{totalWords}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Words Learned:</span>
                  <span className="font-medium">{learnedWords}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completion:</span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current Streak:</span>
                  <span className="font-medium">{userProgress.streak || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Best Streak:</span>
                  <span className="font-medium">{userProgress.bestStreak || 0} days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tests Taken:</span>
                  <span className="font-medium">{userProgress.totalTests || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Score:</span>
                  <span className="font-medium">{userProgress.totalScore || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Accuracy:</span>
                  <span className="font-medium">{testAccuracy}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Time Spent:</span>
                  <span className="font-medium">
                    {Math.round((userProgress.totalTimeSpent || 0) / 60)} min
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current Level:</span>
                  <span className="font-medium">{currentLevel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current XP:</span>
                  <span className="font-medium">{currentXP}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Next Level:</span>
                  <span className="font-medium">{xpToNextLevel - currentXP} XP needed</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total XP:</span>
                  <span className="font-medium">
                    {((currentLevel - 1) * 100) + currentXP}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress by Category</CardTitle>
                <CardDescription>Completion percentage by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryDistribution).map(([category, data]) => {
                    const percentage = Math.round((data.learned / data.total) * 100) || 0
                    return (
                      <div key={category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm text-muted-foreground">{data.learned}/{data.total}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-2" />
                          <span className="text-xs">{percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Type Distribution</CardTitle>
                <CardDescription>Types of tests you've taken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center">
                  <div className="flex flex-col gap-4 w-full">
                    {Object.entries(testTypeDistribution).length > 0 ? (
                      Object.entries(testTypeDistribution).map(([type, count]) => {
                        const percentage = Math.round((count as number / userProgress.totalTests) * 100)
                        const getColor = () => {
                          switch(type) {
                            case 'multipleChoice': return 'bg-blue-500'
                            case 'fillBlank': return 'bg-green-500'
                            case 'matching': return 'bg-yellow-500'
                            case 'spelling': return 'bg-purple-500'
                            case 'rapidFire': return 'bg-red-500'
                            default: return 'bg-gray-500'
                          }
                        }
                        
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">
                                {type.replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, str => str.toUpperCase())}
                              </span>
                              <span>{count} tests</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${getColor()}`} 
                                style={{ width: `${percentage}%` }}>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center text-muted-foreground">
                        No test data available
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>Your activity over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex">
                  <div className="flex items-end w-full gap-1">
                    {Object.entries(dailyActivity)
                      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                      .slice(-30)
                      .map(([date, count]) => {
                        const height = count ? Math.max(20, Math.min(100, (count as number) * 20)) : 4
                        const alpha = count ? Math.min(1, (count as number) * 0.2 + 0.5) : 0.1
                        const day = new Date(date).getDate()
                        
                        return (
                          <div key={date} className="flex flex-col items-center flex-1">
                            <div 
                              className="w-full bg-violet-500 dark:bg-violet-600 rounded-t" 
                              style={{ 
                                height: `${height}px`,
                                opacity: alpha
                              }}>
                            </div>
                            <span className="text-xs mt-1">{day}</span>
                          </div>
                        )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Learning Rate</CardTitle>
                <CardDescription>Words learned per day on average</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center flex-col h-[200px]">
                  <div className="text-4xl font-bold text-violet-600 dark:text-violet-400">
                    {userProgress.learned.length > 0 ? 
                      (userProgress.learned.length / Math.max(userProgress.daysActive, 1)).toFixed(1) : 
                      "0.0"}
                  </div>
                  <p className="text-sm text-muted-foreground">words/day</p>
                  
                  <div className="mt-4 flex items-center gap-1 text-sm">
                    <ArrowUpRight className={`h-4 w-4 ${recentWordsLearned > 0 ? "text-green-500" : "text-red-500"}`} /> 
                    <span className={recentWordsLearned > 0 ? "text-green-500" : "text-red-500"}>
                      {recentWordsLearned > 0 ? "+" : ""}{recentWordsLearned}
                    </span>
                    <span className="text-muted-foreground">this week</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Test Efficiency</CardTitle>
                <CardDescription>Average time spent per correct answer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center flex-col h-[200px]">
                  {userProgress.totalScore > 0 && userProgress.totalTimeSpent > 0 ? (
                    <>
                      <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                        {(userProgress.totalTimeSpent / userProgress.totalScore).toFixed(1)}
                      </div>
                      <p className="text-sm text-muted-foreground">seconds per correct answer</p>
                      
                      <div className="mt-4 text-sm text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Total time: {Math.round(userProgress.totalTimeSpent / 60)} minutes</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No test data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userProgress.achievements && userProgress.achievements.map((achievementId, index) => {
              const achievement = {
                id: achievementId,
                title: "Achievement Unlocked",
                description: "You've earned an achievement",
                icon: <Trophy className="h-5 w-5" />
              }
              return (
                <Card key={index} className="overflow-hidden">
                  <div className="bg-primary/10 p-4 flex justify-center">
                    <div className="bg-background rounded-full p-3">
                      {achievement.icon}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center">{achievement.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-sm text-muted-foreground">
                    {achievement.description}
                  </CardContent>
                </Card>
              )
            })}
            {(!userProgress.achievements || userProgress.achievements.length === 0) && (
              <div className="col-span-full text-center py-8">
                <Trophy className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No Achievements Yet</h3>
                <p className="text-muted-foreground">
                  Complete tests and learn words to earn achievements
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 