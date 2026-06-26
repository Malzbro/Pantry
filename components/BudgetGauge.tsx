"use client"

import { useEffect, useState } from "react"
import { gbp } from "@/lib/utils"

type Props = {
  spent: number
  budget: number
}

export function BudgetGauge({ spent, budget }: Props) {
  const [animated, setAnimated] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const pct = budget > 0 ? Math.min((spent / budget) * 100, 120) : 0
  const cappedPct = Math.min(pct, 100)

  const isOver = pct > 100
  const isWarning = pct > 85

  const cx = 60
  const cy = 60
  const r = 50
  const circumference = 2 * Math.PI * r
  const arcLength = (cappedPct / 100) * circumference
  const dashoffset = animated ? circumference - arcLength : circumference

  const fillColor = isOver
    ? "var(--gauge-over, #dc2626)"
    : isWarning
      ? "var(--gauge-warning, #d97706)"
      : "var(--accent)"

  return (
    <div>
      <div className="flex justify-between items-baseline text-xs uppercase tracking-widest text-muted mb-3">
        <span>Budget gauge</span>
        <span className="font-mono">{Math.round(pct)}% used</span>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-center py-2 hover:opacity-90 transition-opacity"
        aria-expanded={expanded}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" className="block">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--chip)"
            strokeWidth="8"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={fillColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: animated ? "stroke-dashoffset 800ms ease-out" : "none",
            }}
          />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="font-mono"
            style={{ fontSize: "16px", fill: "var(--ink)" }}
          >
            {Math.round(pct)}%
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            style={{ fontSize: "10px", fill: "var(--muted)" }}
          >
            {gbp(spent)}
          </text>
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 p-4 rounded-lg bg-chip animate-in fade-in duration-200">
          <p className="text-xs uppercase tracking-widest text-muted mb-3">Per-meal cost</p>
          <p className="text-sm text-muted">
            {gbp(spent)} of {gbp(budget)} budget used
          </p>
          <p className="text-sm text-muted mt-1">
            {gbp(Math.max(0, budget - spent))} remaining
          </p>
        </div>
      )}
    </div>
  )
}
