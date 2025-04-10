"use client"

import React, { useState, useEffect } from "react"
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
  LayoutDashboard,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react"
import { useTheme } from "next-themes"
import { useDatabase } from "@/hooks/use-db"
import { useRouter } from "next/navigation"
import type { TestResult, WordEntry } from "@/lib/db"
// Recharts components
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  Sector
} from "recharts"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month")
  const { userProgress, words, isLoading } = useDatabase()
  const { theme } = useTheme()
  const router = useRouter()

  // Helper function to format test type names
  const formatTestTypeName = (type: string) => {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  // Define chart colors for consistency
  const CHART_COLORS = {
    primary: '#8884d8',
    secondary: '#82ca9d',
    tertiary: '#ffc658',
    quaternary: '#ff8042',
    quinary: '#0088FE',
    accents: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28']
  };
  
  useEffect(() => {
    // Handle additional data processing for time-based filtering if needed
  }, [timeRange, userProgress]);

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
  const categoryDistribution = words.reduce((acc: Record<string, {total: number, learned: number}>, word: WordEntry) => {
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
                  {recentTests.slice(0, 5).map((test: TestResult, index: number) => (
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
                          {formatTestTypeName(test.testType)} Test
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
          <div className="flex justify-end mb-4">
            <div className="inline-flex p-1 rounded-md bg-muted">
              <Button
                variant={timeRange === "week" ? "default" : "ghost"}
                size="sm"
                className="text-xs"
                onClick={() => setTimeRange("week")}
              >
                Week
              </Button>
              <Button
                variant={timeRange === "month" ? "default" : "ghost"}
                size="sm"
                className="text-xs"
                onClick={() => setTimeRange("month")}
              >
                Month
              </Button>
              <Button
                variant={timeRange === "year" ? "default" : "ghost"}
                size="sm"
                className="text-xs"
                onClick={() => setTimeRange("year")}
              >
                Year
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress by Category</CardTitle>
                <CardDescription>Completion percentage by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={Object.entries(categoryDistribution).map(([category, data]) => ({
                          name: category,
                          value: data.learned,
                          total: data.total,
                          percentage: Math.round((data.learned / data.total) * 100),
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {Object.entries(categoryDistribution).map(([category, data], index: number) => {
                          const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];
                          return (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          );
                        })}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value, name, props) => [
                          `${value}/${props.payload.total} (${props.payload.percentage}%)`, 
                          name
                        ]} 
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4 mt-4">
                  {Object.entries(categoryDistribution).map(([category, data]) => {
                    const percentage = Math.round((data.learned / data.total) * 100) || 0
                    return (
                      <div key={category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{category}</span>
                          <span className="text-sm text-muted-foreground">{data.learned}/{data.total}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
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
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={Object.entries(testTypeDistribution).map(([type, count]) => ({
                        name: formatTestTypeName(type),
                        value: count,
                        percentage: Math.round((count as number / (userProgress.totalTests || 1)) * 100)
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value, name, props) => [
                          `${value} tests (${props.payload.percentage}%)`,
                          "Count"
                        ]}
                      />
                      <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                        {Object.entries(testTypeDistribution).map((entry, index: number) => {
                          const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];
                          return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                        })}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>Your activity over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={Object.entries(dailyActivity)
                        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                        .slice(-30)
                        .map(([date, count]) => ({
                          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                          count: count,
                          fullDate: date,
                        }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value, name, props) => [`${value} tests`, 'Activity']}
                        labelFormatter={(label) => {
                          const item = Object.entries(dailyActivity)
                            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                            .slice(-30)
                            .map(([date, count]) => ({
                              date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                              fullDate: date,
                            }))
                            .find(item => item.date === label);
                            
                          if (item) {
                            return new Date(item.fullDate).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                          }
                          return label;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorActivity)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Learning Rate</CardTitle>
                <CardDescription>Words learned per day on average</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[250px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Learned', value: userProgress.learned.length, fill: '#8884d8' },
                          { name: 'Remaining', value: Math.max(totalWords - userProgress.learned.length, 0), fill: '#f3f4f6' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-violet-600 dark:text-violet-400">
                      {userProgress.learned.length > 0 ? 
                        (userProgress.learned.length / Math.max(userProgress.daysActive, 1)).toFixed(1) : 
                        "0.0"}
                    </span>
                    <span className="text-sm text-muted-foreground">words/day</span>
                  </div>
                </div>
                
                <div className="mt-6 px-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Weekly Change</span>
                    </div>
                    <div className={`flex items-center gap-1 ${recentWordsLearned > 0 ? "text-green-500" : "text-red-500"}`}>
                      {recentWordsLearned > 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {recentWordsLearned > 0 ? "+" : ""}{recentWordsLearned}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Completion</span>
                    </div>
                    <span className="text-sm font-medium">{completionPercentage}%</span>
                  </div>
                  <Progress 
                    value={completionPercentage} 
                    className="h-2 mt-1 mb-4" 
                    indicatorClassName={`${
                      completionPercentage < 20 ? 'bg-red-500' :
                      completionPercentage < 50 ? 'bg-yellow-500' :
                      completionPercentage < 80 ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Test Efficiency</CardTitle>
                <CardDescription>Performance metrics on your tests</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {userProgress.totalScore > 0 && userProgress.totalTimeSpent > 0 ? (
                  <>
                    <div className="flex flex-col space-y-6 mt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="text-sm font-medium">Time per Answer</span>
                          </div>
                          <span className="text-lg font-bold">{(userProgress.totalTimeSpent / userProgress.totalScore).toFixed(1)}s</span>
                        </div>
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100 dark:bg-blue-900/30">
                            <div 
                              className="bg-blue-500 rounded-r"
                              style={{ width: `${Math.min(100, ((userProgress.totalTimeSpent / userProgress.totalScore) / 10) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            <span className="text-sm font-medium">Accuracy Rate</span>
                          </div>
                          <span className="text-lg font-bold">{testAccuracy}%</span>
                        </div>
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-green-100 dark:bg-green-900/30">
                            <div 
                              className="bg-green-500 rounded-r"
                              style={{ width: `${testAccuracy}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-violet-500" />
                            <span className="text-sm font-medium">Test Completion</span>
                          </div>
                          <span className="text-lg font-bold">
                            {userProgress.totalTests || 0}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {Array.from({ length: 5 }).map((_, i: number) => (
                            <div 
                              key={i} 
                              className={`h-2 rounded ${
                                i < Math.min(5, Math.floor(userProgress.totalTests / 5)) 
                                  ? 'bg-violet-500' 
                                  : 'bg-violet-100 dark:bg-violet-900/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="border-t dark:border-gray-800 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total time spent</span>
                          <span className="font-medium">{Math.round(userProgress.totalTimeSpent / 60)} min</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[200px] flex-col">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No test data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skill Breakdown Analysis</CardTitle>
                <CardDescription>Visual representation of your strengths across test types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                      Object.entries(testTypeDistribution).map(([type, count]) => {
                        // Calculate score percentage for this test type
                        const testResults = userProgress.testResults?.filter(
                          (test: TestResult) => test.testType === type
                        ) || [];
                        
                        const totalScore = testResults.reduce(
                          (sum: number, test: TestResult) => sum + test.score, 0
                        );
                        
                        const totalPossible = testResults.reduce(
                          (sum: number, test: TestResult) => sum + test.totalPossible, 0
                        );
                        
                        const scorePercentage = totalPossible > 0 
                          ? Math.round((totalScore / totalPossible) * 100) 
                          : 0;
                        
                        return {
                          subject: formatTestTypeName(type),
                          A: scorePercentage,
                          B: count,
                          fullMark: 100
                        };
                      })
                    }>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Accuracy" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Legend />
                      <RechartsTooltip formatter={(value, name) => [`${value}%`, name === 'A' ? 'Accuracy' : 'Tests']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Learning Pattern Analysis</CardTitle>
                <CardDescription>Your learning effectiveness over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={(() => {
                        // Create data for last 10 tests
                        const testData = [...(userProgress.testResults || [])]
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .slice(-10)
                          .map((test, index) => {
                            const accuracy = Math.round((test.score / test.totalPossible) * 100);
                            const efficiency = test.timeSpent / test.score;
                            return {
                              name: `Test ${index + 1}`,
                              date: new Date(test.date).toLocaleDateString(),
                              accuracy: accuracy,
                              efficiency: Math.round(efficiency * 10) / 10,
                              type: formatTestTypeName(test.testType),
                            };
                          });
                        return testData;
                      })()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax + 5']} />
                      <RechartsTooltip 
                        formatter={(value, name, props) => {
                          if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                          if (name === 'efficiency') return [`${value}s`, 'Seconds per answer'];
                          return [value, name];
                        }}
                        labelFormatter={(label, items) => {
                          const item = items[0]?.payload;
                          if (item) {
                            return `${item.date} - ${item.type}`;
                          }
                          return label;
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy" />
                      <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#82ca9d" name="Efficiency" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
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