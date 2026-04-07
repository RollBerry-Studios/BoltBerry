import { create } from 'zustand'
import type { Campaign, MapRecord } from '@shared/ipc-types'

interface CampaignState {
  campaigns: Campaign[]
  activeCampaignId: number | null
  activeMaps: MapRecord[]
  activeMapId: number | null

  // Actions
  setCampaigns: (campaigns: Campaign[]) => void
  setActiveCampaign: (id: number | null) => void
  setActiveMaps: (maps: MapRecord[]) => void
  setActiveMap: (id: number | null) => void
  updateCampaign: (id: number, patch: Partial<Campaign>) => void
  addCampaign: (campaign: Campaign) => void
  removeCampaign: (id: number) => void
  addMap: (map: MapRecord) => void
  removeMap: (id: number) => void
  refreshCampaigns: () => Promise<void>
}

export const useCampaignStore = create<CampaignState>((set) => ({
  campaigns: [],
  activeCampaignId: null,
  activeMaps: [],
  activeMapId: null,

  setCampaigns: (campaigns) => set({ campaigns }),
  setActiveCampaign: (id) => set({ activeCampaignId: id }),
  setActiveMaps: (maps) => set({ activeMaps: maps }),
  setActiveMap: (id) => set({ activeMapId: id }),

  updateCampaign: (id, patch) =>
    set((s) => ({
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  addCampaign: (campaign) =>
    set((s) => ({ campaigns: [...s.campaigns, campaign] })),

  removeCampaign: (id) =>
    set((s) => ({
      campaigns: s.campaigns.filter((c) => c.id !== id),
      activeCampaignId: s.activeCampaignId === id ? null : s.activeCampaignId,
    })),

  addMap: (map) =>
    set((s) => ({ activeMaps: [...s.activeMaps, map] })),

  removeMap: (id) =>
    set((s) => ({
      activeMaps: s.activeMaps.filter((m) => m.id !== id),
      activeMapId: s.activeMapId === id ? null : s.activeMapId,
    })),

  refreshCampaigns: async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      console.error('[CampaignStore] electronAPI not available')
      return
    }
    
    try {
      // Reload campaigns
      const campaigns = await window.electronAPI.dbQuery<{
        id: number; name: string; created_at: string; last_opened: string
      }>('SELECT * FROM campaigns ORDER BY last_opened DESC')

      set((s) => ({
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          createdAt: c.created_at,
          lastOpened: c.last_opened,
        })),
        // Keep current active campaign if it still exists
        activeCampaignId: s.activeCampaignId && campaigns.some(c => c.id === s.activeCampaignId) 
          ? s.activeCampaignId 
          : campaigns[0]?.id || null
      }))

      // Reload maps for active campaign if needed
      const state = useCampaignStore.getState()
      if (state.activeCampaignId) {
        const maps = await window.electronAPI.dbQuery<MapRecord & { campaign_id: number }>(
          'SELECT * FROM maps WHERE campaign_id = ? ORDER BY order_index',
          [state.activeCampaignId]
        )
        set({
          activeMaps: maps.map(m => ({
            id: m.id,
            campaignId: m.campaign_id,
            name: m.name,
            imagePath: m.image_path,
            gridType: m.grid_type as 'square' | 'hex' | 'none',
            gridSize: m.grid_size,
            ftPerUnit: m.ft_per_unit,
            orderIndex: m.order_index,
            rotation: m.rotation,
            cameraX: m.camera_x,
            cameraY: m.camera_y,
            cameraScale: m.camera_scale,
          }))
        })
      }
    } catch (err) {
      console.error('[CampaignStore] Failed to refresh campaigns:', err)
    }
  }
}))
