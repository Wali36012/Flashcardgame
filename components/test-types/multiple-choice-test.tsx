"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, CheckCircle, XCircle, Volume2, LightbulbIcon, Clock, Trophy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { WordEntry } from "@/lib/db"

interface MultipleChoiceTestProps {
  words: WordEntry[]
  difficulty: "easy" | "medium" | "hard"
  onComplete: (score: number, totalPossible: number, timeSpent: number) => void
  onExit: () => void
}

export default function MultipleChoiceTest({ words, difficulty, onComplete, onExit }: MultipleChoiceTestProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [timerActive, setTimerActive] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const [startTime] = useState(Date.now())

  // Initialize the test
  useEffect(() => {
    if (words.length > 0) {
      generateOptions(words[0], words)
    }

    // Set timer based on difficulty
    if (difficulty === "easy") {
      setTimeRemaining(45)
    } else if (difficulty === "medium") {
      setTimeRemaining(30)
    } else {
      setTimeRemaining(20)
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
      // Time's up - move to next question or end game
      if (isCorrect === null) {
        handleOptionSelect("TIME_UP")
      }
    }
    return () => clearTimeout(timer)
  }, [timerActive, timeRemaining, isCorrect])

  // Generate multiple choice options
  const generateOptions = (currentWord: WordEntry, allWords: WordEntry[]) => {
    const correctDefinition = currentWord.definition
    const otherWords = allWords.filter((word) => word.id !== currentWord.id)

    // Adjust number of options based on difficulty
    const numOptions = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5
    const shuffledOtherWords = shuffleArray(otherWords).slice(0, numOptions - 1)

    const allOptions = [correctDefinition, ...shuffledOtherWords.map((word) => word.definition)]
    setOptions(shuffleArray(allOptions))
  }

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    if (isCorrect !== null) return // Prevent multiple selections

    const currentWord = words[currentWordIndex]
    const correct = option === currentWord.definition || option === "HINT_USED"

    // Stop the timer
    setTimerActive(false)

    // Calculate points based on difficulty and time remaining
    let pointsEarned = 0
    if (correct) {
      const difficultyMultiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3
      const timeBonus = Math.floor(timeRemaining / 5)
      pointsEarned = 10 * difficultyMultiplier + timeBonus
    }

    setSelectedOption(option)
    setIsCorrect(correct)

    if (correct) {
      setScore(score + pointsEarned)
    }
  }

  // Move to the next word
  const handleNext = () => {
    if (currentWordIndex < words.length - 1) {
      const nextIndex = currentWordIndex + 1
      setCurrentWordIndex(nextIndex)
      setSelectedOption(null)
      setIsCorrect(null)
      setShowHint(false)
      generateOptions(words[nextIndex], words)
      setProgress(Math.round((nextIndex / words.length) * 100))

      // Reset timer for next question
      if (difficulty === "easy") {
        setTimeRemaining(45)
      } else if (difficulty === "medium") {
        setTimeRemaining(30)
      } else {
        setTimeRemaining(20)
      }
      setTimerActive(true)
    } else {
      // Test complete
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      onComplete(score, words.length * 20, timeSpent)
    }
  }

  // Show hint (reduces points)
  const handleShowHint = () => {
    setShowHint(true)
  }

  // Speak the word using text-to-speech
  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      window.speechSynthesis.speak(utterance)
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
        key={`test-${currentWordIndex}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline" className="text-sm bg-white dark:bg-gray-800">
            Question {currentWordIndex + 1} of {words.length}
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
          </div>
        </div>

        <Progress
          value={progress}
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
            <div className="flex items-center justify-between mt-4">
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-indigo-700 dark:from-violet-400 dark:to-indigo-400 text-transparent bg-clip-text">
                {words[currentWordIndex]?.word || ""}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="text-violet-600 dark:text-violet-400"
                onClick={() => speakWord(words[currentWordIndex]?.word || "")}
              >
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <div className="space-y-3">
              <h3 className="font-medium text-lg text-violet-800 dark:text-violet-300">
                Choose the correct definition:
              </h3>
              <div className="grid gap-3">
                {options.map((option, index) => (
                  <motion.div key={index} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      variant={
                        selectedOption === option
                          ? option === words[currentWordIndex]?.definition
                            ? "default"
                            : "destructive"
                          : option === words[currentWordIndex]?.definition && isCorrect !== null
                            ? "default"
                            : "outline"
                      }
                      className={`justify-start h-auto py-4 px-4 font-normal text-left w-full ${
                        selectedOption === option
                          ? option === words[currentWordIndex]?.definition
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                          : option === words[currentWordIndex]?.definition && isCorrect !== null
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            : "border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-800 dark:hover:bg-violet-900/30 dark:hover:text-violet-300"
                      }`}
                      onClick={() => handleOptionSelect(option)}
                      disabled={isCorrect !== null}
                    >
                      {option}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {!isCorrect && !showHint && difficulty !== "hard" && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowHint}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
                >
                  <LightbulbIcon className="h-4 w-4 mr-2" /> Use Hint (-5 points)
                </Button>
              </div>
            )}

            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 dark:border dark:border-amber-800"
              >
                <h3 className="font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <LightbulbIcon className="h-5 w-5" />
                  Hint
                </h3>
                <p className="mt-2">
                  The definition contains the word "
                  {words[currentWordIndex]?.definition.split(" ").slice(0, 3).join(" ")}..."
                </p>
              </motion.div>
            )}

            {isCorrect !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-xl ${isCorrect ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 dark:border dark:border-emerald-800" : "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 dark:border dark:border-rose-800"}`}
              >
                <h3
                  className={`font-semibold flex items-center gap-2 text-lg ${isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Correct! +{difficulty === "easy" ? "10" : difficulty === "medium" ? "20" : "30"} points
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      Incorrect
                    </>
                  )}
                </h3>
                <p className="mt-3 font-medium">Example:</p>
                <p className="italic text-lg mt-1">{words[currentWordIndex]?.example}</p>
              </motion.div>
            )}
          </CardContent>

          <CardFooter className="pt-2 pb-6">
            {isCorrect !== null ? (
              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 dark:from-violet-700 dark:to-indigo-700"
              >
                Next Word <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                disabled
                className="w-full opacity-70 bg-gradient-to-r from-violet-400 to-indigo-400 dark:from-violet-600 dark:to-indigo-600"
              >
                Select an answer to continue
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
