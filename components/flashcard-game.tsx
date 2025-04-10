"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  CheckCircle,
  XCircle,
  BookOpen,
  Brain,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Award,
  Zap,
  Flame,
  BarChart3,
  Volume2,
  Medal,
  PenTool,
  SplitSquareVertical,
  Keyboard,
  Puzzle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { useTheme } from "next-themes"
import { v4 as uuidv4 } from "uuid"

import { useDatabase } from "@/hooks/use-db"
import type { WordEntry, TestType } from "@/lib/db"
import MultipleChoiceTest from "@/components/test-types/multiple-choice-test"
import FillBlankTest from "@/components/test-types/fill-blank-test"
import MatchingTest from "@/components/test-types/matching-test"
import SpellingTest from "@/components/test-types/spelling-test"
import RapidFireTest from "@/components/test-types/rapid-fire-test"
import TestSelector from "@/components/test-selector"
import TestResults from "@/components/test-results"

type Achievement = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  condition: (userProgress: any) => boolean
}

export default function FlashcardGame() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [filteredWords, setFilteredWords] = useState<WordEntry[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("learn")
  const [isFlipped, setIsFlipped] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null)
  const [testType, setTestType] = useState<TestType | null>(null)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [showTestSelector, setShowTestSelector] = useState(false)
  const [testScore, setTestScore] = useState(0)
  const [testTotalPossible, setTestTotalPossible] = useState(0)
  const [testTimeSpent, setTestTimeSpent] = useState(0)
  const [showTestResults, setShowTestResults] = useState(false)
  const { theme } = useTheme()
  const confettiRef = useRef<HTMLDivElement>(null)

  const {
    isLoading,
    error,
    userProgress,
    words,
    updateProgress,
    toggleLearnedWord,
    recordTestResult,
    fetchWordsByCategory,
    checkAndUpdateStreak,
  } = useDatabase()

  // Initialize data
  useEffect(() => {
    if (!isLoading && words.length > 0) {
      filterWords()
      checkAndUpdateStreak()
    }
  }, [isLoading, words, categoryFilter, checkAndUpdateStreak])

  // Check for achievements
  useEffect(() => {
    if (!userProgress) return

    const newAchievements = achievements.filter(
      (achievement) => !userProgress.achievements.includes(achievement.id) && achievement.condition(userProgress),
    )

    if (newAchievements.length > 0) {
      const achievement = newAchievements[0]
      updateProgress({
        achievements: [...userProgress.achievements, achievement.id],
        experience: userProgress.experience + 50, // Bonus XP for achievement
      })
      setShowAchievement(achievement)

      // Trigger confetti
      if (confettiRef.current) {
        const rect = confettiRef.current.getBoundingClientRect()
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
        })
      }
    }
  }, [userProgress?.correct, userProgress?.learned, userProgress, updateProgress])

  const filterWords = async () => {
    // Force a fresh fetch from the database
    const filtered = await fetchWordsByCategory(categoryFilter)
    setFilteredWords(filtered)
    setCurrentWordIndex(0)
  }

  // Navigate through words in learn mode
  const navigateLearnMode = (direction: "next" | "prev") => {
    setIsFlipped(false)
    if (direction === "next" && currentWordIndex < filteredWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
    } else if (direction === "prev" && currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
    }
  }

  // Handle test selection
  const handleSelectTest = (selectedTestType: TestType, selectedDifficulty: "easy" | "medium" | "hard") => {
    setTestType(selectedTestType)
    setDifficulty(selectedDifficulty)
    setShowTestSelector(false)

    // Force a refresh of the filtered words
    filterWords()
  }

  // Handle test completion
  const handleTestComplete = (score: number, totalPossible: number, timeSpent: number) => {
    setTestScore(score)
    setTestTotalPossible(totalPossible)
    setTestTimeSpent(timeSpent)
    setShowTestResults(true)

    // Record test result
    if (userProgress) {
      const testResult = {
        id: uuidv4(),
        date: new Date().toISOString(),
        testType: testType || "multipleChoice",
        score,
        totalPossible,
        wordIds: filteredWords.map((word) => word.id),
        timeSpent,
      }
      recordTestResult(testResult)

      // Update experience
      const experienceGained = Math.round(score / 2)
      updateProgress({
        experience: userProgress.experience + experienceGained,
        totalScore: userProgress.totalScore + score,
      })

      // Level up if enough experience
      if (userProgress.experience + experienceGained >= userProgress.level * 100) {
        updateProgress({
          level: userProgress.level + 1,
          experience: userProgress.experience + experienceGained - userProgress.level * 100,
        })

        // Trigger confetti for level up
        if (confettiRef.current) {
          const rect = confettiRef.current.getBoundingClientRect()
          confetti({
            particleCount: 200,
            spread: 100,
            origin: {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            },
          })
        }
      }
    }
  }

  // Speak the word using text-to-speech
  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      window.speechSynthesis.speak(utterance)
    }
  }

  // Get unique categories
  const categories = Array.from(new Set(words.map((word) => word.category)))

  // Calculate level progress
  const levelProgress = userProgress ? (userProgress.experience / (userProgress.level * 100)) * 100 : 0

  // Achievements
  const achievements: Achievement[] = [
    {
      id: "first_correct",
      title: "First Steps",
      description: "Answer your first word correctly",
      icon: <Medal className="h-6 w-6 text-yellow-500" />,
      condition: (progress) => progress.correct.length > 0,
    },
    {
      id: "ten_correct",
      title: "Word Warrior",
      description: "Answer 10 words correctly",
      icon: <Award className="h-6 w-6 text-indigo-500" />,
      condition: (progress) => progress.correct.length >= 10,
    },
    {
      id: "streak_3",
      title: "Consistent Scholar",
      description: "Maintain a 3-day streak",
      icon: <Flame className="h-6 w-6 text-orange-500" />,
      condition: (progress) => progress.streakDays >= 3,
    },
    {
      id: "learned_20",
      title: "Vocabulary Builder",
      description: "Mark 20 words as learned",
      icon: <BookOpen className="h-6 w-6 text-emerald-500" />,
      condition: (progress) => progress.learned.length >= 20,
    },
    {
      id: "level_5",
      title: "Rising Star",
      description: "Reach level 5",
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      condition: (progress) => progress.level >= 5,
    },
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center p-8 bg-rose-50 dark:bg-rose-950 rounded-lg border border-rose-200 dark:border-rose-800">
        <XCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-rose-700 dark:text-rose-300">Error Loading Data</h3>
        <p className="text-rose-600 dark:text-rose-400 mt-2">{error}</p>
        <Button className="mt-4 bg-rose-600 hover:bg-rose-700" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    )
  }

  // Render test component based on selected test type
  const renderTestComponent = () => {
    if (!testType) return null

    const testProps = {
      words: filteredWords,
      difficulty,
      onComplete: handleTestComplete,
      onExit: () => {
        setTestType(null)
        setActiveTab("learn")
      },
    }

    switch (testType) {
      case "multipleChoice":
        return <MultipleChoiceTest {...testProps} />
      case "fillBlank":
        return <FillBlankTest {...testProps} />
      case "matching":
        return <MatchingTest {...testProps} />
      case "spelling":
        return <SpellingTest {...testProps} />
      case "rapidFire":
        return <RapidFireTest {...testProps} />
      case "crossword":
        return (
          <div className="text-center p-8">
            <Puzzle className="h-12 w-12 text-violet-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">Crossword Puzzle</h3>
            <p className="text-muted-foreground mt-2">Coming soon!</p>
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700" onClick={() => setTestType(null)}>
              Back to Tests
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8" ref={confettiRef}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 text-transparent bg-clip-text">
            Vocabulary Master
          </h1>
          {userProgress && (
            <Badge
              variant="outline"
              className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 animate-pulse"
            >
              <Flame className="h-3 w-3 mr-1" /> {userProgress.streakDays} Day Streak
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {userProgress && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => setShowStats(true)}>
                    <Avatar className="h-8 w-8 bg-gradient-to-r from-violet-500 to-indigo-600 dark:from-violet-600 dark:to-indigo-700">
                      <AvatarFallback>{userProgress.level}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block">
                      <p className="text-xs font-medium">Level {userProgress.level}</p>
                      <Progress
                        value={levelProgress}
                        className="h-1 w-16 bg-violet-100 dark:bg-violet-900"
                        indicatorClassName="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500"
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your Level: {userProgress.level}</p>
                  <p className="text-xs">
                    {userProgress.experience} / {userProgress.level * 100} XP
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-violet-100 dark:bg-violet-900/50">
              <TabsTrigger
                value="learn"
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-700"
              >
                <BookOpen className="h-4 w-4 mr-2" /> Learn
              </TabsTrigger>
              <TabsTrigger
                value="test"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:bg-indigo-700"
                onClick={() => {
                  if (activeTab !== "test") {
                    setShowTestSelector(true)
                  }
                }}
              >
                <Brain className="h-4 w-4 mr-2" /> Test
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === "learn" && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant={categoryFilter === null ? "default" : "outline"}
            className={`cursor-pointer ${categoryFilter === null ? "bg-violet-600 dark:bg-violet-700" : "hover:bg-violet-100 dark:hover:bg-violet-900/30"}`}
            onClick={() => setCategoryFilter(null)}
          >
            All Categories
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={categoryFilter === category ? "default" : "outline"}
              className={`cursor-pointer ${categoryFilter === category ? "bg-indigo-600 dark:bg-indigo-700" : "hover:bg-indigo-100 dark:hover:bg-indigo-900/30"}`}
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}

      {/* Test Selector */}
      {showTestSelector && (
        <TestSelector
          onSelectTest={handleSelectTest}
          onCancel={() => {
            setShowTestSelector(false)
            setActiveTab("learn")
          }}
        />
      )}

      {/* Test Results */}
      {showTestResults && (
        <TestResults
          score={testScore}
          totalPossible={testTotalPossible}
          timeSpent={testTimeSpent}
          testType={testType || "multipleChoice"}
          onRetry={() => {
            setShowTestResults(false)
          }}
          onNewTest={() => {
            setShowTestResults(false)
            setShowTestSelector(true)
          }}
          onExit={() => {
            setShowTestResults(false)
            setTestType(null)
            setActiveTab("learn")
          }}
        />
      )}

      {/* Test Component */}
      {activeTab === "test" && testType && !showTestSelector && !showTestResults && renderTestComponent()}

      {/* Learn Mode */}
      {activeTab === "learn" && filteredWords.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`learn-${currentWordIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="perspective-1000"
          >
            <div className={`card-container ${isFlipped ? "flipped" : ""}`}>
              <motion.div
                className={`card ${isFlipped ? "flipped" : ""}`}
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <div className="card-face card-front">
                  <Card className="shadow-xl border-0 overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950 dark:border-violet-800">
                    <CardHeader className="pb-2 relative">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                          {filteredWords[currentWordIndex]?.category || ""}
                        </Badge>
                        <Badge className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800">
                          {filteredWords[currentWordIndex]?.type || ""}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <CardTitle className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-indigo-700 dark:from-violet-400 dark:to-indigo-400 text-transparent bg-clip-text">
                          {filteredWords[currentWordIndex]?.word || ""}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-violet-600 dark:text-violet-400"
                            onClick={() => speakWord(filteredWords[currentWordIndex]?.word || "")}
                          >
                            <Volume2 className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`${userProgress?.learned.includes(filteredWords[currentWordIndex]?.id || 0) ? "text-pink-500" : "text-gray-400 dark:text-gray-500"}`}
                            onClick={() => toggleLearnedWord(filteredWords[currentWordIndex]?.id || 0)}
                          >
                            {userProgress?.learned.includes(filteredWords[currentWordIndex]?.id || 0) ? (
                              <Heart className="h-5 w-5 fill-pink-500" />
                            ) : (
                              <Heart className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-lg mt-2 flex items-center">
                        <span>
                          {currentWordIndex + 1} of {filteredWords.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-indigo-600 dark:text-indigo-400"
                          onClick={() => setIsFlipped(!isFlipped)}
                        >
                          Flip Card
                        </Button>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-4">
                      <div className="space-y-4">
                        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
                          <h3 className="font-medium text-lg text-violet-800 dark:text-violet-300 mb-2">Definition:</h3>
                          <p className="text-xl">{filteredWords[currentWordIndex]?.definition || ""}</p>
                        </div>

                        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
                          <h3 className="font-medium text-lg text-indigo-800 dark:text-indigo-300 mb-2">Example:</h3>
                          <p className="text-lg italic">{filteredWords[currentWordIndex]?.example || ""}</p>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between pt-2 pb-6">
                      <Button
                        onClick={() => navigateLearnMode("prev")}
                        disabled={currentWordIndex === 0}
                        variant="outline"
                        className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/30"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                      </Button>

                      <Button
                        onClick={() => {
                          setShowTestSelector(true)
                          setActiveTab("test")
                        }}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 dark:from-violet-700 dark:to-indigo-700"
                      >
                        <Brain className="mr-2 h-4 w-4" /> Take a Test
                      </Button>

                      <Button
                        onClick={() => navigateLearnMode("next")}
                        disabled={currentWordIndex === filteredWords.length - 1}
                        variant="outline"
                        className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/30"
                      >
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                <div className="card-face card-back">
                  <Card className="shadow-xl border-0 overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-950 dark:border-indigo-800">
                    <CardHeader className="pb-2 relative">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                          {filteredWords[currentWordIndex]?.category || ""}
                        </Badge>
                        <Badge className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                          {filteredWords[currentWordIndex]?.type || ""}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-400 text-transparent bg-clip-text">
                          {filteredWords[currentWordIndex]?.definition || ""}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-lg mt-2 flex items-center">
                        <span>Definition Card</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-violet-600 dark:text-violet-400"
                          onClick={() => setIsFlipped(!isFlipped)}
                        >
                          Flip Back
                        </Button>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-4">
                      <div className="space-y-4">
                        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
                          <h3 className="font-medium text-lg text-indigo-800 dark:text-indigo-300 mb-2">Word:</h3>
                          <p className="text-xl">{filteredWords[currentWordIndex]?.word || ""}</p>
                        </div>

                        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
                          <h3 className="font-medium text-lg text-violet-800 dark:text-violet-300 mb-2">Example:</h3>
                          <p className="text-lg italic">{filteredWords[currentWordIndex]?.example || ""}</p>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between pt-2 pb-6">
                      <Button
                        onClick={() => navigateLearnMode("prev")}
                        disabled={currentWordIndex === 0}
                        variant="outline"
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                      </Button>

                      <Button
                        onClick={() => {
                          setShowTestSelector(true)
                          setActiveTab("test")
                        }}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 dark:from-indigo-700 dark:to-violet-700"
                      >
                        <Brain className="mr-2 h-4 w-4" /> Take a Test
                      </Button>

                      <Button
                        onClick={() => navigateLearnMode("next")}
                        disabled={currentWordIndex === filteredWords.length - 1}
                        variant="outline"
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                      >
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Achievement Dialog */}
      <Dialog open={showAchievement !== null} onOpenChange={() => setShowAchievement(null)}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950 dark:border-violet-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-amber-500 to-yellow-500 text-transparent bg-clip-text">
              Achievement Unlocked!
            </DialogTitle>
            <DialogDescription className="text-center text-lg">You've earned a new achievement!</DialogDescription>
          </DialogHeader>
          {showAchievement && (
            <div className="flex flex-col items-center p-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center mb-4">
                {showAchievement.icon}
              </div>
              <h3 className="text-xl font-bold">{showAchievement.title}</h3>
              <p className="text-center text-muted-foreground mt-2">{showAchievement.description}</p>
              <p className="text-center text-amber-600 dark:text-amber-400 mt-4">+50 XP Bonus!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950 dark:border-violet-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 text-transparent bg-clip-text">
              Your Progress Stats
            </DialogTitle>
          </DialogHeader>
          {userProgress && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                  <h3 className="font-medium text-violet-800 dark:text-violet-300 flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Total Score
                  </h3>
                  <p className="text-2xl font-bold">{userProgress.totalScore}</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                  <h3 className="font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                    <Flame className="h-4 w-4" /> Current Streak
                  </h3>
                  <p className="text-2xl font-bold">{userProgress.streakDays} days</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                  <h3 className="font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Words Learned
                  </h3>
                  <p className="text-2xl font-bold">{userProgress.learned.length}</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                  <h3 className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Star className="h-4 w-4" /> Level
                  </h3>
                  <p className="text-2xl font-bold">{userProgress.level}</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                <h3 className="font-medium text-violet-800 dark:text-violet-300 mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" /> Achievements ({userProgress.achievements.length}/{achievements.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-2 rounded-lg flex items-center gap-2 ${
                        userProgress.achievements.includes(achievement.id)
                          ? "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50"
                          : "bg-gray-100 dark:bg-gray-800 opacity-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          userProgress.achievements.includes(achievement.id)
                            ? "bg-gradient-to-r from-amber-400 to-yellow-400"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        {achievement.icon}
                      </div>
                      <div className="text-xs">
                        <p className="font-medium">{achievement.title}</p>
                        {userProgress.achievements.includes(achievement.id) ? (
                          <p className="text-green-600 dark:text-green-400">Unlocked!</p>
                        ) : (
                          <p className="text-gray-500">Locked</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {userProgress.testHistory.length > 0 && (
                <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                  <h3 className="font-medium text-violet-800 dark:text-violet-300 mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Recent Tests
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userProgress.testHistory
                      .slice(-5)
                      .reverse()
                      .map((test) => (
                        <div key={test.id} className="text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                          <div className="flex justify-between">
                            <span className="font-medium flex items-center gap-1">
                              {test.testType === "multipleChoice" && <Brain className="h-3 w-3" />}
                              {test.testType === "fillBlank" && <PenTool className="h-3 w-3" />}
                              {test.testType === "matching" && <SplitSquareVertical className="h-3 w-3" />}
                              {test.testType === "spelling" && <Keyboard className="h-3 w-3" />}
                              {test.testType === "rapidFire" && <Zap className="h-3 w-3" />}
                              {test.testType === "crossword" && <Puzzle className="h-3 w-3" />}
                              {test.testType === "multipleChoice" && "Multiple Choice"}
                              {test.testType === "fillBlank" && "Fill in the Blank"}
                              {test.testType === "matching" && "Matching Pairs"}
                              {test.testType === "spelling" && "Spelling Test"}
                              {test.testType === "rapidFire" && "Rapid Fire"}
                              {test.testType === "crossword" && "Word Puzzle"}
                            </span>
                            <span className="text-muted-foreground">{new Date(test.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>
                              Score: <span className="font-medium">{test.score}</span> / {test.totalPossible}
                            </span>
                            <span className="text-muted-foreground">{test.timeSpent}s</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .card-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .card {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
        
        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }
        
        .card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}
