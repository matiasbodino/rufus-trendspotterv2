"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  TrendingUp,
  LayoutDashboard,
  BarChart3,
  Zap,
  Sparkles,
  Dna,
  Trophy,
  Menu,
  X,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Feed", icon: LayoutDashboard },
  { href: "/dashboard/pack", label: "Creative Pack", icon: Sparkles },
  { href: "/dashboard/sprint", label: "Sprint Mode", icon: Zap },
  { href: "/dashboard/dna", label: "Trend DNA", icon: Dna },
  { href: "/dashboard/scorecard", label: "Scorecard", icon: Trophy },
  { href: "/dashboard/metrics", label: "Métricas", icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-rufus-card border-r border-rufus-border flex flex-col transition-all duration-200 z-50 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-rufus-border">
        <div className="w-8 h-8 rounded-lg bg-rufus-purple flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              Trendspotter
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              by Rufus
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-500 hover:text-white transition-colors"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-rufus-purple/20 text-rufus-purple-light font-medium"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-rufus-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rufus-purple" />
            <span className="text-xs text-gray-500">
              Fase 1 — Argentina
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
