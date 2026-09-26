import {
  bindInput,
  getMovementVector,
  consumePressed
} from './input.js';

import {
  saveGameState,
  createInitialState
} from './state.js';

import {
  createWorld,
  getLocationData
} from '../world/world.js';

import {
  Player
} from '../player/player.js';

import {
  createHUD
} from '../ui/hud.js';

import {
  createDialoguePanel
} from '../ui/dialogueUI.js';

import {
  createTitleScreen,
  createSettingsPanel
} from '../ui/menus.js';

import {
  AudioManager
} from '../audio/audioManager.js';


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


  game.player = new Player(
    game.state.player.x,
    game.state.player.y
  );


  game.hud = createHUD(
    root,
    game
  );


  game.dialogue = createDialoguePanel(
    root,
    game
  );


  game.audio = new AudioManager();


  game.titleScreen = createTitleScreen(
    root,
    game
  );


  game.settingsPanel = createSettingsPanel(
    root,
    game
  );


  game.hud.updateMemoryText(
    game.state.memories.length,
    3
  );


  game.hud.updateObjective(
    game.state.objective ||
    'Find the Memory Recorder.'
  );


  game.scene = 'title';

  game.titleScreen.show();

  game.dialogue.hide();


  game.loop = gameLoop.bind(game);


  requestAnimationFrame(game.loop);


  return game;
}


/*
 * =========================================================
 * GAME LOOP
 * =========================================================
 */

function gameLoop(time) {

  const dt =
    Math.min(
      (time - this.lastTime) / 1000 || 0.016,
      0.033
    );


  this.lastTime = time;


  /*
   * GAMEPLAY
   */

  if (this.scene === 'playing') {

    const movement =
      getMovementVector();


    this.player.update(
      dt,
      movement,
      this.world.getColliders(
        this.state.currentLocation
      )
    );


    this.state.player.x =
      this.player.x;

    this.state.player.y =
      this.player.y;


    /*
     * Camera
     */

    this.camera.x =
      this.player.x -
      this.canvas.width / 2;

    this.camera.y =
      this.player.y -
      this.canvas.height / 2;


    /*
     * Find closest interaction
     */

    const location =
      getLocationData(
        this.state.currentLocation
      );


    let closest = null;

    let closestDistance =
      Infinity;


    for (
      const object of location.interactables
    ) {

      const dx =
        this.player.x - object.x;

      const dy =
        this.player.y - object.y;

      const distance =
        Math.hypot(dx, dy);


      if (
        distance <
          object.radius + 35 &&
        distance <
          closestDistance
      ) {

        closest = object;

        closestDistance =
          distance;
      }
    }


    this.currentInteraction =
      closest;


    this.interactionPrompt =
      closest
        ? '[E] INTERACT'
        : '';


    /*
     * E = interact
     */

    if (
      consumePressed('e') &&
      this.currentInteraction
    ) {

      triggerInteraction.call(this);
    }


    /*
     * ESC = title
     */

    if (
      consumePressed('escape')
    ) {

      this.scene = 'title';

      this.dialogue.hide();

      this.titleScreen.show();
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


    saveGameState(
      this.state
    );
  }


  /*
   * =========================================================
   * DRAW
   * =========================================================
   */

  const ctx = this.ctx;

  const width =
    this.canvas.width;

  const height =
    this.canvas.height;


  ctx.fillStyle =
    '#0d1118';

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


  const cameraX =
    this.camera.x;

  const cameraY =
    this.camera.y;


  /*
   * World background
   */

  ctx.fillStyle =
    location.bg;


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
   * Obstacles
   */

  for (
    const collider of
      this.world.getColliders(
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
    const object of
      location.interactables
  ) {

    /*
     * Don't show already-collected
     * memory objects.
     */

    if (
      object.id.startsWith('memory') &&
      this.state.memoryLocations[
        object.id
      ]
    ) {

      continue;
    }


    const drawX =
      object.x - cameraX;

    const drawY =
      object.y - cameraY;


    /*
     * Memory objects
     */

    const isMemory =
      object.id === 'memory1' ||
      object.id === 'memory2' ||
      object.id === 'memory3';


    /*
     * Recorder
     */

    const isRecorder =
      object.id === 'memoryRecorder';


    /*
     * Normal object
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
     * Glow for recorder
     */

    if (isRecorder) {

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
    }


    /*
     * Glow for memories
     */

    if (isMemory) {

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
        (object.radius + 12) *
          pulse,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }


    /*
     * Current interaction highlight
     */

    if (
      this.currentInteraction &&
      this.currentInteraction.id ===
        object.id
    ) {

      ctx.strokeStyle =
        'rgba(255,255,255,0.9)';

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
   * Title overlay
   */

  if (
    this.scene === 'title'
  ) {

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
 * =========================================================
 * INTERACTION SYSTEM
 * =========================================================
 */

function triggerInteraction() {

  if (
    !this.currentInteraction
  ) {

    return;
  }


  const id =
    this.currentInteraction.id;


  /*
   * MEMORY RECORDER
   */

  if (
    id === 'memoryRecorder'
  ) {

    /*
     * Recorder can only be used
     * before the memories begin.
     */

    if (
      this.state.memories.length === 0
    ) {

      this.state.objective =
        'Find Memory 1.';


      this.hud.updateObjective(
        'Find Memory 1.'
      );


      this.dialogue.show(
        'MEMORY RECORDER',
        'The machine hums.\n\nSomething inside is waiting for you.'
      );

    } else {

      this.dialogue.show(
        'MEMORY RECORDER',
        'The recorder is silent now. It has already given you what it remembers.'
      );
    }


    this.currentInteraction =
      null;


    return;
  }


  /*
   * MEMORY 1
   */

  if (
    id === 'memory1'
  ) {

    /*
     * Memory 1 must be collected first.
     */

    if (
      this.state.memories.length !== 0
    ) {

      return;
    }


    collectMemory.call(
      this,
      'memory1'
    );


    return;
  }


  /*
   * MEMORY 2
   */

  if (
    id === 'memory2'
  ) {

    /*
     * Must have Memory 1.
     */

    if (
      !this.state.memoryLocations.memory1
    ) {

      this.dialogue.show(
        'MEMORY 2',
        'The memory is still locked.\n\nSomething else must be remembered first.'
      );

      this.currentInteraction =
        null;

      return;
    }


    if (
      this.state.memoryLocations.memory2
    ) {

      return;
    }


    collectMemory.call(
      this,
      'memory2'
    );


    return;
  }


  /*
   * MEMORY 3
   */

  if (
    id === 'memory3'
  ) {

    /*
     * Must have Memory 1 and 2.
     */

    if (
      !this.state.memoryLocations.memory1 ||
      !this.state.memoryLocations.memory2
    ) {

      this.dialogue.show(
        'MEMORY 3',
        'The memory refuses to surface.\n\nYou are missing something.'
      );

      this.currentInteraction =
        null;

      return;
    }


    if (
      this.state.memoryLocations.memory3
    ) {

      return;
    }


    collectMemory.call(
      this,
      'memory3'
    );


    return;
  }


  /*
   * BED
   */

  if (
    id === 'bed'
  ) {

    this.dialogue.show(
      'MAYA',
      'The sheets still smell like rain. You were here before.'
    );


    this.currentInteraction =
      null;


    return;
  }


  /*
   * WINDOW
   */

  if (
    id === 'window'
  ) {

    this.dialogue.show(
      'CITY',
      'Rain marks the glass like a memory.'
    );


    this.currentInteraction =
      null;


    return;
  }


  /*
   * DEFAULT
   */

  this.dialogue.show(
    'SILENCE',
    'Something feels unfinished here.'
  );


  this.currentInteraction =
    null;
}


/*
 * =========================================================
 * MEMORY COLLECTION
 * =========================================================
 */

function collectMemory(id) {

  /*
   * Never collect twice.
   */

  if (
    this.state.memoryLocations[id]
  ) {

    return;
  }


  const messages = {

    memory1:
      'I remember standing at the entrance of this city.\n\nBut I don’t remember coming here.\n\nI was not alone.',

    memory2:
      'Someone was with me.\n\nI remember their voice.\n\nBut I can’t remember their face.\n\nThey told me not to trust the city.',

    memory3:
      'Now I remember.\n\nI wasn’t searching for the city.\n\nThe city was searching for me.'
  };


  /*
   * Mark memory as collected FIRST.
   *
   * This is important.
   */

  this.state.memoryLocations[id] =
    true;


  /*
   * Add to memory array.
   */

  if (
    !this.state.memories.includes(id)
  ) {

    this.state.memories.push(id);
  }


  /*
   * Calculate the ACTUAL count.
   */

  const count =
    this.state.memories.length;


  /*
   * Update HUD BEFORE opening dialogue.
   */

  this.hud.updateMemoryText(
    count,
    3
  );


  /*
   * Decide next objective.
   */

  if (id === 'memory1') {

    this.state.objective =
      'Find Memory 2.';
  }


  if (id === 'memory2') {

    this.state.objective =
      'Find Memory 3.';
  }


  if (id === 'memory3') {

    this.state.objective =
      'Remember.';
  }


  this.hud.updateObjective(
    this.state.objective
  );


  /*
   * Save the correct state.
   */

  saveGameState(
    this.state
  );


  /*
   * Show the memory dialogue
   * ONLY AFTER the state is updated.
   */

  this.dialogue.show(
    id === 'memory1'
      ? 'MEMORY 1'
      : id === 'memory2'
        ? 'MEMORY 2'
        : 'MEMORY 3',

    messages[id]
  );


  this.currentInteraction =
    null;
}


/*
 * =========================================================
 * CALLED BY DIALOGUE UI
 * =========================================================
 */

export function continueAfterMemory(
  game,
  memoryNumber
) {

  /*
   * MEMORY 1
   */

  if (
    memoryNumber === 1
  ) {

    game.scene = 'playing';

    game.state.objective =
      'Find Memory 2.';

    game.hud.updateMemoryText(
      game.state.memories.length,
      3
    );

    game.hud.updateObjective(
      'Find Memory 2.'
    );

    game.dialogue.hide();

    saveGameState(
      game.state
    );

    return;
  }


  /*
   * MEMORY 2
   */

  if (
    memoryNumber === 2
  ) {

    game.scene = 'playing';

    game.state.objective =
      'Find Memory 3.';

    game.hud.updateMemoryText(
      game.state.memories.length,
      3
    );

    game.hud.updateObjective(
      'Find Memory 3.'
    );

    game.dialogue.hide();

    saveGameState(
      game.state
    );

    return;
  }


  /*
   * MEMORY 3
   */

  if (
    memoryNumber === 3
  ) {

    /*
     * Make absolutely sure the
     * counter is 3/3.
     */

    game.hud.updateMemoryText(
      3,
      3
    );


    game.state.objective =
      'Remember.';


    game.hud.updateObjective(
      'Remember.'
    );


    game.dialogue.show(
      'ALL MEMORIES RECOVERED',

      'You came here looking for answers.\n\nBut some memories were never meant to be remembered.'
    );


    game.scene = 'ending';


    saveGameState(
      game.state
    );
  }
}


/*
 * =========================================================
 * START GAME
 * =========================================================
 */

export function startGame(game) {

  game.scene = 'playing';


  game.titleScreen.hide();

  game.settingsPanel.hide();


  game.audio.startAmbient();


  game.player.x =
    game.state.player.x || 190;


  game.player.y =
    game.state.player.y || 220;


  game.camera.x =
    game.player.x -
    game.canvas.width / 2;


  game.camera.y =
    game.player.y -
    game.canvas.height / 2;
}
