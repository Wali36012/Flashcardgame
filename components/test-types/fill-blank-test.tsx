"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle, XCircle, Volume2, LightbulbIcon, Clock, Trophy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { WordEntry } from "@/lib/db"

interface FillBlankTestProps {
  words: WordEntry[]
  difficulty: "easy" | "medium" | "hard"
  onComplete: (score: number, totalPossible: number, timeSpent: number) => void
  onExit: () => void
}

export default function FillBlankTest({ words, difficulty, onComplete, onExit }: FillBlankTestProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [timerActive, setTimerActive] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const [startTime] = useState(Date.now())
  const [blankSentence, setBlankSentence] = useState("")

  // Initialize the test
  useEffect(() => {
    if (words.length > 0) {
      generateBlankSentence(words[0])
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
        handleSubmit()
      }
    }
    return () => clearTimeout(timer)
  }, [timerActive, timeRemaining, isCorrect])

  // Generate a sentence with a blank for the current word
  const generateBlankSentence = (word: WordEntry) => {
    const example = word.example
    // Replace the word with a blank
    const regex = new RegExp(`\\b${word.word}\\b`, "i")
    const sentence = example.replace(regex, "________")
    setBlankSentence(sentence)
  }

  // Handle form submission
  const handleSubmit = () => {
    if (isCorrect !== null) return // Prevent multiple submissions

    const currentWord = words[currentWordIndex]
    // Check if the answer is correct (case insensitive)
    const correct = userAnswer.toLowerCase() === currentWord.word.toLowerCase()

    // Stop the timer
    setTimerActive(false)

    // Calculate points based on difficulty and time remaining
    let pointsEarned = 0
    if (correct) {
      const difficultyMultiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3
      const timeBonus = Math.floor(timeRemaining / 5)
      pointsEarned = 15 * difficultyMultiplier + timeBonus // Fill-in-blank is harder, so more points
    }

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
      setUserAnswer("")
      setIsCorrect(null)
      setShowHint(false)
      generateBlankSentence(words[nextIndex])
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
      onComplete(score, words.length * 25, timeSpent)
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`fill-blank-${currentWordIndex}`}
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
            <CardTitle className="text-2xl font-bold mt-4 bg-gradient-to-r from-violet-700 to-indigo-700 dark:from-violet-400 dark:to-indigo-400 text-transparent bg-clip-text">
              Fill in the Blank
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-sm">
                <p className="text-lg">{blankSentence}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="answer" className="font-medium text-violet-800 dark:text-violet-300">
                  Enter the missing word:
                </label>
                <div className="flex gap-2">
                  <Input
                    id="answer"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="border-violet-200 dark:border-violet-800 focus:ring-violet-500"
                    disabled={isCorrect !== null}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && userAnswer.trim() && isCorrect === null) {
                        handleSubmit()
                      }
                    }}
                  />
                  {isCorrect === null && (
                    <Button
                      onClick={handleSubmit}
                      disabled={!userAnswer.trim()}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 dark:from-violet-700 dark:to-indigo-700"
                    >
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {!isCorrect && !showHint && difficulty !== "hard" && isCorrect === null && (
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
                  First letter:{" "}
                  <span className="font-bold">{words[currentWordIndex]?.word.charAt(0).toUpperCase()}</span>
                  <br />
                  Number of letters: <span className="font-bold">{words[currentWordIndex]?.word.length}</span>
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
                      Correct! +{difficulty === "easy" ? "15" : difficulty === "medium" ? "30" : "45"} points
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      Incorrect. The correct answer is:{" "}
                      <span className="font-bold">{words[currentWordIndex]?.word}</span>
                    </>
                  )}
                </h3>
                <div className="mt-3">
                  <p className="font-medium">Definition:</p>
                  <p className="mt-1">{words[currentWordIndex]?.definition}</p>
                </div>
                <div className="flex items-center mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-violet-600 dark:text-violet-400 -ml-2"
                    onClick={() => speakWord(words[currentWordIndex]?.word || "")}
                  >
                    <Volume2 className="h-4 w-4 mr-1" /> Hear pronunciation
                  </Button>
                </div>
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
                Submit your answer to continue
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
