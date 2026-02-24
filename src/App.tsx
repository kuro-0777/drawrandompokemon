import React, { useEffect, useState } from 'react'
import './App.css'
import DrawingBoard from './components/DrawingBoard'

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  const rows: string[][] = []
  for (const line of lines) {
    const row: string[] = []
    let field = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (c === ',' && !inQuotes) {
        row.push(field)
        field = ''
      } else {
        field += c
      }
    }
    row.push(field)
    rows.push(row)
  }
  return rows
}

function App() {
  type Pokemon = { name: string; type1: string }
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [selected, setSelected] = useState<Pokemon | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/pokemon.csv')
      .then((r) => r.text())
      .then((text) => {
        if (!mounted) return
        const rows = parseCSV(text)
        if (rows.length === 0) return
        const header = rows[0].map((h) => h.trim().toLowerCase())
        const nameIdx = header.indexOf('name')
        const typeIdx = header.indexOf('type1')
        if (nameIdx === -1) return
        const list = rows
          .slice(1)
          .map((r) => ({ name: r[nameIdx], type1: typeIdx !== -1 ? r[typeIdx] : '' }))
          .filter((p) => p.name)
        setPokemonList(list)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const randomize = () => {
    if (pokemonList.length === 0) return
    const idx = Math.floor(Math.random() * pokemonList.length)
    setSelected(pokemonList[idx])
  }

  const typeColors: Record<string, string> = {
    normal: '#A8A77A',
    fire: '#EE8130',
    water: '#6390F0',
    electric: '#F7D02C',
    grass: '#7AC74C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6F35FC',
    dark: '#705746',
    steel: '#B7B7CE',
    fairy: '#D685AD',
  }

  const colorFor = (t?: string) => {
    if (!t) return '#000'
    return typeColors[t.toLowerCase()] || '#000'
  }

  return (
    <div>
      <h1>Draw a Pokémon</h1>
      <div style={{ margin: '12px 0' }}>
        <strong>Random Pokémon:</strong>{' '}
        <span style={{ fontSize: 20, color: colorFor(selected?.type1) }}>{selected?.name || '—'}</span>
        <div style={{ marginTop: 8 }}>
          <button onClick={randomize}>Randomize Pokémon</button>
        </div>
      </div>

      <DrawingBoard />
    </div>
  )
}

export default App
