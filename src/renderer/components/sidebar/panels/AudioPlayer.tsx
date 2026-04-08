import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { useAudioStore } from '../../../stores/audioStore'

export function AudioPlayer() {
  const { t } = useTranslation()
  const {
    filePath, fileName, isPlaying, volume, loop,
    loadFile, play, pause, stop, setVolume, toggleLoop,
  } = useAudioStore()

  async function handleImport() {
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.importFile('audio')
      if (result) loadFile(result.path)
    } catch (err) {
      console.error('[AudioPlayer] handleImport failed:', err)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--sp-4)' }}>
      <div className="sidebar-section-title" style={{ marginBottom: 'var(--sp-3)' }}>
        {t('audio.title')}
      </div>

      <button
        className="btn btn-ghost"
        style={{
          marginBottom: 'var(--sp-3)', textAlign: 'left',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontSize: 'var(--text-xs)',
        }}
        onClick={handleImport}
        title={filePath ?? t('audio.loadFile')}
      >
        {fileName ?? t('audio.loadFile')}
      </button>

      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
        <button
          className="btn btn-primary btn-icon"
          onClick={isPlaying ? pause : play}
          disabled={!filePath}
          title={isPlaying ? t('audio.pause') : t('audio.play')}
          style={{ flex: 1 }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={stop}
          disabled={!filePath}
          title={t('audio.stop')}
        >
          ⏹
        </button>
        <button
          className={clsx('btn btn-icon', loop ? 'btn-primary' : 'btn-ghost')}
          onClick={toggleLoop}
          disabled={!filePath}
          title={t('audio.loop')}
        >
          🔁
        </button>
      </div>

      {loop && isPlaying && (
        <div style={{
          fontSize: 'var(--text-xs)', color: 'var(--accent-green, #22c55e)',
          marginBottom: 'var(--sp-2)', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ animation: 'pulse 2s infinite' }}>🔁</span> Looping
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', flexShrink: 0 }}>
          {t('audio.volume')}
        </span>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{ flex: 1 }}
          disabled={!filePath}
        />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', minWidth: 30, textAlign: 'right' }}>
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  )
}
