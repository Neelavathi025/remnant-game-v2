import { bindInput, getMovementVector, consumePressed } from './input.js';
import { saveGameState, createInitialState, loadGameState } from './state.js';
import { createWorld, getLocationData } from '../world/world.js';
import { Player } from '../player/player.js';
import { createHUD } from '../ui/hud.js';
import { createDialoguePanel } from '../ui/dialogueUI.js';
import { createTitleScreen, createSettingsPanel } from '../ui/menus.js';
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
    camera: { x: 0, y: 0 },
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

  // Initialize UI state
  game.hud.updateMemoryText(game.state.memories.length, 3);
  game.hud.updateObjective(
    game.state.objective || 'Find the Memory Recorder.'
  );

  // Show title screen
  game.scene = 'title';
  game.titleScreen.show();
  game.dialogue.hide();

  // Bind loop
  game.loop = gameLoop.bind(game);

  return game;
}

function gameLoop(time) {
  const dt = Math.min((time - this.lastTime) / 1000 || 0.016, 0.033);
  this.lastTime = time;

  // Update
  if (this.scene === 'playing') {
    const movement = getMovementVector();

    this.player.update(
      dt,
      movement,
      this.world.getColliders(this.state.currentLocation)
    );

    // Update Memory Echo
    if (this.state.echoTimer > 0) {
      this.state.echoTimer -= dt;

      if (this.state.echoTimer <= 0) {
        this.state.echoTimer = 0;
        this.state.activeEcho = null;
        this.state.echoMessage = '';
        this.state.echoLocation = null;
      }
    }

    this.state.player.x = this.player.x;
    this.state.player.y = this.player.y;

    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;

    // Update interactions
    const location = getLocationData(this.state.currentLocation);

    let closest = null;
    let closestDistance = Infinity;

    for (const object of location.interactables) {
      const dx = this.player.x - object.x;
      const dy = this.player.y - object.y;
      const distance = Math.hypot(dx, dy);

      if (
        distance < object.radius + 26 &&
        distance < closestDistance
      ) {
        closest = object;
        closestDistance = distance;
      }
    }

    this.currentInteraction = closest;
    this.interactionPrompt = closest ? '[E] INTERACT' : '';

    // Handle input
    if (consumePressed('e') && this.currentInteraction) {
      triggerInteraction.call(this);
    }

    if (consumePressed('escape')) {
      this.scene = 'title';
      this.titleScreen.show();
      this.dialogue.hide();
    }

    this.hud.updateMemoryText(this.state.memories.length, 3);
    this.hud.updatePrompt(this.interactionPrompt);

    saveGameState(this.state);
  }

  // Draw
  const ctx = this.ctx;
  const width = this.canvas.width;
  const height = this.canvas.height;

  ctx.fillStyle = '#0d1118';
  ctx.fillRect(0, 0, width, height);

  const location = getLocationData(this.state.currentLocation);
  const cameraX = this.camera.x;
  const cameraY = this.camera.y;

  ctx.fillStyle = location.bg;
  ctx.fillRect(
    -cameraX,
    -cameraY,
    location.bounds.w,
    location.bounds.h
  );

  // Background grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= location.bounds.w; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x - cameraX, -cameraY);
    ctx.lineTo(
      x - cameraX,
      location.bounds.h - cameraY
    );
    ctx.stroke();
  }

  for (let y = 0; y <= location.bounds.h; y += 80) {
    ctx.beginPath();
    ctx.moveTo(-cameraX, y - cameraY);
    ctx.lineTo(
      location.bounds.w - cameraX,
      y - cameraY
    );
    ctx.stroke();
  }

  // Colliders
  for (const collider of this.world.getColliders(
    this.state.currentLocation
  )) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';

    ctx.fillRect(
      collider.x - cameraX,
      collider.y - cameraY,
      collider.w,
      collider.h
    );
  }

  // Interactable objects
  for (const object of location.interactables) {
    const drawX = object.x - cameraX;
    const drawY = object.y - cameraY;

    ctx.fillStyle = object.color || '#9eb7ff';

    ctx.beginPath();
    ctx.arc(
      drawX,
      drawY,
      object.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Highlight currently interactable object
    if (
      this.currentInteraction &&
      this.currentInteraction.id === object.id
    ) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
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

    // Memory location visual effect
    if (
      object.id === 'memory1' ||
      object.id === 'memory2' ||
      object.id === 'memory3'
    ) {
      if (!this.state.memoryLocations[object.id]) {
        const pulse =
          1 + Math.sin(performance.now() / 300) * 0.15;

        ctx.strokeStyle = 'rgba(168,255,208,0.45)';
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
  }

  // Player
  this.player.draw(ctx, cameraX, cameraY);

  // Memory Echo message
  drawMemoryEcho.call(this, ctx);

  // Title overlay
  if (this.scene === 'title') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, width, height);
  }

  requestAnimationFrame(this.loop);
}

function triggerInteraction() {
  if (!this.currentInteraction) return;

  const id = this.currentInteraction.id;

  this.audio.playSfx('interaction');

  // Memory interactions
  if (
    id === 'memory1' ||
    id === 'memory2' ||
    id === 'memory3'
  ) {
    collectMemory.call(this, id);
    this.currentInteraction = null;
    return;
  }

  // Memory Recorder
  if (id === 'memoryRecorder') {
    this.dialogue.show(
      'MEMORY RECORDER',
      'The machine hums. Something inside is waiting.'
    );

    this.currentInteraction = null;
    return;
  }

  // Bed
  if (id === 'bed') {
    this.dialogue.show(
      'MAYA',
      'The sheets still smell like rain. You were here before.'
    );

    this.currentInteraction = null;
    return;
  }

  // Window
  if (id === 'window') {
    this.dialogue.show(
      'CITY',
      'Rain marks the glass like a memory.'
    );

    this.currentInteraction = null;
    return;
  }

  // Default interaction
  this.dialogue.show(
    'SILENCE',
    'Something feels unfinished here.'
  );

  this.currentInteraction = null;
}

function collectMemory(id) {
  // Don't collect the same memory twice
  if (this.state.memoryLocations[id]) return;

  const messages = {
    memory1:
      'A familiar voice whispers: “You promised you would remember.”',

    memory2:
      'Rain. A train. Someone waiting for you.',

    memory3:
      'A room you recognize... but cannot remember entering.'
  };

  // Mark memory as discovered
  this.state.memoryLocations[id] = true;

  // Add to memories array
  if (!this.state.memories.includes(id)) {
    this.state.memories.push(id);
  }

  // Activate Memory Echo
  this.state.activeEcho = id;
  this.state.echoMessage =
    messages[id] || 'Something returns to your memory.';

  this.state.echoTimer = 5;

  this.state.echoLocation =
    this.state.currentLocation;

  // Update HUD
  this.hud.updateMemoryText(
    this.state.memories.length,
    3
  );

  // Save immediately
  saveGameState(this.state);

  this.audio.playSfx('interaction');
}

function drawMemoryEcho(ctx) {
  if (
    !this.state.activeEcho ||
    this.state.echoTimer <= 0
  ) {
    return;
  }

  const message =
    this.state.echoMessage || '';

  const alpha = Math.min(
    1,
    this.state.echoTimer / 1.5
  );

  ctx.save();

  ctx.globalAlpha = alpha;

  // Echo panel
  ctx.fillStyle = 'rgba(10,18,28,0.88)';
  ctx.fillRect(
    280,
    570,
    720,
    70
  );

  // Border
  ctx.strokeStyle =
    'rgba(170,255,210,0.45)';

  ctx.lineWidth = 1;

  ctx.strokeRect(
    280,
    570,
    720,
    70
  );

  // Title
  ctx.fillStyle = '#a8ffd0';

  ctx.font =
    'bold 14px sans-serif';

  ctx.textAlign = 'center';

  ctx.fillText(
    'MEMORY ECHO',
    640,
    595
  );

  // Message
  ctx.fillStyle = '#ffffff';

  ctx.font =
    '15px sans-serif';

  ctx.fillText(
    message,
    640,
    620
  );

  ctx.restore();
}

export function startGame(game) {
  game.scene = 'playing';

  game.titleScreen.hide();
  game.settingsPanel.hide();

  game.audio.startAmbient();

  game.player.x =
    game.state.player.x || 190;

  game.player.y =
    game.state.player.y || 220;
}
