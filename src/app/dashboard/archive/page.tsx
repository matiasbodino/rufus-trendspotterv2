"use client"

import { useState, useEffect } from "react"
import { Archive, Search, RefreshCw, Loader2 } from "lucide-react"

interface ArchivedTrend {
  id: string
  name: string
  platform: string
  score: number
  activationWindow: string
  status: string
  statusChangedBy: string | null
  statusChangedAt: string | null
  createdAt: string
  description: string
  tags: string[]
}

export default function ArchivePage() {
  const [trends, setTrends] = useState<ArchivedTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const load = () => {
    setLoading(true)
    fetch("/api/trends?archived=true")
      .then((r) => r.json())
      .then((d) => setTrends(d.trends || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = trends.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  )

  const platformColors: Record<string, string> = {
    "Google Trends": "bg-blue-500/20 text-blue-400",
    TikTok: "bg-pink-500/20 text-pink-400",
    Instagram: "bg-purple-500/20 text-purple-400",
    X: "bg-gray-500/20 text-gray-400",
    Reddit: "bg-orange-500/20 text-orange-400",
    Pinterest: "bg-red-500/20 text-red-400",
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "hoy"
    if (days === 1) return "ayer"
    if (days < 7) return `hace ${days}d`
    if (days < 30) return `hace ${Math.floor(days / 7)}sem`
    return `hace ${Math.floor(days / 30)}m`
  }

  const restore = async (id: string) => {
    await fetch("/api/trends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "NEW", changedBy: "manual-restore" }),
    })
    load()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Archive className="w-6 h-6 text-gray-500" />
            Archivo
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Tendencias archivadas — memoria institucional de Rufus
          </p>
        </div>
        <span className="text-xs text-gray-600">{trends.length} tendencias</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-rufus-card border border-rufus-border rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-rufus-purple"
          placeholder="Buscar por nombre, descripción o tag..."
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-rufus-purple animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-rufus-card border border-rufus-border rounded-xl">
          <Archive className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">{search ? "Sin resultados" : "El archivo está vacío"}</p>
          <p className="text-gray-600 text-xs mt-1">Las tendencias vencidas se archivan automáticamente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="bg-rufus-card border border-rufus-border rounded-xl px-5 py-3 flex items-center justify-between hover:border-rufus-border/80 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white text-sm font-medium truncate">{t.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${platformColors[t.platform] || "bg-gray-500/20 text-gray-400"}`}>
                    {t.platform}
                  </span>
                  <span className="text-[10px] text-gray-600">Score: {t.score}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600">
                    Detectada {timeAgo(t.createdAt)}
                  </span>
                  {t.statusChangedBy && (
                    <span className="text-[10px] text-gray-600">
                      · Archivada por {t.statusChangedBy}
                    </span>
                  )}
                  {t.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] bg-rufus-bg px-1.5 py-0.5 rounded text-gray-500">{tag}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => restore(t.id)}
                className="text-rufus-purple-light hover:text-rufus-purple text-xs font-medium flex items-center gap-1 ml-3 shrink-0 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
