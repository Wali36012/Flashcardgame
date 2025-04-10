import FlashcardGame from "@/components/flashcard-game"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="min-h-screen bg-gradient-to-b from-white to-violet-50 dark:from-gray-950 dark:to-violet-950 py-8 px-4">
        <div className="w-full max-w-4xl mx-auto">
          <FlashcardGame />
        </div>
      </main>
    </ThemeProvider>
  )
}
