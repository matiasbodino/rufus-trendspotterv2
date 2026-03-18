"use client"

import { BarChart3, Clock, TrendingUp, Users, Zap } from "lucide-react"

export default function MetricsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-rufus-purple" />
          Métricas
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Performance del equipo y adopción de tendencias
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Tiempo promedio de activación"
          value="7 min"
          target="< 10 min"
          icon={<Clock className="w-5 h-5" />}
          status="good"
        />
        <KPICard
          label="Tasa tendencia → brief"
          value="38%"
          target="30-40%"
          icon={<TrendingUp className="w-5 h-5" />}
          status="good"
        />
        <KPICard
          label="Briefs → producción"
          value="45%"
          target="50%"
          icon={<Zap className="w-5 h-5" />}
          status="warning"
        />
        <KPICard
          label="Adopción del equipo"
          value="75%"
          target="80%"
          icon={<Users className="w-5 h-5" />}
          status="warning"
        />
      </div>

      {/* Trends by platform */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-rufus-card border border-rufus-border rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">
            Tendencias por plataforma (últimos 7 días)
          </h3>
          <div className="space-y-3">
            {[
              { platform: "TikTok", count: 12, pct: 100 },
              { platform: "Instagram Reels", count: 8, pct: 66 },
              { platform: "Reddit", count: 6, pct: 50 },
              { platform: "Google Trends", count: 5, pct: 41 },
              { platform: "Pinterest", count: 3, pct: 25 },
            ].map((item) => (
              <div key={item.platform} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-32 flex-shrink-0">
                  {item.platform}
                </span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-rufus-purple to-rufus-purple-light"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-sm text-white font-medium w-8 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-rufus-card border border-rufus-border rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">
            Tendencias por cliente (últimos 7 días)
          </h3>
          <div className="space-y-3">
            {[
              { client: "MercadoLibre", count: 8, pct: 100 },
              { client: "Rappi", count: 7, pct: 87 },
              { client: "Danone", count: 5, pct: 62 },
              { client: "Despegar", count: 4, pct: 50 },
              { client: "NaranjaX", count: 3, pct: 37 },
              { client: "Disney", count: 3, pct: 37 },
              { client: "PedidosYa", count: 2, pct: 25 },
              { client: "CCU", count: 2, pct: 25 },
            ].map((item) => (
              <div key={item.client} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-32 flex-shrink-0">
                  {item.client}
                </span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-rufus-purple to-rufus-purple-light"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-sm text-white font-medium w-8 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity log */}
      <div className="bg-rufus-card border border-rufus-border rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Actividad reciente</h3>
        <div className="space-y-3">
          {[
            {
              action: "Brief generado",
              detail: "POV: cuando te llega el paquete → UGC para MercadoLibre",
              time: "Hace 2h",
              type: "brief",
            },
            {
              action: "Tendencia activada",
              detail: "Escapadas fin de semana cerca de BA → Despegar",
              time: "Hace 5h",
              type: "activated",
            },
            {
              action: "Tendencia descartada",
              detail: "Challenge viral peligroso — no aplica a ningún cliente",
              time: "Hace 8h",
              type: "discarded",
            },
            {
              action: "Digest enviado",
              detail: "5 tendencias enviadas al canal #trendspotter-general",
              time: "Hace 12h",
              type: "digest",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2 border-b border-rufus-border last:border-0"
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  item.type === "brief"
                    ? "bg-rufus-purple"
                    : item.type === "activated"
                    ? "bg-green-400"
                    : item.type === "discarded"
                    ? "bg-red-400"
                    : "bg-blue-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white">{item.action}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {item.detail}
                </span>
              </div>
              <span className="text-xs text-gray-600 flex-shrink-0">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KPICard({
  label,
  value,
  target,
  icon,
  status,
}: {
  label: string
  value: string
  target: string
  icon: React.ReactNode
  status: "good" | "warning" | "bad"
}) {
  const statusColors = {
    good: "text-green-400",
    warning: "text-yellow-400",
    bad: "text-red-400",
  }
  return (
    <div className="bg-rufus-card border border-rufus-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-500">{icon}</span>
        <span className="text-xs text-gray-500 uppercase">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${statusColors[status]}`}>
        {value}
      </span>
      <div className="text-xs text-gray-600 mt-1">
        Objetivo: {target}
      </div>
    </div>
  )
}
