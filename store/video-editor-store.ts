import { create } from 'zustand'

// Types
export type TrackType = 'video' | 'audio' | 'text'

export interface TimelineElement {
  id: string
  name: string
  type: 'media' | 'text'
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  // Media specific
  mediaUrl?: string
  mediaType?: 'video' | 'image' | 'audio'
  // Text specific
  content?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
  x?: number
  y?: number
  opacity?: number
}

export interface TimelineTrack {
  id: string
  name: string
  type: TrackType
  elements: TimelineElement[]
  muted: boolean
  isMain?: boolean
}

// Playback State
interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  speed: number
}

// Timeline State
interface TimelineState {
  tracks: TimelineTrack[]
  selectedElementIds: string[]
  zoomLevel: number
  snappingEnabled: boolean
}

// Combined Store
interface VideoEditorStore extends PlaybackState, TimelineState {
  // Playback Actions
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setSpeed: (speed: number) => void

  // Timeline Actions
  addTrack: (type: TrackType) => string
  removeTrack: (trackId: string) => void
  addElement: (trackId: string, element: Omit<TimelineElement, 'id'>) => string
  removeElement: (trackId: string, elementId: string) => void
  updateElement: (trackId: string, elementId: string, updates: Partial<TimelineElement>) => void
  moveElement: (fromTrackId: string, toTrackId: string, elementId: string, newStartTime: number) => void

  // Selection Actions
  selectElement: (elementId: string, multi?: boolean) => void
  clearSelection: () => void

  // Zoom Actions
  setZoomLevel: (level: number) => void
  zoomIn: () => void
  zoomOut: () => void

  // Snapping
  toggleSnapping: () => void

  // Initialize with video
  initializeWithVideo: (videoUrl: string, duration: number) => void

  // Get total duration
  getTotalDuration: () => number

  // Split element
  splitElement: (trackId: string, elementId: string, splitTime: number) => void
}

// Timer for playback
let playbackTimer: number | null = null

const startPlaybackTimer = (get: () => VideoEditorStore, set: (state: Partial<VideoEditorStore>) => void) => {
  if (playbackTimer) cancelAnimationFrame(playbackTimer)

  let lastUpdate = performance.now()

  const updateTime = () => {
    const state = get()
    if (state.isPlaying) {
      const now = performance.now()
      const delta = (now - lastUpdate) / 1000
      lastUpdate = now

      const newTime = state.currentTime + delta * state.speed
      const totalDuration = state.getTotalDuration()

      if (newTime >= totalDuration) {
        set({ isPlaying: false, currentTime: totalDuration })
        if (playbackTimer) cancelAnimationFrame(playbackTimer)
        return
      }

      set({ currentTime: newTime })
    }
    playbackTimer = requestAnimationFrame(updateTime)
  }

  playbackTimer = requestAnimationFrame(updateTime)
}

const stopPlaybackTimer = () => {
  if (playbackTimer) {
    cancelAnimationFrame(playbackTimer)
    playbackTimer = null
  }
}

// Generate UUID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useVideoEditorStore = create<VideoEditorStore>((set, get) => ({
  // Initial Playback State
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  speed: 1,

  // Initial Timeline State
  tracks: [],
  selectedElementIds: [],
  zoomLevel: 1,
  snappingEnabled: true,

  // Playback Actions
  play: () => {
    const state = get()
    if (state.currentTime >= state.getTotalDuration()) {
      set({ currentTime: 0 })
    }
    set({ isPlaying: true })
    startPlaybackTimer(get, set)
  },

  pause: () => {
    set({ isPlaying: false })
    stopPlaybackTimer()
  },

  toggle: () => {
    const { isPlaying } = get()
    if (isPlaying) {
      get().pause()
    } else {
      get().play()
    }
  },

  seek: (time: number) => {
    const totalDuration = get().getTotalDuration()
    const clampedTime = Math.max(0, Math.min(totalDuration, time))
    set({ currentTime: clampedTime })
  },

  setDuration: (duration: number) => set({ duration }),

  setVolume: (volume: number) => set({
    volume: Math.max(0, Math.min(1, volume)),
    muted: volume === 0
  }),

  toggleMute: () => {
    const { muted, volume } = get()
    set({ muted: !muted })
  },

  setSpeed: (speed: number) => set({
    speed: Math.max(0.25, Math.min(2, speed))
  }),

  // Timeline Actions
  addTrack: (type: TrackType) => {
    const id = generateId()
    const trackNames = {
      video: 'Video Track',
      audio: 'Audio Track',
      text: 'Text Track'
    }

    set(state => ({
      tracks: [...state.tracks, {
        id,
        name: trackNames[type],
        type,
        elements: [],
        muted: false
      }]
    }))

    return id
  },

  removeTrack: (trackId: string) => {
    set(state => ({
      tracks: state.tracks.filter(t => t.id !== trackId)
    }))
  },

  addElement: (trackId: string, element: Omit<TimelineElement, 'id'>) => {
    const id = generateId()

    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId
          ? { ...track, elements: [...track.elements, { ...element, id }] }
          : track
      )
    }))

    return id
  },

  removeElement: (trackId: string, elementId: string) => {
    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId
          ? { ...track, elements: track.elements.filter(e => e.id !== elementId) }
          : track
      ),
      selectedElementIds: state.selectedElementIds.filter(id => id !== elementId)
    }))
  },

  updateElement: (trackId: string, elementId: string, updates: Partial<TimelineElement>) => {
    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              elements: track.elements.map(e =>
                e.id === elementId ? { ...e, ...updates } : e
              )
            }
          : track
      )
    }))
  },

  moveElement: (fromTrackId: string, toTrackId: string, elementId: string, newStartTime: number) => {
    const state = get()
    const fromTrack = state.tracks.find(t => t.id === fromTrackId)
    const element = fromTrack?.elements.find(e => e.id === elementId)

    if (!element) return

    set(state => ({
      tracks: state.tracks.map(track => {
        if (track.id === fromTrackId) {
          return {
            ...track,
            elements: track.elements.filter(e => e.id !== elementId)
          }
        }
        if (track.id === toTrackId) {
          return {
            ...track,
            elements: [...track.elements, { ...element, startTime: newStartTime }]
          }
        }
        return track
      })
    }))
  },

  // Selection Actions
  selectElement: (elementId: string, multi = false) => {
    set(state => ({
      selectedElementIds: multi
        ? state.selectedElementIds.includes(elementId)
          ? state.selectedElementIds.filter(id => id !== elementId)
          : [...state.selectedElementIds, elementId]
        : [elementId]
    }))
  },

  clearSelection: () => set({ selectedElementIds: [] }),

  // Zoom Actions
  setZoomLevel: (level: number) => set({
    zoomLevel: Math.max(0.1, Math.min(5, level))
  }),

  zoomIn: () => {
    const { zoomLevel } = get()
    set({ zoomLevel: Math.min(5, zoomLevel * 1.2) })
  },

  zoomOut: () => {
    const { zoomLevel } = get()
    set({ zoomLevel: Math.max(0.1, zoomLevel / 1.2) })
  },

  // Snapping
  toggleSnapping: () => set(state => ({ snappingEnabled: !state.snappingEnabled })),

  // Initialize with video
  initializeWithVideo: (videoUrl: string, duration: number) => {
    const mainTrackId = generateId()
    const elementId = generateId()

    set({
      duration,
      currentTime: 0,
      isPlaying: false,
      tracks: [
        {
          id: mainTrackId,
          name: 'Main Video',
          type: 'video',
          elements: [{
            id: elementId,
            name: 'AI Generated Video',
            type: 'media',
            mediaUrl: videoUrl,
            mediaType: 'video',
            startTime: 0,
            duration,
            trimStart: 0,
            trimEnd: duration
          }],
          muted: false,
          isMain: true
        }
      ],
      selectedElementIds: []
    })
  },

  // Get total duration
  getTotalDuration: () => {
    const { tracks, duration } = get()
    let maxEndTime = duration

    for (const track of tracks) {
      for (const element of track.elements) {
        const elementEnd = element.startTime + (element.duration - element.trimStart - element.trimEnd)
        if (elementEnd > maxEndTime) {
          maxEndTime = elementEnd
        }
      }
    }

    return maxEndTime
  },

  // Split element
  splitElement: (trackId: string, elementId: string, splitTime: number) => {
    const state = get()
    const track = state.tracks.find(t => t.id === trackId)
    const element = track?.elements.find(e => e.id === elementId)

    if (!element) return

    const elementStart = element.startTime
    const elementEnd = element.startTime + element.duration - element.trimStart - element.trimEnd

    if (splitTime <= elementStart || splitTime >= elementEnd) return

    const relativeTime = splitTime - elementStart + element.trimStart

    // Left part
    const leftElement: TimelineElement = {
      ...element,
      id: generateId(),
      name: `${element.name} (L)`,
      trimEnd: element.duration - relativeTime
    }

    // Right part
    const rightElement: TimelineElement = {
      ...element,
      id: generateId(),
      name: `${element.name} (R)`,
      startTime: splitTime,
      trimStart: relativeTime
    }

    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId
          ? {
              ...track,
              elements: [
                ...track.elements.filter(e => e.id !== elementId),
                leftElement,
                rightElement
              ]
            }
          : track
      )
    }))
  }
}))
