import { wordData } from "@/data/word-data"

export type WordEntry = {
  id: number
  word: string
  type: string
  definition: string
  example: string
  category: string
}

export type UserProgress = {
  correct: number[]
  incorrect: number[]
  attempted: number[]
  learned: number[]
  streakDays: number
  lastPlayed: string
  totalScore: number
  achievements: string[]
  level: number
  experience: number
  testHistory: TestResult[]
}

export type TestResult = {
  id: string
  date: string
  testType: string
  score: number
  totalPossible: number
  wordIds: number[]
  timeSpent: number
}

export type TestType =
  | "multipleChoice"
  | "fillBlank"
  | "matching"
  | "spelling"
  | "association"
  | "rapidFire"
  | "crossword"

// Database configuration
const DB_NAME = "flashcardDB"
const DB_VERSION = 1
const STORES = {
  WORDS: "words",
  USER_PROGRESS: "userProgress",
}

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error("IndexedDB error:", event)
      reject("Error opening database")
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object stores
      if (!db.objectStoreNames.contains(STORES.WORDS)) {
        const wordStore = db.createObjectStore(STORES.WORDS, { keyPath: "id" })
        wordStore.createIndex("category", "category", { unique: false })
        wordStore.createIndex("type", "type", { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.USER_PROGRESS)) {
        db.createObjectStore(STORES.USER_PROGRESS, { keyPath: "id" })
      }
    }
  })
}

// Seed the database with initial word data
export const seedDatabase = async (): Promise<void> => {
  try {
    const db = await initDB()
    const transaction = db.transaction(STORES.WORDS, "readwrite")
    const wordStore = transaction.objectStore(STORES.WORDS)

    // Check if we already have words
    const countRequest = wordStore.count()

    countRequest.onsuccess = () => {
      // If we have fewer words than in our data array, add the missing ones
      if (countRequest.result < wordData.length) {
        console.log(`Adding ${wordData.length - countRequest.result} new words to database`)

        // Get existing word IDs to avoid duplicates
        const getAllRequest = wordStore.getAll()
        getAllRequest.onsuccess = () => {
          const existingWords = getAllRequest.result as WordEntry[]
          const existingIds = new Set(existingWords.map((word) => word.id))

          // Add only words that don't already exist in the database
          wordData.forEach((word) => {
            if (!existingIds.has(word.id)) {
              wordStore.add(word)
            }
          })
        }
      }
    }

    transaction.oncomplete = () => {
      db.close()
    }
  } catch (error) {
    console.error("Error seeding database:", error)
  }
}

// Initialize user progress if it doesn't exist
export const initUserProgress = async (): Promise<UserProgress> => {
  try {
    const db = await initDB()
    const transaction = db.transaction(STORES.USER_PROGRESS, "readwrite")
    const progressStore = transaction.objectStore(STORES.USER_PROGRESS)

    return new Promise((resolve) => {
      const getRequest = progressStore.get("user")

      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          // Create default user progress
          const defaultProgress: UserProgress = {
            id: "user",
            correct: [],
            incorrect: [],
            attempted: [],
            learned: [],
            streakDays: 0,
            lastPlayed: "",
            totalScore: 0,
            achievements: [],
            level: 1,
            experience: 0,
            testHistory: [],
          }

          progressStore.add(defaultProgress)
          resolve(defaultProgress)
        } else {
          resolve(getRequest.result as UserProgress)
        }
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error("Error initializing user progress:", error)
    // Fallback default progress
    return {
      id: "user",
      correct: [],
      incorrect: [],
      attempted: [],
      learned: [],
      streakDays: 0,
      lastPlayed: "",
      totalScore: 0,
      achievements: [],
      level: 1,
      experience: 0,
      testHistory: [],
    }
  }
}

// Get user progress
export const getUserProgress = async (): Promise<UserProgress> => {
  try {
    const db = await initDB()
    const transaction = db.transaction(STORES.USER_PROGRESS, "readonly")
    const progressStore = transaction.objectStore(STORES.USER_PROGRESS)

    return new Promise((resolve) => {
      const getRequest = progressStore.get("user")

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result as UserProgress)
        } else {
          // If no progress exists, initialize it
          initUserProgress().then((progress) => resolve(progress))
        }
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error("Error getting user progress:", error)
    return initUserProgress()
  }
}

// Update user progress
export const updateUserProgress = async (progress: UserProgress): Promise<void> => {
  try {
    const db = await initDB()
    const transaction = db.transaction(STORES.USER_PROGRESS, "readwrite")
    const progressStore = transaction.objectStore(STORES.USER_PROGRESS)

    progressStore.put(progress)

    return new Promise((resolve) => {
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
    })
  } catch (error) {
    console.error("Error updating user progress:", error)
  }
}

// Get all words
export const getAllWords = async (): Promise<WordEntry[]> => {
  try {
    const db = await initDB()
    const transaction = db.transaction(STORES.WORDS, "readonly")
    const wordStore = transaction.objectStore(STORES.WORDS)

    return new Promise((resolve) => {
      const getRequest = wordStore.getAll()

      getRequest.onsuccess = () => {
        resolve(getRequest.result as WordEntry[])
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error("Error getting words:", error)
    // Fallback to static data
    return wordData
  }
}

// Get words by category
export const getWordsByCategory = async (category: string): Promise<WordEntry[]> => {
  try {
    const db = await initDB()
    const transaction = db.transaction(STORES.WORDS, "readonly")
    const wordStore = transaction.objectStore(STORES.WORDS)
    const categoryIndex = wordStore.index("category")

    return new Promise((resolve) => {
      const getRequest = categoryIndex.getAll(category)

      getRequest.onsuccess = () => {
        resolve(getRequest.result as WordEntry[])
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error("Error getting words by category:", error)
    // Fallback to filtering static data
    return wordData.filter((word) => word.category === category)
  }
}

// Add a test result to history
export const addTestResult = async (result: TestResult): Promise<void> => {
  try {
    const progress = await getUserProgress()
    progress.testHistory.push(result)
    await updateUserProgress(progress)
  } catch (error) {
    console.error("Error adding test result:", error)
  }
}

// Get test history
export const getTestHistory = async (): Promise<TestResult[]> => {
  try {
    const progress = await getUserProgress()
    return progress.testHistory
  } catch (error) {
    console.error("Error getting test history:", error)
    return []
  }
}
