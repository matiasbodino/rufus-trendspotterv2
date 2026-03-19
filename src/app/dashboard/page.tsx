"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Platform, TrendStatus, Market, TrendCard as TrendCardType } from "@/lib/types"
import TrendFilters from "@/components/TrendFilters"
import TrendCardComponent from "@/components/TrendCard"
import TrendDetail from "@/components/TrendDetail"
import { TrendingUp, Zap, Clock, BarChart3, Loader2, ArrowUpDown, Sparkles, FileText, RefreshCw } from "lucide-react"

type SortOption = "score" | "newest" | "window"

export default function DashboardPage() {
  const [trends, setTrends] = useState<TrendCardType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all")
  const [filterStatus, setFilterStatus] = useState<TrendStatus | "all">("all")
  const [filterMarket, setFilterMarket] = useState<Market | "all">("all")
  const [sortBy, setSortBy] = useState<SortOption>("score")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTrends = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterPlatform !== "all") params.set("platform", filterPlatform)
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterMarket !== "all") params.set("market", filterMarket)

      const res = await fetch(`/api/trends?${params.toString()}`)
      const data = await res.json()
      setTrends(data.trends || [])
      setLastUpdate(new Date())
    } catch (err) {
      console.error("Failed to fetch trends:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterPlatform, filterStatus, filterMarket])

  useEffect(() => {
    setLoading(true)
    fetchTrends()
  }, [fetchTrends])

  const sorted = useMemo(() => {
    const arr = [...trends]
    switch (sortBy) {
      case "score":
        return arr.sort((a, b) => b.score - a.score)
      case "newest":
        return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case "window":
        const windowOrder = { URGENTE: 0, NORMAL: 1, PUEDE_ESPERAR: 2 }
        return arr.sort((a, b) => windowOrder[a.activationWindow] - windowOrder[b.activationWindow])
      default:
        return arr
    }
  }, [trends, sortBy])

  // Top Pick — highest score NEW trend
  const topPick = useMemo(() => {
    return trends
      .filter((t) => t.status === "NEW")
      .sort((a, b) => b.score - a.score)[0] || null
  }, [trends])

  // Rest of trends (excluding top pick)
  const restTrends = useMemo(() => {
    if (!topPick) return sorted
    return sorted.filter((t) => t.id !== topPick.id)
  }, [sorted, topPick])

  const activeTrend = trends.find((t) => t.id === selectedTrend) || null

  const handleStatusChange = async (trendId: string, status: TrendStatus) => {
    try {
      await fetch("/api/trends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trendId, status }),
      })
      setTrends((prev) =>
        prev.map((t) => (t.id === trendId ? { ...t, status } : t))
      )
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  // Stats
  const urgentCount = trends.filter((t) => t.activationWindow === "URGENTE" && t.status === "NEW").length
  const avgScore = trends.length > 0
    ? (trends.reduce((sum, t) => sum + t.score, 0) / trends.length).toFixed(1)
    : "0"
  const newCount = trends.filter((t) => t.status === "NEW").length
  const activatedCount = trends.filter((t) => t.status === "ACTIVATED").length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-rufus-purple" />
            Feed de Tendencias
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Tendencias culturales detectadas — Argentina
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-[11px] text-gray-600">
              Última actualización: {lastUpdate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={async () => {
              setRefreshing(true)
              try {
                await fetch("/api/cron/fetch-google-trends")
                await fetchTrends()
              } catch (err) {
                console.error(err)
                setRefreshing(false)
              }
            }}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-rufus-card transition-colors text-gray-500 hover:text-rufus-purple-light disabled:opacity-50"
            title="Buscar nuevas tendencias"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Zap className="w-4 h-4" />} label="Detectadas" value={String(trends.length)} color="text-rufus-purple" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Urgentes" value={String(urgentCount)} color="text-red-400" />
        <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Score promedio" value={avgScore} color="text-yellow-400" />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Activadas" value={String(activatedCount)} color="text-green-400" />
      </div>

      {/* Top Pick */}
      {topPick && (
        <div className="mb-6 bg-gradient-to-r from-rufus-purple/20 to-rufus-purple/5 border border-rufus-purple/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-rufus-purple-light" />
            <span className="text-xs font-bold text-rufus-purple-light uppercase tracking-wider">Top Pick de hoy</span>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{topPick.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{topPick.description}</p>
              {(topPick as any).creativeAngle && (
                <p className="text-sm text-rufus-purple-light italic mb-3">
                  💡 {(topPick as any).creativeAngle}
                </p>
              )}
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  topPick.activationWindow === "URGENTE" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {topPick.activationWindow === "URGENTE" ? "🔴 Urgente" : "🟡 Normal"}
                </span>
                {topPick.durability && (
                  <span className="text-xs text-gray-500">
                    {topPick.durability === "FLASH" ? "⚡ Flash" : topPick.durability === "WEEKS" ? "📈 Semanas" : "📅 Días"}
                  </span>
                )}
                <button
                  onClick={() => setSelectedTrend(topPick.id)}
                  className="bg-rufus-purple hover:bg-rufus-purple-dark text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Generar brief
                </button>
              </div>
            </div>
            <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ml-4 ${
              topPick.score >= 8 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
            }`}>
              <span className="text-2xl font-bold leading-none">{topPick.score.toFixed(1)}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-70">score</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters + Sort */}
      <div className="flex items-center justify-between mb-6">
        <TrendFilters
          selectedPlatform={filterPlatform}
          selectedStatus={filterStatus}
          selectedMarket={filterMarket}
          onPlatformChange={setFilterPlatform}
          onStatusChange={setFilterStatus}
          onMarketChange={setFilterMarket}
        />
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
          {(
            [
              { key: "score", label: "Top Score" },
              { key: "newest", label: "Más nuevas" },
              { key: "window", label: "Más urgentes" },
            ] as { key: SortOption; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                sortBy === key
                  ? "bg-rufus-purple/20 text-rufus-purple-light"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          {restTrends.length} tendencia{restTrends.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-rufus-purple animate-spin" />
          <span className="ml-2 text-gray-500">Cargando tendencias...</span>
        </div>
      )}

      {/* Trend grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restTrends.map((trend) => (
            <TrendCardComponent
              key={trend.id}
              trend={trend}
              onSelect={setSelectedTrend}
            />
          ))}
        </div>
      )}

      {!loading && restTrends.length === 0 && !topPick && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No se encontraron tendencias. Los cron jobs van a ir agregando tendencias automáticamente.
          </p>
        </div>
      )}

      {/* Detail panel */}
      {activeTrend && (
        <TrendDetail
          trend={activeTrend}
          onClose={() => setSelectedTrend(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-rufus-card border border-rufus-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-gray-500 uppercase">{label}</span>
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  )
}
