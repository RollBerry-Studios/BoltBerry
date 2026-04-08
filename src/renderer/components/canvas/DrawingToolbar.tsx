import { useUIStore, type ActiveTool } from '../../stores/uiStore'

const DRAWING_TOOLS: ActiveTool[] = ['draw-freehand', 'draw-rect', 'draw-circle', 'draw-text']

const COLORS = [
  '#ff6b6b', '#f59e0b', '#22c55e', '#3b82f6',
  '#a855f7', '#ec4899', '#ffffff', '#000000',
] as const

const WIDTHS = [
  { label: 'Thin', value: 1 },
  { label: 'Medium', value: 3 },
  { label: 'Thick', value: 6 },
] as const

export function DrawingToolbar() {
  const { activeTool, drawColor, drawWidth, setDrawColor, setDrawWidth } = useUIStore()

  if (!DRAWING_TOOLS.includes(activeTool as ActiveTool)) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '6px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      {COLORS.map((color) => (
        <button
          key={color}
          onClick={() => setDrawColor(color)}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: drawColor === color ? '2px solid var(--accent-blue)' : '2px solid var(--border)',
            background: color === '#ffffff' ? '#fff' : color === '#000000' ? '#000' : color,
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            boxShadow: color === '#000000' ? 'inset 0 0 0 1px rgba(255,255,255,0.2)' : undefined,
          }}
        />
      ))}

      <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />

      {WIDTHS.map((w) => (
        <button
          key={w.value}
          onClick={() => setDrawWidth(w.value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 8px',
            height: 22,
            minWidth: 48,
            background: drawWidth === w.value ? 'var(--accent-blue-dim)' : 'transparent',
            border: drawWidth === w.value ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: drawWidth === w.value ? 'var(--accent-blue-light)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
            fontWeight: drawWidth === w.value ? 600 : 400,
            outline: 'none',
          }}
        >
          {w.label}
        </button>
      ))}
    </div>
  )
}