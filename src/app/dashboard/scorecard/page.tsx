"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Target, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface ScorecardData {
  totalDetected: number
  totalActivated: number
  totalDiscarded: number
  totalBriefs: number
  hitRate: number
  avgScore: number
  topPlatform: string
  topTags: { tag: string; count: number }[]
  activatedTrends: { name: string; result: string | null; score: number }[]
  weeklyComparison: { thisWeek: number; lastWeek: number }
}

export default function ScorecardPage() {
  const [data, setData] = useState<ScorecardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/scorecard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-rufus-purple animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        No hay datos suficientes para el scorecard.
      </div>
    )
  }

  const trend = data.weeklyComparison.thisWeek > data.weeklyComparison.lastWeek ? "up" : data.weeklyComparison.thisWeek < data.weeklyComparison.lastWeek ? "down" : "same"

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-rufus-purple" />
          Weekly Scorecard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Rendimiento del equipo en los últimos 7 días
        </p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatBox label="Detectadas" value={data.totalDetected} icon="📡" />
        <StatBox label="Activadas" value={data.totalActivated} icon="✅" color="text-green-400" />
        <StatBox label="Briefs generados" value={data.totalBriefs} icon="📋" color="text-rufus-purple-light" />
        <StatBox
          label="Tasa de acierto"
          value={`${data.hitRate}%`}
          icon="🎯"
          color={data.hitRate >= 50 ? "text-green-400" : data.hitRate >= 30 ? "text-yellow-400" : "text-red-400"}
        />
      </div>

      {/* Comparison */}
      <div className="bg-rufus-card border border-rufus-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          vs. semana anterior
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-white">{data.weeklyComparison.thisWeek}</span>
          <span className="text-gray-500">tendencias activadas esta semana</span>
          <span className={`text-sm font-medium ${
            trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-gray-400"
          }`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "="} {data.weeklyComparison.lastWeek} la semana pasada
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Top Tags */}
        <div className="bg-rufus-card border border-rufus-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            Tags más frecuentes
          </h3>
          <div className="space-y-2">
            {data.topTags.length > 0 ? data.topTags.map((t) => (
              <div key={t.tag} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">#{t.tag}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/5 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-rufus-purple"
                      style={{ width: `${(t.count / (data.topTags[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{t.count}</span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-600">Sin tags todavía</p>
            )}
          </div>
        </div>

        {/* Top Platform */}
        <div className="bg-rufus-card border border-rufus-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            Plataforma top
          </h3>
          <span className="text-2xl font-bold text-white">{data.topPlatform || "—"}</span>
          <p className="text-xs text-gray-500 mt-1">
            Fuente con más tendencias calificadas esta semana
          </p>
          <div className="mt-4">
            <span className="text-sm text-gray-400">Score promedio: </span>
            <span className={`text-sm font-bold ${
              data.avgScore >= 7 ? "text-green-400" : "text-yellow-400"
            }`}>
              {data.avgScore.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Activated trends with results */}
      <div className="bg-rufus-card border border-rufus-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Tendencias activadas
        </h3>
        {data.activatedTrends.length > 0 ? (
          <div className="space-y-3">
            {data.activatedTrends.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-rufus-border last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-white">{t.name}</span>
                    {t.result && (
                      <p className="text-xs text-gray-500 mt-0.5">📊 {t.result}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">Score {t.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Sin activaciones esta semana</p>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, icon, color = "text-white" }: {
  label: string; value: string | number; icon: string; color?: string
}) {
  return (
    <div className="bg-rufus-card border border-rufus-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-xs text-gray-500 uppercase">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  )
}
