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

    /*
     * REMNANT STORY PROGRESSION
     *
     * recorderFound:
     * false = player has not activated the Memory Recorder
     * true  = player has activated the Memory Recorder
     *
     * currentMemory:
     * 0 = recorder not activated
     * 1 = Memory 1 is next
     * 2 = Memory 2 is next
     * 3 = Memory 3 is next
     * 4 = all memories recovered
     */
    progress: {
      recorderFound: false,
      currentMemory: 0
    },

    memoryLocations: {
      memory1: false,
      memory2: false,
      memory3: false
    },

    activeEcho: null,

    echoMessage: '',

    echoTimer: 0,

    echoLocation: null
  };
}

export const STORAGE_KEY = 'remnant-save-v1';

export function saveGameState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

    return true;
  } catch (error) {
    console.warn('Save failed:', error);
    return false;
  }
}

export function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.warn('Load failed:', error);
    return null;
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Reset failed:', error);
  }
}
