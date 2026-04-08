import { useTranslation } from 'react-i18next'
import { useUIStore } from '../stores/uiStore'
import { useInitiativeStore } from '../stores/initiativeStore'
import { useAppStore } from '../stores/appStore'
import { useCampaignStore } from '../stores/campaignStore'
import { APP_VERSION } from '@shared/version'

export function StatusBar() {
  const { t, i18n } = useTranslation()
  const { playerConnected, blackoutActive, sessionMode } = useUIStore()
  const { entries, round } = useInitiativeStore()
  const { saveState, lastSaved } = useAppStore()
  const { activeCampaignId } = useCampaignStore()
  const current = entries.find((e) => e.currentTurn)

  async function handleExport() {
    if (!activeCampaignId || !window.electronAPI) return
    useAppStore.getState().setSaving()
    const result = await window.electronAPI.exportCampaign(activeCampaignId) as { success: boolean; error?: string; canceled?: boolean }
    if (result.success) {
      useAppStore.getState().setSaved()
    } else if (!result.canceled) {
      useAppStore.getState().setSaveError()
    } else {
      useAppStore.getState().setSaved()
    }
  }

  async function handleQuickBackup() {
    if (!activeCampaignId || !window.electronAPI) return
    useAppStore.getState().setSaving()
    const result = await window.electronAPI.quickBackup(activeCampaignId) as {
      success: boolean; filePath?: string; error?: string
    }
    if (result.success) {
      useAppStore.getState().setSaved()
    } else {
      useAppStore.getState().setSaveError()
    }
  }

  async function handleImport() {
    if (!window.electronAPI) return
    const result = await window.electronAPI.importCampaign() as { success: boolean; campaignId?: number; error?: string; canceled?: boolean }
    if (result.success && result.campaignId) {
      const campaigns = await window.electronAPI.dbQuery<{
        id: number; name: string; created_at: string; last_opened: string
      }>('SELECT * FROM campaigns ORDER BY last_opened DESC')
      const { setCampaigns, setActiveCampaign } = useCampaignStore.getState()
      setCampaigns(campaigns.map((c) => ({
        id: c.id, name: c.name, createdAt: c.created_at, lastOpened: c.last_opened,
      })))
      setActiveCampaign(result.campaignId)
    }
  }

  const saveLabel = (() => {
    switch (saveState) {
      case 'saving': return { text: t('statusBar.saving'), color: 'var(--warning)' }
      case 'saved':  return { text: t('statusBar.saved'),  color: 'var(--success)' }
      case 'error':  return { text: t('statusBar.saveError'), color: 'var(--danger)' }
      default:
        return lastSaved
          ? {
              text: t('statusBar.lastSaved', {
                time: lastSaved.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }),
              }),
              color: 'var(--text-muted)',
            }
          : { text: t('statusBar.autosave'), color: 'var(--text-muted)' }
    }
  })()

  return (
    <div className="statusbar">
      <div className="statusbar-item">
        <div className={`statusbar-dot ${playerConnected ? 'connected' : 'disconnected'}`} />
        <span>{playerConnected ? t('statusBar.playerConnected') : t('statusBar.playerDisconnected')}</span>
      </div>

      {sessionMode === 'prep' && (
        <div className="statusbar-item">
          <span style={{ color: 'var(--warning)' }}>{t('statusBar.prepMode')}</span>
        </div>
      )}

      {blackoutActive && (
        <div className="statusbar-item">
          <span style={{ color: 'var(--warning)' }}>{t('statusBar.blackout')}</span>
        </div>
      )}

      {current && (
        <div className="statusbar-item">
          <span style={{ color: 'var(--accent-light)' }}>
            {t('statusBar.round', { round, name: current.combatantName })}
          </span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {activeCampaignId && (
        <>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', height: 20 }}
            onClick={handleImport}
            title={t('statusBar.importTooltip')}
          >
            {t('statusBar.import')}
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', height: 20 }}
            onClick={handleExport}
            title={t('statusBar.exportTooltip')}
          >
            {t('statusBar.export')}
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', height: 20, color: 'var(--accent-light)' }}
            onClick={handleQuickBackup}
            title={t('statusBar.backupTooltip')}
          >
            {t('statusBar.backup')}
          </button>
        </>
      )}

      <div className="statusbar-item" style={{ color: saveLabel.color }}>
        {saveLabel.text}
      </div>

      <div className="statusbar-item" style={{ color: 'var(--text-muted)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: 'var(--sp-4)' }}>
        {t('app.version', { version: APP_VERSION })}
      </div>
    </div>
  )
}
