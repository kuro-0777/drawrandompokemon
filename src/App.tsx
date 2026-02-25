import { useEffect, useState } from 'react'
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
    
    <div className="flex justify-center content-center w-screen">
      
    <div className="flex flex-col max-w-5xl mx-auto p-8 text-center ">
      <h1 className="text-4xl font-bold mb-4 ">Draw a Pokémon from memory</h1>
      <h4 className="text-l mb-4 "> (yes thats the whole point of this site)</h4>
       
      <div className="my-3 flex flex-row justify-center gap-4 items-center">
        <strong>Random Pokémon:</strong>{' '}
        <span className="text-xl" style={{ color: colorFor(selected?.type1) }}>{selected?.name || '—'}</span>
        <div className="mt-2">
          <button onClick={randomize}>Randomize Pokémon</button>
        </div>
      </div>

      <DrawingBoard pokemonName={selected?.name} />
      <p className="opacity-20">Brave shields make it laggy idk why</p>
    </div>

     <a
      href="https://github.com/kuro-0777/drawrandompokemon"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed left-4 bottom-4 flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 text-current px-3 py-1 rounded shadow-sm"
      aria-label="Star drawrandompokemon on GitHub"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 .587l3.668 7.431L24 9.748l-6 5.847L19.335 24 12 19.897 4.665 24 6 15.595 0 9.748l8.332-1.73L12 .587z" />
      </svg>
      <span>Star on GitHub</span>
    </a>
    </div>
  )
}

export default App
