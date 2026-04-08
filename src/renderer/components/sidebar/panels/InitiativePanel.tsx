import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInitiativeStore } from '../../../stores/initiativeStore'
import { useCampaignStore } from '../../../stores/campaignStore'
import { useUIStore } from '../../../stores/uiStore'

function broadcastInitiative() {
  if (useUIStore.getState().sessionMode === 'prep') return
  const { entries } = useInitiativeStore.getState()
  window.electronAPI?.sendInitiative(
    entries.map((e) => ({ name: e.combatantName, roll: e.roll, current: e.currentTurn }))
  )
}

export function InitiativePanel() {
  const { t } = useTranslation()
  const { entries, round, addEntry, removeEntry, updateEntry, sortEntries, nextTurn, resetCombat } = useInitiativeStore()
  const { activeMapId } = useCampaignStore()
  const [name, setName] = useState('')
  const [roll, setRoll] = useState('')
  const [editingRollId, setEditingRollId] = useState<number | null>(null)
  const [editRollValue, setEditRollValue] = useState('')

  async function handleAdd() {
    if (!name.trim() || !activeMapId || !window.electronAPI) return
    const rollVal = parseInt(roll) || 0
    try {
      const result = await window.electronAPI.dbRun(
        `INSERT INTO initiative (map_id, combatant_name, roll) VALUES (?, ?, ?)`,
        [activeMapId, name.trim(), rollVal]
      )
      addEntry({
        id: result.lastInsertRowid,
        mapId: activeMapId,
        combatantName: name.trim(),
        roll: rollVal,
        currentTurn: entries.length === 0,
      })
      setName('')
      setRoll('')
      broadcastInitiative()
    } catch (err) {
      console.error('[InitiativePanel] handleAdd failed:', err)
    }
  }

  function handleSort() {
    sortEntries()
    broadcastInitiative()
  }

  function handleNextTurn() {
    nextTurn()
    broadcastInitiative()
  }

  function handleReset() {
    resetCombat()
    broadcastInitiative()
    if (activeMapId && window.electronAPI) {
      window.electronAPI.dbRun('DELETE FROM initiative WHERE map_id = ?', [activeMapId]).catch((err: unknown) => {
        console.error('[InitiativePanel] reset delete failed:', err)
      })
    }
  }

  function startEditRoll(entryId: number, currentRoll: number) {
    setEditingRollId(entryId)
    setEditRollValue(String(currentRoll))
  }

  async function commitEditRoll(entryId: number) {
    const newRoll = parseInt(editRollValue)
    if (isNaN(newRoll)) {
      setEditingRollId(null)
      return
    }
    updateEntry(entryId, { roll: newRoll })
    try {
      await window.electronAPI?.dbRun('UPDATE initiative SET roll = ? WHERE id = ?', [newRoll, entryId])
      broadcastInitiative()
    } catch (err) {
      console.error('[InitiativePanel] commitEditRoll failed:', err)
    }
    setEditingRollId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
          <div className="sidebar-section-title">{t('initiative.title', { round })}</div>
          <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 'var(--text-xs)', padding: '2px 6px' }}
              onClick={handleSort}
              title="Sortieren"
            >
              ↕ Sortieren
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 'var(--text-xs)', padding: '2px 6px' }}
              onClick={handleNextTurn}
              title="Nächster Kämpfer [N]"
            >
              ▶ Weiter
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', color: 'var(--danger)' }}
              onClick={handleReset}
              title="Kampf beenden"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Add entry */}
        <div style={{ display: 'flex', gap: 'var(--sp-1)', marginBottom: 'var(--sp-2)' }}>
          <input
            className="input"
            placeholder={t('initiative.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            className="input"
            placeholder={t('initiative.rollPlaceholder')}
            type="number"
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            style={{ width: 52 }}
          />
          <button className="btn btn-primary btn-icon" onClick={handleAdd}>+</button>
        </div>
      </div>

      {/* Combatant list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {entries.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--sp-6)' }}>
            <div className="empty-state-icon" style={{ fontSize: 32 }}>⚔️</div>
            <div className="empty-state-title" style={{ fontSize: 'var(--text-sm)' }}>{t('initiative.noCombat')}</div>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                padding: 'var(--sp-2) var(--sp-4)',
                borderBottom: '1px solid var(--border-subtle)',
                background: entry.currentTurn ? 'var(--accent-dim)' : 'transparent',
                borderLeft: entry.currentTurn ? '3px solid var(--accent)' : '3px solid transparent',
              }}
            >
              {editingRollId === entry.id ? (
                <input
                  autoFocus
                  type="number"
                  value={editRollValue}
                  onChange={(e) => setEditRollValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEditRoll(entry.id)
                    if (e.key === 'Escape') setEditingRollId(null)
                  }}
                  onBlur={() => commitEditRoll(entry.id)}
                  style={{
                    width: 32,
                    background: '#182130',
                    border: '1px solid #2F6BFF',
                    borderRadius: 3,
                    color: '#F4F6FA',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    padding: '1px 4px',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
              ) : (
                <span
                  onDoubleClick={() => startEditRoll(entry.id, entry.roll)}
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    minWidth: 20,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                  title="Doppelklick zum Bearbeiten"
                >
                  {entry.roll}
                </span>
              )}
              <span style={{
                flex: 1,
                fontSize: 'var(--text-sm)',
                fontWeight: entry.currentTurn ? 600 : 400,
                color: entry.currentTurn ? 'var(--accent-light)' : 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {entry.currentTurn ? '▶ ' : ''}{entry.combatantName}
              </span>
              <button
                className="btn btn-ghost btn-icon"
                style={{ fontSize: 10, padding: 2 }}
                title={t('initiative.removeEntry') ?? '✕'}
                aria-label={t('initiative.removeEntry') ?? '✕'}
                onClick={() => {
                  window.electronAPI?.dbRun('DELETE FROM initiative WHERE id = ?', [entry.id])
                  removeEntry(entry.id)
                  broadcastInitiative()
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
