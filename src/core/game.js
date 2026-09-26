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
    currentInteraction: null
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

  game.syncUiFromState();
  game.showTitle();
  game.loop = game.loop.bind(game);

  return game;
}

createGame.prototype.syncWorldToState = function () {
  const location = getLocationData(this.state.currentLocation);
  this.player.x = this.state.player.x || location.spawn.x;
  this.player.y = this.state.player.y || location.spawn.y;
  this.camera.x = this.player.x - this.canvas.width / 2;
  this.camera.y = this.player.y - this.canvas.height / 2;
};

createGame.prototype.syncUiFromState = function () {
  this.hud.updateMemoryText(this.state.memories.length, 3);
  this.hud.updateObjective(this.state.objective || 'Find the Memory Recorder.');
};

createGame.prototype.showTitle = function () {
  this.scene = 'title';
  this.titleScreen.show();
  this.dialogue.hide();
};

createGame.prototype.start = function () {
  this.scene = 'playing';
  this.titleScreen.hide();
  this.settingsPanel.hide();
  this.audio.startAmbient();
  this.syncWorldToState();
};

createGame.prototype.updateInteraction = function () {
  const location = getLocationData(this.state.currentLocation);
  const player = this.player;
  let closest = null;
  let closestDistance = Infinity;

  for (const object of location.interactables) {
    const dx = player.x - object.x;
    const dy = player.y - object.y;
    const distance = Math.hypot(dx, dy);
    if (distance < object.radius + 26 && distance < closestDistance) {
      closest = object;
      closestDistance = distance;
    }
  }

  this.currentInteraction = closest;
  this.interactionPrompt = closest ? '[E] INTERACT' : '';
};

createGame.prototype.triggerInteraction = function () {
  if (!this.currentInteraction) return;
  const id = this.currentInteraction.id;
  this.audio.playSfx('interaction');

  if (id === 'memoryRecorder') {
    this.dialogue.show('MEMORY RECORDER', 'The machine hums. Something inside is waiting.');
    this.currentInteraction = null;
    return;
  }

  if (id === 'bed') {
    this.dialogue.show('MAYA', 'The sheets still smell like rain. You were here before.');
    this.currentInteraction = null;
    return;
  }

  if (id === 'window') {
    this.dialogue.show('CITY', 'Rain marks the glass like a memory.');
    this.currentInteraction = null;
    return;
  }

  this.dialogue.show('SILENCE', 'Something feels unfinished here.');
  this.currentInteraction = null;
};

createGame.prototype.update = function (dt) {
  if (this.scene !== 'playing') return;

  const movement = getMovementVector();
  this.player.update(dt, movement, this.world.getColliders(this.state.currentLocation));

  this.state.player.x = this.player.x;
  this.state.player.y = this.player.y;

  this.camera.x = this.player.x - this.canvas.width / 2;
  this.camera.y = this.player.y - this.canvas.height / 2;

  this.updateInteraction();

  if (consumePressed('e') && this.currentInteraction) {
    this.triggerInteraction();
  }

  if (consumePressed('escape')) {
    this.showTitle();
  }

  this.hud.updateMemoryText(this.state.memories.length, 3);
  this.hud.updatePrompt(this.interactionPrompt);

  saveGameState(this.state);
};

createGame.prototype.draw = function () {
  const ctx = this.ctx;
  const width = this.canvas.width;
  const height = this.canvas.height;

  ctx.fillStyle = '#0d1118';
  ctx.fillRect(0, 0, width, height);

  const location = getLocationData(this.state.currentLocation);
  const cameraX = this.camera.x;
  const cameraY = this.camera.y;

  ctx.fillStyle = location.bg;
  ctx.fillRect(-cameraX, -cameraY, location.bounds.w, location.bounds.h);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= location.bounds.w; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x - cameraX, -cameraY);
    ctx.lineTo(x - cameraX, location.bounds.h - cameraY);
    ctx.stroke();
  }
  for (let y = 0; y <= location.bounds.h; y += 80) {
    ctx.beginPath();
    ctx.moveTo(-cameraX, y - cameraY);
    ctx.lineTo(location.bounds.w - cameraX, y - cameraY);
    ctx.stroke();
  }

  for (const collider of this.world.getColliders(this.state.currentLocation)) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(collider.x - cameraX, collider.y - cameraY, collider.w, collider.h);
  }

  for (const object of location.interactables) {
    const drawX = object.x - cameraX;
    const drawY = object.y - cameraY;
    ctx.fillStyle = object.color || '#9eb7ff';
    ctx.beginPath();
    ctx.arc(drawX, drawY, object.radius, 0, Math.PI * 2);
    ctx.fill();

    if (this.currentInteraction && this.currentInteraction.id === object.id) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(drawX, drawY, object.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  this.player.draw(ctx, cameraX, cameraY);

  if (this.scene === 'title') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, width, height);
  }
};

createGame.prototype.loop = function (time) {
  const dt = Math.min((time - this.lastTime) / 1000 || 0.016, 0.033);
  this.lastTime = time;
  this.update(dt);
  this.draw();
  requestAnimationFrame(this.loop);
};

createGame.prototype.startLoop = function () {
  requestAnimationFrame(this.loop);
};
