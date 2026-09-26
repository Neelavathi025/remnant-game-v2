import { createGame } from './core/game.js';

const root = document.getElementById('gameRoot');
const game = createGame(root);
game.startLoop();
