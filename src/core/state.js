export function createInitialState() {
  return {
    currentLocation: 'apartment',
    memories: [],
    discoveredClues: [],
    npcStates: {
      maya: 'stranger',
      detective: 'neutral',
      nurse: 'neutral'
    },
    puzzleStates: {},
    flags: {
      titleSeen: false,
      introPlayed: false
    },
    settings: {
      masterVolume: 0.65,
      musicVolume: 0.45,
      sfxVolume: 0.6,
      textSpeed: 0.06,
      reducedMotion: false
    },
    player: {
      x: 190,
      y: 220
    },
    objective: 'Find the Memory Recorder.',
    ending: null,
    memoryLocations: {
      'memory1': false,
      'memory2': false,
      'memory3': false
    },
    activeEcho: null,
    echoMessage: "",
    echoTimer: 0,
    echoLocation: null
  };
}

export const STORAGE_KEY = 'remnant-save-v1';

export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('Save failed:', error);
    return false;
  }
}

export function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Load failed:', error);
    return null;
  }
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
