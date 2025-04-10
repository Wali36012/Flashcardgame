"use client"

import { useState, useEffect, useCallback } from "react"
import {
  initDB,
  seedDatabase,
  getUserProgress,
  updateUserProgress,
  getAllWords,
  getWordsByCategory,
  getWordsByIds,
  addTestResult,
  getTestHistory,
  type UserProgress,
  type WordEntry,
  type TestResult,
} from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

type Collection = {
  id: string
  name: string
  description: string
  wordIds: number[]
  createdAt: string
}

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

  // Toggle favorite word
  const toggleFavoriteWord = useCallback(
    async (wordId: number) => {
      if (!userProgress) return

      try {
        const favorites = [...(userProgress.favorites || [])]
        const index = favorites.indexOf(wordId)

        if (index === -1) {
          favorites.push(wordId)
        } else {
          favorites.splice(index, 1)
        }

        await updateProgress({ favorites })
        return index === -1 // Return true if added to favorites
      } catch (err) {
        console.error("Error toggling favorite word:", err)
        setError("Failed to update favorite words")
        return false
      }
    },
    [userProgress, updateProgress],
  )

  // Get favorite words
  const getFavoriteWords = useCallback(async () => {
    if (!userProgress) return []

    try {
      return await getWordsByIds(userProgress.favorites || [])
    } catch (err) {
      console.error("Error getting favorite words:", err)
      setError("Failed to fetch favorite words")
      return []
    }
  }, [userProgress])

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

  // Create a new collection
  const createCollection = useCallback(
    async (name: string, description = "") => {
      if (!userProgress) return

      const newCollection: Collection = {
        id: uuidv4(),
        name,
        description,
        wordIds: [],
        createdAt: new Date().toISOString(),
      }

      const updatedProgress = {
        ...userProgress,
        collections: [...(userProgress.collections || []), newCollection],
      }

      await updateUserProgress(updatedProgress)
      setUserProgress(updatedProgress)
      return newCollection
    },
    [userProgress, updateProgress],
  )

  // Delete a collection
  const deleteCollection = useCallback(
    async (collectionId: string) => {
      if (!userProgress) return

      const updatedProgress = {
        ...userProgress,
        collections: (userProgress.collections || []).filter((c) => c.id !== collectionId),
      }

      await updateUserProgress(updatedProgress)
      setUserProgress(updatedProgress)
    },
    [userProgress, updateProgress],
  )

  // Add a word to a collection
  const addWordToCollection = useCallback(
    async (wordId: number, collectionId: string) => {
      if (!userProgress) return false

      try {
        // Create a deep copy of collections to avoid reference issues
        const updatedCollections = JSON.parse(JSON.stringify(userProgress.collections || []))

        // Find the collection and update it
        const collectionIndex = updatedCollections.findIndex((c: Collection) => c.id === collectionId)

        if (collectionIndex === -1) return false

        // Only add if not already in the collection
        if (!updatedCollections[collectionIndex].wordIds.includes(wordId)) {
          updatedCollections[collectionIndex].wordIds.push(wordId)

          // Update the user progress with the modified collections
          const updatedProgress = {
            ...userProgress,
            collections: updatedCollections,
          }

          await updateUserProgress(updatedProgress)
          setUserProgress(updatedProgress)
          return true
        }

        return false
      } catch (err) {
        console.error("Error adding word to collection:", err)
        return false
      }
    },
    [userProgress, updateUserProgress],
  )

  // Remove a word from a collection
  const removeWordFromCollection = useCallback(
    async (wordId: number, collectionId: string) => {
      if (!userProgress) return

      const updatedCollections = (userProgress.collections || []).map((collection) => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            wordIds: collection.wordIds.filter((id) => id !== wordId),
          }
        }
        return collection
      })

      const updatedProgress = {
        ...userProgress,
        collections: updatedCollections,
      }

      await updateUserProgress(updatedProgress)
      setUserProgress(updatedProgress)
    },
    [userProgress, updateProgress],
  )

  // Get words from a specific collection
  const getCollectionWords = useCallback(
    async (collectionId: string): Promise<WordEntry[]> => {
      if (!userProgress) return []

      try {
        const collection = (userProgress.collections || []).find((c) => c.id === collectionId)
        if (!collection || !collection.wordIds.length) return []

        // Get all words and filter by the collection's wordIds
        const allWords = await getAllWords()
        return allWords.filter((word) => collection.wordIds.includes(word.id))
      } catch (err) {
        console.error("Error getting collection words:", err)
        return []
      }
    },
    [userProgress],
  )

  return {
    isLoading,
    error,
    userProgress,
    words,
    updateProgress,
    toggleLearnedWord,
    toggleFavoriteWord,
    getFavoriteWords,
    recordTestResult,
    fetchWordsByCategory,
    checkAndUpdateStreak,
    createCollection,
    deleteCollection,
    addWordToCollection,
    removeWordFromCollection,
    getCollectionWords,
  }
}
