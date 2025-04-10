"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Clock, Trophy, CheckCircle, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { WordEntry } from "@/lib/db"

interface MatchingTestProps {
  words: WordEntry[]
  difficulty: "easy" | "medium" | "hard"
  onComplete: (score: number, totalPossible: number, timeSpent: number) => void
  onExit: () => void
}

export default function MatchingTest({ words, difficulty, onComplete, onExit }: MatchingTestProps) {
  const [currentRound, setCurrentRound] = useState(0)
  const [roundWords, setRoundWords] = useState<WordEntry[]>([])
  const [shuffledDefinitions, setShuffledDefinitions] = useState<string[]>([])
  const [selectedWord, setSelectedWord] = useState<number | null>(null)
  const [selectedDefinition, setSelectedDefinition] = useState<number | null>(null)
  const [matches, setMatches] = useState<Record<number, number>>({})
  const [score, setScore] = useState(0)
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [timerActive, setTimerActive] = useState(true)
  const [roundComplete, setRoundComplete] = useState(false)
  const [startTime] = useState(Date.now())
  const [totalRounds, setTotalRounds] = useState(0)

  // Initialize the test
  useEffect(() => {
    // Determine how many rounds based on difficulty
    const wordsPerRound = difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8
    const rounds = Math.ceil(words.length / wordsPerRound)
    setTotalRounds(rounds)

    // Set up the first round
    setupRound(0, wordsPerRound)

    // Set timer based on difficulty
    const baseTime = difficulty === "easy" ? 60 : difficulty === "medium" ? 90 : 120
    setTimeRemaining(baseTime)
  }, [words, difficulty])

  // Timer for timed mode
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (timerActive && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    } else if (timerActive && timeRemaining === 0) {
      // Time's up - move to next round
      handleNextRound()
    }
    return () => clearTimeout(timer)
  }, [timerActive, timeRemaining])

  // Check if round is complete
  useEffect(() => {
    if (Object.keys(matches).length === roundWords.length) {
      setRoundComplete(true)
      setTimerActive(false)

      // Calculate score for this round
      const correctMatches = Object.entries(matches).filter(
        ([wordIndex, defIndex]) => roundWords[Number.parseInt(wordIndex)].definition === shuffledDefinitions[defIndex],
      ).length

      const difficultyMultiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3
      const timeBonus = Math.floor(timeRemaining / 10)
      const roundScore = correctMatches * 10 * difficultyMultiplier + timeBonus

      setScore((prev) => prev + roundScore)
    }
  }, [matches, roundWords, shuffledDefinitions, timeRemaining, difficulty])

  // Set up a new round
  const setupRound = (roundIndex: number, wordsPerRound: number) => {
    const startIdx = roundIndex * wordsPerRound
    const roundWords = words.slice(startIdx, startIdx + wordsPerRound)
    setRoundWords(roundWords)

    // Shuffle definitions
    const definitions = roundWords.map((word) => word.definition)
    setShuffledDefinitions(shuffleArray(definitions))

    // Reset state for new round
    setMatches({})
    setSelectedWord(null)
    setSelectedDefinition(null)
    setRoundComplete(false)

    // Update progress
    setProgress(Math.round((roundIndex / totalRounds) * 100))
  }

  // Handle word selection
  const handleWordSelect = (index: number) => {
    // If this word is already matched, do nothing
    if (Object.keys(matches).includes(index.toString())) return

    setSelectedWord(index)

    // If a definition is already selected, try to make a match
    if (selectedDefinition !== null) {
      // Create a match
      setMatches((prev) => ({
        ...prev,
        [index]: selectedDefinition,
      }))

      // Reset selections
      setSelectedWord(null)
      setSelectedDefinition(null)
    }
  }

  // Handle definition selection
  const handleDefinitionSelect = (index: number) => {
    // If this definition is already matched, do nothing
    if (Object.values(matches).includes(index)) return

    setSelectedDefinition(index)

    // If a word is already selected, try to make a match
    if (selectedWord !== null) {
      // Create a match
      setMatches((prev) => ({
        ...prev,
        [selectedWord]: index,
      }))

      // Reset selections
      setSelectedWord(null)
      setSelectedDefinition(null)
    }
  }

  // Move to the next round
  const handleNextRound = () => {
    const wordsPerRound = difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8

    if (currentRound < totalRounds - 1) {
      const nextRound = currentRound + 1
      setCurrentRound(nextRound)
      setupRound(nextRound, wordsPerRound)

      // Reset timer for next round
      const baseTime = difficulty === "easy" ? 60 : difficulty === "medium" ? 90 : 120
      setTimeRemaining(baseTime)
      setTimerActive(true)
    } else {
      // Test complete
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      onComplete(score, words.length * 15, timeSpent)
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

  // Check if a word is matched
  const isWordMatched = (index: number) => {
    return Object.keys(matches).includes(index.toString())
  }

  // Check if a definition is matched
  const isDefinitionMatched = (index: number) => {
    return Object.values(matches).includes(index)
  }

  // Check if a match is correct
  const isMatchCorrect = (wordIndex: number) => {
    const defIndex = matches[wordIndex]
    return roundWords[wordIndex].definition === shuffledDefinitions[defIndex]
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`matching-${currentRound}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline" className="text-sm bg-white dark:bg-gray-800">
            Round {currentRound + 1} of {totalRounds}
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
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-indigo-700 dark:from-violet-400 dark:to-indigo-400 text-transparent bg-clip-text">
              Match Words to Definitions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Words Column */}
              <div className="space-y-3">
                <h3 className="font-medium text-lg text-violet-800 dark:text-violet-300">Words</h3>
                <div className="space-y-2">
                  {roundWords.map((word, index) => (
                    <motion.div
                      key={`word-${index}`}
                      whileHover={{ scale: isWordMatched(index) ? 1 : 1.02 }}
                      whileTap={{ scale: isWordMatched(index) ? 1 : 0.98 }}
                    >
                      <Button
                        variant={
                          isWordMatched(index)
                            ? isMatchCorrect(index)
                              ? "default"
                              : "destructive"
                            : selectedWord === index
                              ? "default"
                              : "outline"
                        }
                        className={`justify-start h-auto py-3 px-4 font-medium text-left w-full ${
                          isWordMatched(index)
                            ? isMatchCorrect(index)
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : "bg-gradient-to-r from-rose-500 to-pink-500"
                            : selectedWord === index
                              ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white"
                              : "border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-900/30"
                        }`}
                        onClick={() => handleWordSelect(index)}
                        disabled={isWordMatched(index) || roundComplete}
                      >
                        {word.word}
                        {isWordMatched(index) && (
                          <span className="ml-auto">
                            {isMatchCorrect(index) ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Definitions Column */}
              <div className="space-y-3">
                <h3 className="font-medium text-lg text-indigo-800 dark:text-indigo-300">Definitions</h3>
                <div className="space-y-2">
                  {shuffledDefinitions.map((definition, index) => (
                    <motion.div
                      key={`def-${index}`}
                      whileHover={{ scale: isDefinitionMatched(index) ? 1 : 1.02 }}
                      whileTap={{ scale: isDefinitionMatched(index) ? 1 : 0.98 }}
                    >
                      <Button
                        variant={
                          isDefinitionMatched(index) ? "default" : selectedDefinition === index ? "default" : "outline"
                        }
                        className={`justify-start h-auto py-3 px-4 font-normal text-left w-full ${
                          isDefinitionMatched(index)
                            ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white opacity-70"
                            : selectedDefinition === index
                              ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
                              : "border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/30"
                        }`}
                        onClick={() => handleDefinitionSelect(index)}
                        disabled={isDefinitionMatched(index) || roundComplete}
                      >
                        {definition}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {roundComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950 dark:border dark:border-violet-800"
              >
                <h3 className="font-semibold text-lg text-violet-800 dark:text-violet-300 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Round Complete!
                </h3>
                <p className="mt-2">
                  You matched{" "}
                  {
                    Object.entries(matches).filter(
                      ([wordIndex, defIndex]) =>
                        roundWords[Number.parseInt(wordIndex)].definition === shuffledDefinitions[defIndex],
                    ).length
                  }{" "}
                  out of {roundWords.length} correctly.
                </p>
              </motion.div>
            )}
          </CardContent>

          <CardFooter className="pt-2 pb-6">
            {roundComplete ? (
              <Button
                onClick={handleNextRound}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 dark:from-violet-700 dark:to-indigo-700"
              >
                {currentRound < totalRounds - 1 ? "Next Round" : "Complete Test"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                disabled
                className="w-full opacity-70 bg-gradient-to-r from-violet-400 to-indigo-400 dark:from-violet-600 dark:to-indigo-600"
              >
                Match all words to continue
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
