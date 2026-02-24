import React, { useRef, useState } from 'react'
import { Stage, Layer, Line, Rect } from 'react-konva'

type LineType = { points: number[]; stroke: string; strokeWidth: number }

export default function DrawingBoard() {
  const [lines, setLines] = useState<LineType[]>([])
  const [color, setColor] = useState<string>('#000000')
  const [brush, setBrush] = useState<number>(3)
  const isDrawing = useRef(false)

  const handlePointerDown = (e: any) => {
    isDrawing.current = true
    const pos = e.target.getStage().getPointerPosition()
    if (!pos) return
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

  const clear = () => setLines([])

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          Color:
          <input
            aria-label="Color picker"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>

        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          Brush:
          <input
            aria-label="Brush size"
            type="range"
            min={1}
            max={40}
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
          />
          <span style={{ minWidth: 28, textAlign: 'center' }}>{brush}px</span>
        </label>

        <button onClick={clear}>Clear</button>
      </div>

      <Stage
        width={800}
        height={400}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
      >
        <Layer>
          <Rect x={0} y={0} width={800} height={400} fill="white" />
          {lines.map((line, i) => (
            <Line key={i} points={line.points} stroke={line.stroke} strokeWidth={line.strokeWidth} tension={0.5} lineCap="round" />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
