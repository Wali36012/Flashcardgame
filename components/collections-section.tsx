"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FolderPlus, Folder, Trash2, BookOpen, Brain } from "lucide-react"
import { useDatabase } from "@/hooks/use-db"
import type { Collection } from "@/lib/db"

export default function CollectionsSection({
  onSelectCollection,
  onStartTest,
}: {
  onSelectCollection: (collectionId: string) => void
  onStartTest: (collectionId: string) => void
}) {
  const { userProgress, createCollection, deleteCollection } = useDatabase()
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [newCollectionDesc, setNewCollectionDesc] = useState("")

  useEffect(() => {
    if (userProgress) {
      setCollections(userProgress.collections || [])
      setIsLoading(false)
    }
  }, [userProgress])

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return

    await createCollection(newCollectionName, newCollectionDesc)
    setNewCollectionName("")
    setNewCollectionDesc("")
    setShowCreateDialog(false)
  }

  const handleDeleteCollection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this collection?")) {
      await deleteCollection(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 text-transparent bg-clip-text">
          My Collections
        </h2>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
        >
          <FolderPlus className="mr-2 h-4 w-4" /> Create Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-0 shadow-md">
          <CardContent className="pt-6 pb-6 text-center">
            <Folder className="h-12 w-12 text-emerald-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No Collections Yet</h3>
            <p className="text-muted-foreground mb-4">Create collections to organize your words into custom groups.</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <FolderPlus className="mr-2 h-4 w-4" /> Create Your First Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="border border-emerald-100 dark:border-emerald-900 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectCollection(collection.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
                    {collection.wordIds.length} words
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={(e) => handleDeleteCollection(collection.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {collection.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {new Date(collection.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm line-clamp-2">{collection.description || "No description"}</p>
              </CardContent>
              <CardFooter className="pt-0 pb-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectCollection(collection.id)
                  }}
                >
                  <BookOpen className="mr-2 h-3 w-3" /> View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-900/30"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartTest(collection.id)
                  }}
                >
                  <Brain className="mr-2 h-3 w-3" /> Test
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Collection Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Collection Name
              </label>
              <Input
                id="name"
                placeholder="Enter collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="description"
                placeholder="Enter collection description"
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
