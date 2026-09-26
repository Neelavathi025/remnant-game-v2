import {
  bindInput,
  getMovementVector,
  consumePressed
} from './input.js';

import {
  saveGameState,
  createInitialState,
  loadGameState
} from './state.js';

import {
  createWorld,
  getLocationData
} from '../world/world.js';

import { Player } from '../player/player.js';

import { createHUD } from '../ui/hud.js';

import { createDialoguePanel } from '../ui/dialogueUI.js';

import {
  createTitleScreen,
  createSettingsPanel
} from '../ui/menus.js';

import { AudioManager } from '../audio/audioManager.js';


export function createGame(root) {
  const game = {
    root,

    canvas: document.createElement('canvas'),

    ctx: null,

    lastTime: 0,

    scene: 'title',

    state: createInitialState(),

    player: null,

    world: null,

    hud: null,

    dialogue: null,

    titleScreen: null,

    settingsPanel: null,

    audio: null,

    camera: {
      x: 0,
      y: 0
    },

    interactionPrompt: '',

    currentInteraction: null,

    loop: null
  };


  bindInput();


  game.canvas.width = 1280;
  game.canvas.height = 720;

  game.ctx = game.canvas.getContext('2d');

  root.appendChild(game.canvas);


  game.world = createWorld();

  game.player = new Player(190, 220);

  game.hud = createHUD(root, game);

  game.dialogue = createDialoguePanel(root, game);

  game.audio = new AudioManager();


  game.titleScreen = createTitleScreen(root, game);

  game.settingsPanel = createSettingsPanel(root, game);


  /*
   * Try to load an existing save.
   * If there is no save, use the initial state.
   */
  const savedState = loadGameState();

  if (savedState) {
    game.state = mergeState(
      createInitialState(),
      savedState
    );
  }


  /*
   * Make sure older saves that do not have
   * the new progress object still work.
   */
  if (!game.state.progress) {
    game.state.progress = {
      recorderFound: false,
      currentMemory: 0
    };
  }


  /*
   * Keep player position synchronized with saved state.
   */
  if (
    game.state.player &&
    typeof game.state.player.x === 'number' &&
    typeof game.state.player.y === 'number'
  ) {
    game.player.x = game.state.player.x;
    game.player.y = game.state.player.y;
  }


  updateObjective.call(game);


  game.hud.updateMemoryText(
    game.state.memories.length,
    3
  );


  game.hud.updatePrompt('');


  game.scene = 'title';

  game.titleScreen.show();

  game.dialogue.hide();


  game.loop = gameLoop.bind(game);


  requestAnimationFrame(game.loop);


  return game;
}


/*
 * Safely merge saved data with the newest state structure.
 */
function mergeState(defaultState, savedState) {
  return {
    ...defaultState,
    ...savedState,

    flags: {
      ...defaultState.flags,
      ...(savedState.flags || {})
    },

    settings: {
      ...defaultState.settings,
      ...(savedState.settings || {})
    },

    player: {
      ...defaultState.player,
      ...(savedState.player || {})
    },

    memoryLocations: {
      ...defaultState.memoryLocations,
      ...(savedState.memoryLocations || {})
    },

    progress: {
      ...defaultState.progress,
      ...(savedState.progress || {})
    }
  };
}


function gameLoop(time) {
  const dt = Math.min(
    (time - this.lastTime) / 1000 || 0.016,
    0.033
  );

  this.lastTime = time;


  /*
   * =========================
   * UPDATE
   * =========================
   */

  if (this.scene === 'playing') {

    /*
     * Player movement
     */
    const movement = getMovementVector();

    this.player.update(
      dt,
      movement,
      this.world.getColliders(
        this.state.currentLocation
      )
    );


    /*
     * Memory Echo timer
     */
    if (this.state.echoTimer > 0) {

      this.state.echoTimer -= dt;

      if (this.state.echoTimer <= 0) {

        this.state.echoTimer = 0;

        this.state.activeEcho = null;

        this.state.echoMessage = '';

        this.state.echoLocation = null;
      }
    }


    /*
     * Save player position
     */
    this.state.player.x = this.player.x;

    this.state.player.y = this.player.y;


    /*
     * Camera follows player
     */
    this.camera.x =
      this.player.x -
      this.canvas.width / 2;

    this.camera.y =
      this.player.y -
      this.canvas.height / 2;


    /*
     * Find nearest interactable
     */
    const location = getLocationData(
      this.state.currentLocation
    );


    let closest = null;

    let closestDistance = Infinity;


    for (const object of location.interactables) {

      /*
       * Do not show collected memories.
       */
      if (
        object.id.startsWith('memory') &&
        object.id !== 'memoryRecorder' &&
        this.state.memoryLocations[object.id]
      ) {
        continue;
      }


      /*
       * Only allow the correct memory in the story order.
       */
      if (
        object.id === 'memory1' &&
        !canInteractWithMemory.call(this, 1)
      ) {
        continue;
      }


      if (
        object.id === 'memory2' &&
        !canInteractWithMemory.call(this, 2)
      ) {
        continue;
      }


      if (
        object.id === 'memory3' &&
        !canInteractWithMemory.call(this, 3)
      ) {
        continue;
      }


      const dx =
        this.player.x - object.x;

      const dy =
        this.player.y - object.y;


      const distance =
        Math.hypot(dx, dy);


      if (
        distance <
          object.radius + 32 &&
        distance <
          closestDistance
      ) {

        closest = object;

        closestDistance = distance;
      }
    }


    this.currentInteraction = closest;


    /*
     * Interaction prompt
     */
    if (closest) {

      this.interactionPrompt =
        getInteractionPrompt.call(
          this,
          closest
        );

    } else {

      this.interactionPrompt = '';
    }


    /*
     * E key
     */
    if (
      consumePressed('e') &&
      this.currentInteraction
    ) {

      triggerInteraction.call(this);
    }


    /*
     * Escape
     */
    if (consumePressed('escape')) {

      this.scene = 'title';

      this.titleScreen.show();

      this.dialogue.hide();

      this.currentInteraction = null;
    }


    /*
     * HUD
     */
    this.hud.updateMemoryText(
      this.state.memories.length,
      3
    );

    this.hud.updateObjective(
      this.state.objective
    );

    this.hud.updatePrompt(
      this.interactionPrompt
    );


    /*
     * Save
     */
    saveGameState(this.state);
  }


  /*
   * =========================
   * DRAW
   * =========================
   */

  const ctx = this.ctx;

  const width = this.canvas.width;

  const height = this.canvas.height;


  /*
   * Base background
   */
  ctx.fillStyle = '#0d1118';

  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  const location =
    getLocationData(
      this.state.currentLocation
    );


  const cameraX = this.camera.x;

  const cameraY = this.camera.y;


  /*
   * World background
   */
  ctx.fillStyle = location.bg;

  ctx.fillRect(
    -cameraX,
    -cameraY,
    location.bounds.w,
    location.bounds.h
  );


  /*
   * Grid
   */
  ctx.strokeStyle =
    'rgba(255,255,255,0.08)';

  ctx.lineWidth = 1;


  for (
    let x = 0;
    x <= location.bounds.w;
    x += 80
  ) {

    ctx.beginPath();

    ctx.moveTo(
      x - cameraX,
      -cameraY
    );

    ctx.lineTo(
      x - cameraX,
      location.bounds.h - cameraY
    );

    ctx.stroke();
  }


  for (
    let y = 0;
    y <= location.bounds.h;
    y += 80
  ) {

    ctx.beginPath();

    ctx.moveTo(
      -cameraX,
      y - cameraY
    );

    ctx.lineTo(
      location.bounds.w - cameraX,
      y - cameraY
    );

    ctx.stroke();
  }


  /*
   * Colliders
   */
  for (
    const collider of this.world.getColliders(
      this.state.currentLocation
    )
  ) {

    ctx.fillStyle =
      'rgba(255,255,255,0.06)';

    ctx.fillRect(
      collider.x - cameraX,
      collider.y - cameraY,
      collider.w,
      collider.h
    );
  }


  /*
   * Interactable objects
   */
  for (
    const object of location.interactables
  ) {

    /*
     * Don't draw collected memories.
     */
    if (
      object.id.startsWith('memory') &&
      object.id !== 'memoryRecorder' &&
      this.state.memoryLocations[object.id]
    ) {
      continue;
    }


    const drawX =
      object.x - cameraX;

    const drawY =
      object.y - cameraY;


    /*
     * Memory Recorder visual
     */
    if (
      object.id === 'memoryRecorder'
    ) {

      const pulse =
        1 +
        Math.sin(
          performance.now() / 350
        ) *
        0.12;


      ctx.fillStyle =
        object.color || '#8ed9d4';


      ctx.beginPath();

      ctx.arc(
        drawX,
        drawY,
        object.radius * pulse,
        0,
        Math.PI * 2
      );

      ctx.fill();


      ctx.strokeStyle =
        'rgba(142,217,212,0.55)';

      ctx.lineWidth = 2;


      ctx.beginPath();

      ctx.arc(
        drawX,
        drawY,
        object.radius + 10,
        0,
        Math.PI * 2
      );

      ctx.stroke();

    } else {

      /*
       * Normal interactable
       */
      ctx.fillStyle =
        object.color || '#9eb7ff';


      ctx.beginPath();

      ctx.arc(
        drawX,
        drawY,
        object.radius,
        0,
        Math.PI * 2
      );

      ctx.fill();


      /*
       * Memory pulse
       */
      if (
        object.id === 'memory1' ||
        object.id === 'memory2' ||
        object.id === 'memory3'
      ) {

        const pulse =
          1 +
          Math.sin(
            performance.now() / 300
          ) *
          0.15;


        ctx.strokeStyle =
          'rgba(168,255,208,0.45)';

        ctx.lineWidth = 2;


        ctx.beginPath();

        ctx.arc(
          drawX,
          drawY,
          (object.radius + 12) * pulse,
          0,
          Math.PI * 2
        );

        ctx.stroke();
      }
    }


    /*
     * Highlight nearby object
     */
    if (
      this.currentInteraction &&
      this.currentInteraction.id === object.id
    ) {

      ctx.strokeStyle =
        'rgba(255,255,255,0.85)';

      ctx.lineWidth = 2;


      ctx.beginPath();

      ctx.arc(
        drawX,
        drawY,
        object.radius + 8,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }
  }


  /*
   * Player
   */
  this.player.draw(
    ctx,
    cameraX,
    cameraY
  );


  /*
   * Memory Echo
   */
  drawMemoryEcho.call(
    this,
    ctx
  );


  /*
   * Title overlay
   */
  if (this.scene === 'title') {

    ctx.fillStyle =
      'rgba(0,0,0,0.35)';

    ctx.fillRect(
      0,
      0,
      width,
      height
    );
  }


  requestAnimationFrame(
    this.loop
  );
}


/*
 * =========================
 * INTERACTION PROMPTS
 * =========================
 */

function getInteractionPrompt(object) {

  if (
    object.id === 'memoryRecorder'
  ) {

    return 'MEMORY RECORDER  |  [E] INTERACT';
  }


  if (
    object.id === 'memory1'
  ) {

    return 'MEMORY 1  |  [E] RECOVER MEMORY';
  }


  if (
    object.id === 'memory2'
  ) {

    return 'MEMORY 2  |  [E] RECOVER MEMORY';
  }


  if (
    object.id === 'memory3'
  ) {

    return 'MEMORY 3  |  [E] RECOVER MEMORY';
  }


  if (object.id === 'bed') {

    return '[E] INTERACT';
  }


  if (object.id === 'window') {

    return '[E] INTERACT';
  }


  return '[E] INTERACT';
}


/*
 * =========================
 * INTERACTION LOGIC
 * =========================
 */

function triggerInteraction() {

  if (!this.currentInteraction) {
    return;
  }


  const id =
    this.currentInteraction.id;


  this.audio.playSfx(
    'interaction'
  );


  /*
   * MEMORY RECORDER
   */
  if (
    id === 'memoryRecorder'
  ) {

    activateRecorder.call(
      this
    );

    this.currentInteraction = null;

    return;
  }


  /*
   * MEMORY 1
   */
  if (id === 'memory1') {

    collectMemory.call(
      this,
      'memory1'
    );

    this.currentInteraction = null;

    return;
  }


  /*
   * MEMORY 2
   */
  if (id === 'memory2') {

    collectMemory.call(
      this,
      'memory2'
    );

    this.currentInteraction = null;

    return;
  }


  /*
   * MEMORY 3
   */
  if (id === 'memory3') {

    collectMemory.call(
      this,
      'memory3'
    );

    this.currentInteraction = null;

    return;
  }


  /*
   * Bed
   */
  if (id === 'bed') {

    this.dialogue.show(
      'MAYA',
      'The sheets still smell like rain. You were here before.'
    );

    this.currentInteraction = null;

    return;
  }


  /*
   * Window
   */
  if (id === 'window') {

    this.dialogue.show(
      'CITY',
      'Rain marks the glass like a memory.'
    );

    this.currentInteraction = null;

    return;
  }


  /*
   * Default
   */
  this.dialogue.show(
    'SILENCE',
    'Something feels unfinished here.'
  );

  this.currentInteraction = null;
}


/*
 * =========================
 * MEMORY RECORDER
 * =========================
 */

function activateRecorder() {

  if (
    this.state.progress.recorderFound
  ) {

    return;
  }


  this.state.progress.recorderFound =
    true;


  this.state.progress.currentMemory =
    1;


  this.state.objective =
    'Find Memory 1.';


  this.dialogue.show(
    'MEMORY RECORDER',
    'The recorder hums.\nSomething inside it remembers you.'
  );


  saveGameState(
    this.state
  );


  this.audio.playSfx(
    'interaction'
  );
}


/*
 * =========================
 * MEMORY ORDER
 * =========================
 */

function canInteractWithMemory(number) {

  if (
    !this.state.progress.recorderFound
  ) {

    return false;
  }


  if (
    this.state.progress.currentMemory !==
    number
  ) {

    return false;
  }


  return true;
}


/*
 * =========================
 * COLLECT MEMORY
 * =========================
 */

function collectMemory(id) {

  /*
   * Determine memory number
   */
  const number =
    Number(
      id.replace(
        'memory',
        ''
      )
    );


  /*
   * Safety checks
   */
  if (
    !this.state.progress.recorderFound
  ) {

    return;
  }


  if (
    this.state.progress.currentMemory !==
    number
  ) {

    return;
  }


  if (
    this.state.memoryLocations[id]
  ) {

    return;
  }


  const messages = {

    memory1:
      'I remember standing at the entrance of this city.\n\nBut I don\'t remember coming here.\n\nI was not alone.',

    memory2:
      'Someone was with me.\n\nI remember their voice.\n\nBut I can\'t remember their face.\n\nThey told me not to trust the city.',

    memory3:
      'Now I remember.\n\nI wasn\'t searching for the city.\n\nThe city was searching for me.'
  };


  /*
   * Mark memory as discovered
   */
  this.state.memoryLocations[id] =
    true;


  /*
   * Add to memories array
   */
  if (
    !this.state.memories.includes(id)
  ) {

    this.state.memories.push(id);
  }


  /*
   * Update progression
   */
  if (number < 3) {

    this.state.progress.currentMemory =
      number + 1;

  } else {

    this.state.progress.currentMemory =
      4;
  }


  /*
   * Update objective
   */
  updateObjective.call(
    this
  );


  /*
   * Store echo
   */
  this.state.activeEcho = id;

  this.state.echoMessage =
    messages[id] ||
    'Something returns to your memory.';

  this.state.echoTimer = 6;

  this.state.echoLocation =
    this.state.currentLocation;


  /*
   * Update HUD
   */
  this.hud.updateMemoryText(
    this.state.memories.length,
    3
  );


  /*
   * Show the proper memory dialogue
   */
  this.scene = 'memory';


  this.dialogue.show(
    `MEMORY ${number}`,
    messages[id]
  );


  /*
   * Try to attach a Continue handler
   * to the existing dialogue panel.
   */
  attachContinueHandler.call(
    this,
    number
  );


  saveGameState(
    this.state
  );


  this.audio.playSfx(
    'interaction'
  );
}


/*
 * =========================
 * CONTINUE BUTTON
 * =========================
 */

function attachContinueHandler(memoryNumber) {

  /*
   * The existing dialogue UI is responsible
   * for displaying the dialogue.
   *
   * We listen for a click on a button if
   * the dialogue UI provides one.
   */
  const root =
    this.root;


  const buttons =
    root.querySelectorAll(
      'button'
    );


  for (
    const button of buttons
  ) {

    const text =
      button.textContent
        .trim()
        .toLowerCase();


    if (
      text === 'continue' ||
      text === 'close' ||
      text === 'ok'
    ) {

      /*
       * Avoid duplicate listeners.
       */
      if (
        button.dataset.remnantBound ===
        'true'
      ) {

        continue;
      }


      button.dataset.remnantBound =
        'true';


      button.addEventListener(
        'click',
        () => {

          continueAfterMemory.call(
            this,
            memoryNumber
          );

        },
        {
          once: true
        }
      );
    }
  }


  /*
   * Fallback:
   * If the existing dialogue panel does not
   * have a button, clicking the dialogue area
   * can continue the game.
   */
  if (
    buttons.length === 0
  ) {

    const dialogueElement =
      root.querySelector(
        '[data-dialogue], .dialogue, .dialogue-panel'
      );


    if (dialogueElement) {

      const handler = () => {

        dialogueElement.removeEventListener(
          'click',
          handler
        );

        continueAfterMemory.call(
          this,
          memoryNumber
        );
      };


      dialogueElement.addEventListener(
        'click',
        handler
      );
    }
  }
}


/*
 * =========================
 * CONTINUE AFTER MEMORY
 * =========================
 */

function continueAfterMemory(memoryNumber) {

  /*
   * Memory 3 leads to ending.
   */
  if (
    memoryNumber === 3
  ) {

    showEnding.call(
      this
    );

    return;
  }


  /*
   * Return to gameplay.
   */
  this.scene = 'playing';


  this.dialogue.hide();


  this.currentInteraction = null;


  updateObjective.call(
    this
  );


  saveGameState(
    this.state
  );
}


/*
 * =========================
 * OBJECTIVE SYSTEM
 * =========================
 */

function updateObjective() {

  if (
    this.state.ending
  ) {

    this.state.objective =
      'Remember.';

    return;
  }


  if (
    !this.state.progress ||
    !this.state.progress.recorderFound
  ) {

    this.state.objective =
      'Find the Memory Recorder.';

    return;
  }


  switch (
    this.state.progress.currentMemory
  ) {

    case 1:

      this.state.objective =
        'Find Memory 1.';

      break;


    case 2:

      this.state.objective =
        'Find Memory 2.';

      break;


    case 3:

      this.state.objective =
        'Find Memory 3.';

      break;


    case 4:

      this.state.objective =
        'Remember.';

      break;


    default:

      this.state.objective =
        'Find the Memory Recorder.';
  }
}


/*
 * =========================
 * ENDING
 * =========================
 */

function showEnding() {

  this.state.ending =
    'memories-recovered';


  this.state.progress.currentMemory =
    4;


  this.state.objective =
    'Remember.';


  this.scene = 'ending';


  this.dialogue.show(
    'ALL MEMORIES RECOVERED',
    'You came here looking for answers.\n\nBut some memories were never meant to be remembered.'
  );


  attachEndingHandlers.call(
    this
  );


  saveGameState(
    this.state
  );
}


/*
 * =========================
 * ENDING BUTTONS
 * =========================
 */

function attachEndingHandlers() {

  const root =
    this.root;


  const buttons =
    root.querySelectorAll(
      'button'
    );


  for (
    const button of buttons
  ) {

    const text =
      button.textContent
        .trim()
        .toLowerCase();


    if (
      text === 'play again'
    ) {

      if (
        button.dataset.remnantEndingBound ===
        'true'
      ) {

        continue;
      }


      button.dataset.remnantEndingBound =
        'true';


      button.addEventListener(
        'click',
        () => {

          resetGame.call(
            this
          );

        },
        {
          once: true
        }
      );
    }


    if (
      text === 'return'
    ) {

      if (
        button.dataset.remnantEndingReturnBound ===
        'true'
      ) {

        continue;
      }


      button.dataset.remnantEndingReturnBound =
        'true';


      button.addEventListener(
        'click',
        () => {

          this.dialogue.hide();

          this.scene = 'title';

          this.titleScreen.show();

        },
        {
          once: true
        }
      );
    }
  }
}


/*
 * =========================
 * RESET GAME
 * =========================
 */

function resetGame() {

  /*
   * Create a completely fresh state.
   */
  this.state =
    createInitialState();


  /*
   * Reset player.
   */
  this.player.x = 190;

  this.player.y = 220;


  /*
   * Reset camera.
   */
  this.camera.x = 0;

  this.camera.y = 0;


  /*
   * Reset interaction.
   */
  this.currentInteraction = null;

  this.interactionPrompt = '';


  /*
   * Return to gameplay.
   */
  this.scene = 'playing';


  this.dialogue.hide();

  this.titleScreen.hide();

  this.settingsPanel.hide();


  /*
   * Update HUD.
   */
  this.hud.updateMemoryText(
    0,
    3
  );


  this.hud.updateObjective(
    'Find the Memory Recorder.'
  );


  this.hud.updatePrompt(
    ''
  );


  /*
   * Save clean state.
   */
  saveGameState(
    this.state
  );


  /*
   * Restart ambient audio.
   */
  this.audio.startAmbient();
}


/*
 * =========================
 * MEMORY ECHO DRAWING
 * =========================
 */

function drawMemoryEcho(ctx) {

  if (
    !this.state.activeEcho ||
    this.state.echoTimer <= 0
  ) {

    return;
  }


  const message =
    this.state.echoMessage || '';


  const alpha =
    Math.min(
      1,
      this.state.echoTimer / 1.5
    );


  ctx.save();


  ctx.globalAlpha =
    alpha;


  /*
   * Echo panel
   */
  ctx.fillStyle =
    'rgba(10,18,28,0.88)';


  ctx.fillRect(
    280,
    570,
    720,
    70
  );


  /*
   * Border
   */
  ctx.strokeStyle =
    'rgba(170,255,210,0.45)';

  ctx.lineWidth = 1;


  ctx.strokeRect(
    280,
    570,
    720,
    70
  );


  /*
   * Title
   */
  ctx.fillStyle =
    '#a8ffd0';


  ctx.font =
    'bold 14px sans-serif';


  ctx.textAlign =
    'center';


  ctx.fillText(
    'MEMORY ECHO',
    640,
    595
  );


  /*
   * Message
   */
  ctx.fillStyle =
    '#ffffff';


  ctx.font =
    '15px sans-serif';


  /*
   * Use a short version in the HUD so
   * long memory text doesn't overflow.
   */
  const shortMessage =
    message
      .replace(/\n/g, ' ')
      .substring(
        0,
        90
      );


  ctx.fillText(
    shortMessage,
    640,
    620
  );


  ctx.restore();
}


/*
 * =========================
 * START GAME
 * =========================
 */

export function startGame(game) {

  /*
   * If a completed game is being started,
   * begin a fresh run.
   */
  if (
    game.state.ending
  ) {

    game.state =
      createInitialState();
  }


  game.scene =
    'playing';


  game.titleScreen.hide();

  game.settingsPanel.hide();

  game.dialogue.hide();


  game.audio.startAmbient();


  /*
   * Restore player position.
   */
  game.player.x =
    game.state.player.x || 190;


  game.player.y =
    game.state.player.y || 220;


  /*
   * Make sure objective is correct.
   */
  updateObjective.call(
    game
  );


  game.hud.updateMemoryText(
    game.state.memories.length,
    3
  );


  game.hud.updateObjective(
    game.state.objective
  );


  game.hud.updatePrompt(
    ''
  );


  saveGameState(
    game.state
  );
}
