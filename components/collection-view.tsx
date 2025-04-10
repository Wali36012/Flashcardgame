"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Volume2, Heart, CheckCircle, Brain } from "lucide-react"
import { useDatabase } from "@/hooks/use-db"
import type { Collection, WordEntry } from "@/lib/db"

export default function CollectionView({
  collectionId,
  onBack,
  onStartTest,
}: {
  collectionId: string
  onBack: () => void
  onStartTest: () => void
}) {
  const { userProgress, getCollectionWords, toggleFavoriteWord, toggleLearnedWord, removeWordFromCollection } =
    useDatabase()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [words, setWords] = useState<WordEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCollection = async () => {
      setIsLoading(true)
      if (userProgress) {
        const foundCollection = userProgress.collections.find((c) => c.id === collectionId)
        setCollection(foundCollection || null)

        if (foundCollection) {
          try {
            const collectionWords = await getCollectionWords(collectionId)
            console.log("Loaded collection words:", collectionWords.length)
            setWords(collectionWords)
          } catch (err) {
            console.error("Error loading collection words:", err)
          }
        }
      }
      setIsLoading(false)
    }

    loadCollection()
  }, [collectionId, userProgress, getCollectionWords])

  // Speak the word using text-to-speech
  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleRemoveWord = async (wordId: number) => {
    if (confirm("Remove this word from the collection?")) {
      await removeWordFromCollection(wordId, collectionId)
      setWords(words.filter((word) => word.id !== wordId))
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-bold">Collection not found</h3>
        <Button onClick={onBack} className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Collections
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 text-transparent bg-clip-text">
            {collection.name}
          </h1>
          {collection.description && <p className="text-muted-foreground mt-1">{collection.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={onStartTest}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            disabled={words.length === 0}
          >
            <Brain className="mr-2 h-4 w-4" /> Test Collection
          </Button>
        </div>
      </div>

      {words.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <h3 className="text-xl font-medium mb-2">No Words in Collection</h3>
            <p className="text-muted-foreground mb-4">
              Add words to this collection while learning or browsing your favorites.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {words.map((word) => (
            <Card key={word.id} className="border border-emerald-100 dark:border-emerald-900">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                    {word.category}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-emerald-600 dark:text-emerald-400 h-8 w-8"
                      onClick={() => speakWord(word.word)}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${userProgress?.favorites?.includes(word.id) ? "text-pink-500" : "text-gray-400 dark:text-gray-500"}`}
                      onClick={() => toggleFavoriteWord(word.id)}
                    >
                      {userProgress?.favorites?.includes(word.id) ? (
                        <Heart className="h-4 w-4 fill-pink-500" />
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${userProgress?.learned.includes(word.id) ? "text-emerald-500" : "text-gray-400 dark:text-gray-500"}`}
                      onClick={() => toggleLearnedWord(word.id)}
                    >
                      {userProgress?.learned.includes(word.id) ? (
                        <CheckCircle className="h-4 w-4 fill-emerald-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {word.word}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{word.type}</p>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Definition:</p>
                <p className="text-sm mb-2">{word.definition}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Example:</p>
                <p className="text-sm italic mb-3">{word.example}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  onClick={() => handleRemoveWord(word.id)}
                >
                  Remove from collection
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
