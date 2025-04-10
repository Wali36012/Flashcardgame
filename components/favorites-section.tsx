"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Volume2, BookOpen, Brain } from "lucide-react"
import { useDatabase } from "@/hooks/use-db"
import type { WordEntry } from "@/lib/db"

export default function FavoritesSection({ onStartTest }: { onStartTest: () => void }) {
  const { getFavoriteWords } = useDatabase()
  const [favorites, setFavorites] = useState<WordEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true)
      const words = await getFavoriteWords()
      setFavorites(words)
      setIsLoading(false)
    }

    loadFavorites()
  }, [getFavoriteWords])

  // Speak the word using text-to-speech
  const speakWord = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      window.speechSynthesis.speak(utterance)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950 border-0 shadow-md">
        <CardContent className="pt-6 pb-6 text-center">
          <Heart className="h-12 w-12 text-pink-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">No Favorite Words Yet</h3>
          <p className="text-muted-foreground mb-4">
            Mark words as favorites by clicking the heart icon while learning.
          </p>
          <Button
            variant="outline"
            className="border-pink-200 text-pink-700 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-900/30"
          >
            <BookOpen className="mr-2 h-4 w-4" /> Start Learning
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-400 dark:to-rose-400 text-transparent bg-clip-text">
          Favorite Words
        </h2>
        <Button
          onClick={onStartTest}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
        >
          <Brain className="mr-2 h-4 w-4" /> Test Favorites
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {favorites.map((word) => (
          <Card key={word.id} className="border border-pink-100 dark:border-pink-900">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                  {word.category}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-violet-600 dark:text-violet-400 h-8 w-8"
                  onClick={() => speakWord(word.word)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="mt-2 text-xl font-bold text-pink-700 dark:text-pink-400">{word.word}</CardTitle>
              <CardDescription className="text-sm">{word.type}</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Definition:</p>
              <p className="text-sm mb-2">{word.definition}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Example:</p>
              <p className="text-sm italic">{word.example}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
