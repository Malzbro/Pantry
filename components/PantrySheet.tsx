"use client"

import { useState, useEffect } from "react"
import {
  listPantry,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  type PantryItem,
} from "@/lib/api"

function formatQuantity(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(1)}kg`
  return `${Math.round(g)}g`
}

export function PantrySheet() {
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [grams, setGrams] = useState("")
  const [adding, setAdding] = useState(false)

  const load = async () => {
    try {
      const data = await listPantry()
      setItems(data.items)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const g = parseFloat(grams)
    if (!name.trim() || isNaN(g) || g <= 0) return
    setAdding(true)
    try {
      await addPantryItem(name.trim(), g)
      setName("")
      setGrams("")
      await load()
    } catch {
      /* silent */
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id))
    try {
      await deletePantryItem(id)
    } catch {
      await load()
    }
  }

  const handleUpdate = async (id: string, newGrams: number) => {
    if (newGrams <= 0) {
      await handleDelete(id)
      return
    }
    setItems(prev => prev.map(it => it.id === id ? { ...it, quantity_grams: newGrams } : it))
    try {
      await updatePantryItem(id, newGrams)
    } catch {
      await load()
    }
  }

  if (loading) {
    return <p className="text-center text-muted py-8">Loading pantry…</p>
  }

  const grouped = items.reduce<Record<string, PantryItem[]>>((acc, it) => {
    const cat = it.category || "Other"
    ;(acc[cat] ??= []).push(it)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Add item form */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Item name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          className="flex-1 px-3 py-2 rounded-lg border border-line bg-bg text-ink text-sm focus:outline-none focus:border-accent"
        />
        <input
          type="number"
          placeholder="g"
          value={grams}
          onChange={e => setGrams(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          className="w-20 px-3 py-2 rounded-lg border border-line bg-bg text-ink text-sm text-right focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !name.trim() || !grams}
          className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-muted py-4 text-sm">
          Your pantry is empty. Add items you already have at home — they&apos;ll be subtracted from your shopping list.
        </p>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <h4 className="text-xs uppercase tracking-widest text-muted mb-2">{cat}</h4>
            <div className="space-y-1">
              {catItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-chip/50 transition-colors group"
                >
                  <span className="text-sm text-ink capitalize">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity_grams - 100)}
                      className="text-xs text-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Reduce by 100g"
                    >
                      −
                    </button>
                    <span className="text-sm font-mono text-muted w-16 text-right">
                      {formatQuantity(item.quantity_grams)}
                    </span>
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity_grams + 100)}
                      className="text-xs text-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Add 100g"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
