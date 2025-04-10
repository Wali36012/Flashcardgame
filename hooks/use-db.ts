"use client"

import { useState, useEffect, useCallback } from "react"
import {
  initDB,
  seedDatabase,
  getUserProgress,
  updateUserProgress,
  getAllWords,
  getWordsByCategory,
  addTestResult,
  getTestHistory,
  type UserProgress,
  type WordEntry,
  type TestResult,
} from "@/lib/db"

export function useDatabase() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [words, setWords] = useState<WordEntry[]>([])

  // Initialize the database
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        await initDB()
        await seedDatabase()

        // Load initial data
        const progress = await getUserProgress()
        setUserProgress(progress)

        // Make sure to get the latest words after seeding
        const allWords = await getAllWords()
        setWords(allWords)

        setIsLoading(false)
      } catch (err) {
        console.error("Database initialization error:", err)
        setError("Failed to initialize database. Please refresh the page.")
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Update user progress
  const updateProgress = useCallback(
    async (updatedProgress: Partial<UserProgress>) => {
      if (!userProgress) return

      try {
        const newProgress = { ...userProgress, ...updatedProgress }
        await updateUserProgress(newProgress)
        setUserProgress(newProgress)
      } catch (err) {
        console.error("Error updating progress:", err)
        setError("Failed to update progress")
      }
    },
    [userProgress],
  )

  // Add a word to learned list
  const toggleLearnedWord = useCallback(
    async (wordId: number) => {
      if (!userProgress) return

      try {
        const learned = [...userProgress.learned]
        const index = learned.indexOf(wordId)

        if (index === -1) {
          learned.push(wordId)
        } else {
          learned.splice(index, 1)
        }

        const experience = userProgress.experience + (index === -1 ? 5 : -5)

        await updateProgress({ learned, experience })
      } catch (err) {
        console.error("Error toggling learned word:", err)
        setError("Failed to update learned words")
      }
    },
    [userProgress, updateProgress],
  )

  // Record a test result
  const recordTestResult = useCallback(
    async (result: TestResult) => {
      if (!userProgress) return

      try {
        await addTestResult(result)
        const testHistory = await getTestHistory()
        await updateProgress({ testHistory })
      } catch (err) {
        console.error("Error recording test result:", err)
        setError("Failed to save test result")
      }
    },
    [userProgress, updateProgress],
  )

  // Get words by category
  const fetchWordsByCategory = useCallback(
    async (category: string | null) => {
      try {
        if (category) {
          const categoryWords = await getWordsByCategory(category)
          return categoryWords
        } else {
          return words
        }
      } catch (err) {
        console.error("Error fetching words by category:", err)
        setError("Failed to fetch words")
        return []
      }
    },
    [words],
  )

  // Check and update streak
  const checkAndUpdateStreak = useCallback(async () => {
    if (!userProgress) return

    try {
      const today = new Date().toDateString()

      if (userProgress.lastPlayed !== today) {
        // Check if the last played date was yesterday
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const wasYesterday = userProgress.lastPlayed === yesterday.toDateString()

        const streakDays = wasYesterday ? userProgress.streakDays + 1 : 1
        await updateProgress({
          lastPlayed: today,
          streakDays,
        })
      }
    } catch (err) {
      console.error("Error updating streak:", err)
      setError("Failed to update streak")
    }
  }, [userProgress, updateProgress])

  return {
    isLoading,
    error,
    userProgress,
    words,
    updateProgress,
    toggleLearnedWord,
    recordTestResult,
    fetchWordsByCategory,
    checkAndUpdateStreak,
  }
}
