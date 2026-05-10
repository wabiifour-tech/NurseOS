"use client"

import * as React from "react"
import { articles, type Article } from "@/lib/caregrid-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BookOpen,
  Search,
  Plus,
  Heart,
  Clock,
  Star,
  Award,
  TrendingUp,
  FileText,
} from "lucide-react"

const categories = [
  "All Categories",
  "Emergency Care",
  "Maternal Health",
  "Infectious Disease",
  "Pharmacology",
  "Pediatrics",
  "Community Health",
]

const evidenceColors: Record<Article["evidenceLevel"], string> = {
  "Level I": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Level II": "bg-teal-50 text-teal-700 border-teal-200",
  "Level III": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Level IV": "bg-amber-50 text-amber-700 border-amber-200",
  "Level V": "bg-slate-50 text-slate-600 border-slate-200",
}

export default function KnowledgeBankPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("All Categories")

  const featuredArticles = articles.filter(a => a.isFeatured)

  const searchLower = searchQuery.toLowerCase()
  const filtered = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchLower) ||
      a.author.toLowerCase().includes(searchLower) ||
      a.summary.toLowerCase().includes(searchLower)
    const matchesCategory = categoryFilter === "All Categories" || a.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="size-6 text-emerald-600" />
            Knowledge Bank
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evidence-based resources for Nigerian nursing practice
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="size-4" />
          Write Article
        </Button>
      </div>

      {/* Featured Articles */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Star className="size-5 text-amber-500" />
          Featured Articles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredArticles.map(article => (
            <Card key={article.id} className="hover:shadow-md transition-shadow border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
              <CardContent className="p-4 space-y-3">
                <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1">
                  <Star className="size-3 fill-amber-500" />
                  Featured
                </Badge>
                <h3 className="font-semibold text-sm text-slate-900 leading-tight">{article.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{article.author}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {article.readTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={`text-[10px] ${evidenceColors[article.evidenceLevel]}`}>
                    <Award className="size-3 mr-0.5" />
                    {article.evidenceLevel}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="size-3 text-red-400" />
                    {article.likes}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search articles, authors, topics..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(article => (
          <Card key={article.id} className="hover:shadow-md transition-shadow border-slate-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0 bg-slate-50">
                  {article.category}
                </Badge>
                {article.isFeatured && (
                  <Star className="size-4 text-amber-500 fill-amber-500 shrink-0" />
                )}
              </div>

              <h3 className="font-semibold text-sm text-slate-900 leading-tight">{article.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="size-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <FileText className="size-3 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">{article.author}</p>
                    <p className="text-[10px] text-muted-foreground">{article.authorTitle}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Badge className={`text-[10px] ${evidenceColors[article.evidenceLevel]}`}>
                  <Award className="size-3 mr-0.5" />
                  {article.evidenceLevel}
                </Badge>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {article.readTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="size-3 text-red-400" />
                    {article.likes}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No articles found matching your search</p>
        </div>
      )}
    </div>
  )
}
