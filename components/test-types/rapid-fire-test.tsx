"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Trophy, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { WordEntry } from "@/lib/db"

interface RapidFireTestProps {
  words: WordEntry[]
  difficulty: "easy" | "medium" | "hard"
  onComplete: (score: number, totalPossible: number, timeSpent: number) => void
  onExit: () => void
}

export default function RapidFireTest({ words, difficulty, onComplete, onExit }: RapidFireTestProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [progress, setProgress] = useState(0)
  const [totalTime, setTotalTime] = useState(60)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [timerActive, setTimerActive] = useState(true)
  const [startTime] = useState(Date.now())
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [answeredWords, setAnsweredWords] = useState(0)
  const optionsRef = useRef<HTMLDivElement>(null)

  // Initialize the test
  useEffect(() => {
    if (words.length > 0) {
      generateOptions(words[0], words)
    }

    // Set timer based on difficulty
    if (difficulty === "easy") {
      setTotalTime(90)
      setTimeRemaining(90)
    } else if (difficulty === "medium") {
      setTotalTime(60)
      setTimeRemaining(60)
    } else {
      setTotalTime(45)
      setTimeRemaining(45)
    }
  }, [words, difficulty])

  // Timer for timed mode
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (timerActive && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    } else if (timerActive && timeRemaining === 0) {
      // Time's up - end game
      setGameOver(true)
      const timeSpent = totalTime
      onComplete(score, answeredWords * 10, timeSpent)
    }
    return () => clearTimeout(timer)
  }, [timerActive, timeRemaining, score, answeredWords, totalTime, onComplete])

  // Generate multiple choice options
  const generateOptions = (currentWord: WordEntry, allWords: WordEntry[]) => {
    const correctDefinition = currentWord.definition
    const otherWords = allWords.filter((word) => word.id !== currentWord.id)

    // Adjust number of options based on difficulty
    const numOptions = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4
    const shuffledOtherWords = shuffleArray(otherWords).slice(0, numOptions - 1)

    const allOptions = [correctDefinition, ...shuffledOtherWords.map((word) => word.definition)]
    setOptions(shuffleArray(allOptions))
  }

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    if (isCorrect !== null || gameOver) return // Prevent multiple selections

    const currentWord = words[currentWordIndex]
    const correct = option === currentWord.definition

    setSelectedOption(option)
    setIsCorrect(correct)
    setAnsweredWords((prev) => prev + 1)

    if (correct) {
      // Calculate points based on difficulty and combo
      const difficultyMultiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2
      const comboMultiplier = Math.min(3, 1 + combo * 0.1) // Max 3x multiplier
      const points = Math.round(10 * difficultyMultiplier * comboMultiplier)

      setScore((prev) => prev + points)
      setCombo((prev) => prev + 1)
      setMaxCombo((prev) => Math.max(prev, combo + 1))

      // Add time bonus for correct answers
      const timeBonus = difficulty === "easy" ? 3 : difficulty === "medium" ? 2 : 1
      setTimeRemaining((prev) => Math.min(totalTime, prev + timeBonus))
    } else {
      // Reset combo on wrong answer
      setCombo(0)
    }

    // Automatically move to next word after a short delay
    setTimeout(() => {
      moveToNextWord()
    }, 500)
  }

  // Move to the next word
  const moveToNextWord = () => {
    // Cycle through words or pick random ones
    let nextIndex = (currentWordIndex + 1) % words.length

    // For hard mode, pick random words
    if (difficulty === "hard") {
      nextIndex = Math.floor(Math.random() * words.length)
    }

    setCurrentWordIndex(nextIndex)
    setSelectedOption(null)
    setIsCorrect(null)
    generateOptions(words[nextIndex], words)

    // Scroll options container to top
    if (optionsRef.current) {
      optionsRef.current.scrollTop = 0
    }
  }

  // Utility function to shuffle an array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`rapid-fire-${currentWordIndex}-${answeredWords}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline" className="text-sm bg-white dark:bg-gray-800">
            Rapid Fire Mode
          </Badge>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <Clock className="h-3 w-3 mr-1" /> {timeRemaining}s
            </Badge>
            <Badge
              variant="outline"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
            >
              <Trophy className="h-3 w-3 mr-1" /> {score} pts
            </Badge>
            <Badge
              variant="outline"
              className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
            >
              <Zap className="h-3 w-3 mr-1" /> {combo}x Combo
            </Badge>
          </div>
        </div>

        <Progress
          value={(timeRemaining / totalTime) * 100}
          className="h-2 bg-violet-100 dark:bg-violet-900"
          indicatorClassName="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500"
        />

        <Card className="shadow-xl border-0 mt-4 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950 dark:border-violet-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                {words[currentWordIndex]?.category || ""}
              </Badge>
              <Badge className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800">
                {words[currentWordIndex]?.type || ""}
              </Badge>
            </div>
            <CardTitle className="text-4xl font-bold mt-4 bg-gradient-to-r from-violet-700 to-indigo-700 dark:from-violet-400 dark:to-indigo-400 text-transparent bg-clip-text">
              {words[currentWordIndex]?.word || ""}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <div className="space-y-3">
              <h3 className="font-medium text-lg text-violet-800 dark:text-violet-300">
                Choose the correct definition:
              </h3>
              <div className="grid gap-3" ref={optionsRef}>
                {options.map((option, index) => (
                  <motion.div
                    key={`${currentWordIndex}-${index}`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Button
                      variant={
                        selectedOption === option
                          ? option === words[currentWordIndex]?.definition
                            ? "default"
                            : "destructive"
                          : "outline"
                      }
                      className={`justify-start h-auto py-4 px-4 font-normal text-left w-full ${
                        selectedOption === option
                          ? option === words[currentWordIndex]?.definition
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                          : "border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-800 dark:hover:bg-violet-900/30 dark:hover:text-violet-300"
                      }`}
                      onClick={() => handleOptionSelect(option)}
                      disabled={isCorrect !== null || gameOver}
                    >
                      {option}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
