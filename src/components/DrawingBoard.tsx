import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Line, Rect } from 'react-konva'
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/popover'
// Removed AlertDialog imports

type LineType = { points: number[]; stroke: string; strokeWidth: number }

type Props = { pokemonName?: string }

export default function DrawingBoard({ pokemonName }: Props) {
  const [lines, setLines] = useState<LineType[]>([])
  const [color, setColor] = useState<string>('#000000')
  const [brush, setBrush] = useState<number>(3)
  const isDrawing = useRef(false)
  const stageRef = useRef<any>(null)
  const undoStack = useRef<LineType[][]>([])
  const redoStack = useRef<LineType[][]>([])

  // push current state to undo stack
  const pushUndo = (snapshot: LineType[]) => {
    undoStack.current.push(snapshot.map((l) => ({ ...l, points: [...l.points] })))
    // limit history to 100
    if (undoStack.current.length > 100) undoStack.current.shift()
  }

  const undo = () => {
    const u = undoStack.current
    if (u.length === 0) return
    const prev = u.pop()!
    redoStack.current.push(lines.map((l) => ({ ...l, points: [...l.points] })))
    setLines(prev)
  }

  const redo = () => {
    const r = redoStack.current
    if (r.length === 0) return
    const next = r.pop()!
    undoStack.current.push(lines.map((l) => ({ ...l, points: [...l.points] })))
    setLines(next)
  }


  
  const handlePointerDown = (e: any) => {
    isDrawing.current = true
    const pos = e.target.getStage().getPointerPosition()
    if (!pos) return
    // record snapshot before new stroke
    pushUndo(lines)
    // new action invalidates redo
    redoStack.current = []
    setLines((prev) => [...prev, { points: [pos.x, pos.y], stroke: color, strokeWidth: brush }])
  }

  const handlePointerMove = (e: any) => {
    if (!isDrawing.current) return
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    if (!point) return
    setLines((prev) => {
      const last = prev[prev.length - 1]
      if (!last) return prev
      const updated = prev.slice(0, prev.length - 1)
      updated.push({ ...last, points: last.points.concat([point.x, point.y]) })
      return updated
    })
  }

  const handlePointerUp = () => {
    isDrawing.current = false
  }

  const clear = () => {
    // record state before wiping
    pushUndo(lines)
    redoStack.current = []
    setLines([])
  }

  const save = () => {
    if (!stageRef.current) return
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
    const link = document.createElement('a')
    link.href = dataURL
    link.download = 'drawing.png'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const [hintImage, setHintImage] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [hintError, setHintError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [saveType, setSaveType] = useState<null | 'drawing' | 'comparison'>(null)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [canvasSnapshot, setCanvasSnapshot] = useState<string | null>(null)

  const fetchHint = async () => {
    if (!pokemonName) {
      setHintError('No Pokémon selected')
      return
    }
    setHintLoading(true)
    setHintError(null)
    setHintImage(null)
    try {
      const name = encodeURIComponent(pokemonName.toLowerCase().trim())
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      const data = await res.json()
      const url = data?.sprites?.front_default || null
      if (!url) {
        setHintError('No sprite available')
      } else {
        setHintImage(url)
      }
    } catch (err: any) {
      setHintError(err?.message || 'Failed to fetch')
    } finally {
      setHintLoading(false)
    }
  }

  // fetch artwork URL and capture canvas snapshot; return artwork URL (or null)
  const fetchArtwork = async (): Promise<string | null> => {
    if (!pokemonName) return null
    try {
      const name = encodeURIComponent(pokemonName.toLowerCase().trim())
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      const data = await res.json()
      const url = data?.sprites?.other?.['official-artwork']?.front_default || data?.sprites?.front_default || null
      setArtworkUrl(url)
      if (stageRef.current) {
        const snap = stageRef.current.toDataURL({ pixelRatio: 2 })
        setCanvasSnapshot(snap)
      }
      return url
    } catch (err) {
      setArtworkUrl(null)
      return null
    }
  }

  // wrapper: fetch artwork then show comparison (submitted state)
  const showComparison = async () => {
    setComparisonLoading(true)
    await fetchArtwork()
    setComparisonLoading(false)
    setSubmitted(true)
  }

  // Save logic
  const handleSave = () => {
    setShowSavePrompt(true)
  }

  // Download a single image (drawing or artwork)
  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // Download both images side by side as one image
  const downloadComparison = async () => {
    if (!canvasSnapshot || !artworkUrl) return
    // Create a canvas to combine both images
    const img1 = new window.Image()
    const img2 = new window.Image()
    img1.src = canvasSnapshot
    img2.src = artworkUrl
    await Promise.all([
      new Promise((res) => { img1.onload = res }),
      new Promise((res) => { img2.onload = res })
    ])
    const width = img1.width + img2.width
    const height = Math.max(img1.height, img2.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img1, 0, 0)
    ctx.drawImage(img2, img1.width, 0)
    const combinedUrl = canvas.toDataURL('image/png')
    downloadImage(combinedUrl, 'comparison.png')
  }

  // keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const z = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'
      const y = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y'
      const shiftZ = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z'
      if (z && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (y || shiftZ) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex flex-col items-center">
      {!submitted ? (
        <>
          <div className="w-[600px] max-w-full flex gap-2 mb-2">
            <div className="flex-shrink-0">
              <div className="rounded-md px-4 py-1 flex items-center gap-2 border">
                <input
                  aria-label="Color picker"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-8 p-0 border-none"
                />
              </div>
            </div>
            <div className="flex-shrink-0">
              <Popover>
                <PopoverTrigger>
                  <button className="rounded-md px-0 py-0">Brush</button>
                </PopoverTrigger>
                <PopoverContent className="p-3 rounded-md shadow-lg bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="Brush size"
                      type="range"
                      min={1}
                      max={40}
                      value={brush}
                      onChange={(e) => setBrush(Number(e.target.value))}
                      className="w-40"
                    />
                    <span className="min-w-[28px] text-center">{brush}px</span>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-shrink-0">
              <Popover>
                <PopoverTrigger>
                  <button onClick={fetchHint} className="rounded-md px-3 py-2">Hint</button>
                </PopoverTrigger>
                <PopoverContent className="p-3 rounded-md shadow-lg bg-zinc-900">
                  <div className="w-[220px] h-[220px] flex items-center justify-center">
                    {hintLoading ? (
                      <span>Loading...</span>
                    ) : hintError ? (
                      <span className="text-sm">{hintError}</span>
                    ) : hintImage ? (
                      <img
                        src={hintImage}
                        alt="hint"
                        className="max-w-full max-h-full"
                        style={{ filter: 'blur(6px)', objectFit: 'none', transform: 'scale(1.5)', transformOrigin: 'center center' }}
                      />
                    ) : (
                      <span className="text-sm">No hint available</span>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={undo}
                className="rounded-md border border-transparent px-3 py-2 bg-[var(--button-bg,#1a1a1a)] text-current"
                aria-label="Undo (Ctrl/Cmd+Z)"
              >
                Undo
              </button>
              <button
                onClick={redo}
                className="rounded-md border border-transparent px-3 py-2 bg-[var(--button-bg,#1a1a1a)] text-current"
                aria-label="Redo (Ctrl+Y / Ctrl+Shift+Z)"
              >
                Redo
              </button>
              <button
                onClick={clear}
                className="rounded-md border border-transparent px-5 py-2 bg-[var(--button-bg,#1a1a1a)] text-current"
              >
                Clear
              </button>
              <button
                onClick={showComparison}
                disabled={!pokemonName}
                className="rounded-md border border-transparent px-4 py-2 bg-[var(--button-bg,#1a1a1a)] disabled:opacity-50"
              >
                Submit
              </button>
              
            </div>
          </div>
          <Stage
            ref={stageRef}
            width={600}
            height={600}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchEnd={handlePointerUp}
          >
            <Layer>
              <Rect x={0} y={0} width={600} height={600} fill="white" />
              {lines.map((line, i) => (
                <Line key={i} points={line.points} stroke={line.stroke} strokeWidth={line.strokeWidth} tension={0.5} lineCap="round" />
              ))}
            </Layer>
          </Stage>
        </>
      ) : (
        <div className="w-full flex flex-col items-center justify-center py-8">
          <div className="text-2xl font-bold mb-4">Comparison</div>
          <div className="w-full flex items-center justify-center" style={{ minWidth: 600, maxWidth: 900 }}>
            <div className="flex-1 flex flex-col items-center">
              <span className="mb-2">Your Drawing</span>
              {canvasSnapshot ? (
                <img src={canvasSnapshot} alt="your drawing" className="max-w-full max-h-[360px] object-contain" />
              ) : (
                <div className="w-full h-[360px] bg-white/5 flex items-center justify-center">No drawing</div>
              )}
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="mb-2">Official Artwork</span>
              {artworkUrl ? (
                <img src={artworkUrl} alt="official artwork" className="max-w-full max-h-[360px] object-contain" />
              ) : (
                <div className="w-full h-[360px] bg-white/5 flex items-center justify-center">No artwork</div>
              )}
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSave}
              className="rounded-md border border-transparent px-4 py-2 bg-[var(--button-bg,#1a1a1a)]"
            >
              Save
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md border border-transparent px-4 py-2 bg-zinc-700"
            >
              Restart
            </button>
          </div>
        </div>
      )}

      {/* Save prompt */}
      {showSavePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-zinc-900 rounded-lg shadow-lg p-6 min-w-[320px] flex flex-col items-center">
            <div className="mb-4 text-lg font-semibold">Save as...</div>
            <div className="flex gap-4 mb-4">
              <button
                className="rounded-md px-4 py-2 bg-[var(--button-bg,#1a1a1a)]"
                onClick={async () => {
                  setShowSavePrompt(false)
                  setSaveType('drawing')
                  if (canvasSnapshot) downloadImage(canvasSnapshot, 'drawing.png')
                }}
              >
                Drawing
              </button>
              <button
                className="rounded-md px-4 py-2 bg-[var(--button-bg,#1a1a1a)]"
                onClick={async () => {
                  setShowSavePrompt(false)
                  setSaveType('comparison')
                  await downloadComparison()
                }}
              >
                Comparison
              </button>
            </div>
            <button
              className="text-sm text-zinc-400 hover:text-white"
              onClick={() => setShowSavePrompt(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
