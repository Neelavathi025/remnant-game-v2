import { startGame } from '../core/game.js';

export function createTitleScreen(root, game) {
  const panel = document.createElement('div');
  panel.className = 'title-screen';

  const content = document.createElement('div');
  content.className = 'title-content';

  const introLines = document.createElement('div');
  introLines.className = 'intro-lines';

  const line1 = document.createElement('p');
  line1.className = 'intro-line';
  line1.textContent = 'YOU DON\'T REMEMBER ARRIVING HERE.';

  const line2 = document.createElement('p');
  line2.className = 'intro-line';
  line2.textContent = 'The city is familiar. But you don\'t remember why.';

  const line3 = document.createElement('p');
  line3.className = 'intro-line';
  line3.textContent = 'Something is missing.';

  const separator = document.createElement('div');
  separator.className = 'intro-separator';

  const line4 = document.createElement('p');
  line4.className = 'intro-line intro-line-main';
  line4.textContent = 'Find the Memory Recorder.';

  introLines.appendChild(line1);
  introLines.appendChild(line2);
  introLines.appendChild(line3);
  introLines.appendChild(separator);
  introLines.appendChild(line4);

  const buttons = document.createElement('div');
  buttons.className = 'title-buttons';

  const newGameButton = document.createElement('button');
  newGameButton.textContent = 'NEW GAME';
  newGameButton.addEventListener('click', () => {
    game.state.currentLocation = 'apartment';
    game.state.player = { x: 190, y: 220 };
    game.state.memories = [];
    game.state.memoryLocations = {
      'memory1': false,
      'memory2': false,
      'memory3': false
    };
    game.state.objective = 'Find the Memory Recorder.';
    game.state.ending = null;
    startGame(game);
  });

  const continueButton = document.createElement('button');
  continueButton.textContent = 'CONTINUE';
  continueButton.addEventListener('click', () => {
    startGame(game);
  });

  const settingsButton = document.createElement('button');
  settingsButton.textContent = 'SETTINGS';
  settingsButton.addEventListener('click', () => {
    game.settingsPanel.show();
  });

  buttons.appendChild(newGameButton);
  buttons.appendChild(continueButton);
  buttons.appendChild(settingsButton);
  content.appendChild(introLines);
  content.appendChild(buttons);
  panel.appendChild(content);
  root.appendChild(panel);

  return {
    element: panel,
    show() {
      panel.classList.add('visible');
    },
    hide() {
      panel.classList.remove('visible');
    }
  };
}

export function createSettingsPanel(root, game) {
  const panel = document.createElement('div');
  panel.className = 'settings-panel hidden';

  const title = document.createElement('h2');
  title.textContent = 'SETTINGS';

  const close = document.createElement('button');
  close.textContent = 'CLOSE';
  close.addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  panel.appendChild(title);
  panel.appendChild(close);
  root.appendChild(panel);

  return {
    element: panel,
    show() {
      panel.classList.remove('hidden');
    },
    hide() {
      panel.classList.add('hidden');
    }
  };
}

export function createMemorySequence(root, game, memoryNumber) {
  const panel = document.createElement('div');
  panel.className = 'memory-sequence';

  const content = document.createElement('div');
  content.className = 'memory-content';

  const memoryData = getMemoryText(memoryNumber);

  const header = document.createElement('p');
  header.className = 'memory-header';
  header.textContent = memoryData.header;

  const textContainer = document.createElement('div');
  textContainer.className = 'memory-text-container';

  memoryData.lines.forEach((line) => {
    const p = document.createElement('p');
    p.className = 'memory-line';
    p.textContent = line;
    textContainer.appendChild(p);
  });

  const continuePrompt = document.createElement('p');
  continuePrompt.className = 'memory-continue';
  continuePrompt.textContent = 'Press E to continue...';

  content.appendChild(header);
  content.appendChild(textContainer);
  content.appendChild(continuePrompt);
  panel.appendChild(content);
  root.appendChild(panel);

  return {
    element: panel,
    show() {
      panel.classList.add('visible');
    },
    hide() {
      panel.classList.remove('visible');
    }
  };
}

export function createEndingSequence(root, game) {
  const panel = document.createElement('div');
  panel.className = 'ending-sequence';

  const content = document.createElement('div');
  content.className = 'ending-content';

  const header = document.createElement('p');
  header.className = 'ending-header';
  header.textContent = 'ALL MEMORIES RECOVERED';

  const textContainer = document.createElement('div');
  textContainer.className = 'ending-text-container';

  const line1 = document.createElement('p');
  line1.className = 'ending-line';
  line1.textContent = 'You came here looking for answers.';

  const line2 = document.createElement('p');
  line2.className = 'ending-line';
  line2.textContent = 'But some memories were never meant to be remembered.';

  textContainer.appendChild(line1);
  textContainer.appendChild(line2);

  const buttons = document.createElement('div');
  buttons.className = 'ending-buttons';

  const playAgainButton = document.createElement('button');
  playAgainButton.textContent = 'PLAY AGAIN';
  playAgainButton.addEventListener('click', () => {
    game.state.currentLocation = 'apartment';
    game.state.player = { x: 190, y: 220 };
    game.state.memories = [];
    game.state.memoryLocations = {
      'memory1': false,
      'memory2': false,
      'memory3': false
    };
    game.state.objective = 'Find the Memory Recorder.';
    game.state.ending = null;
    panel.classList.remove('visible');
    game.endingSequence.hide();
    game.startGame();
  });

  buttons.appendChild(playAgainButton);
  content.appendChild(header);
  content.appendChild(textContainer);
  content.appendChild(buttons);
  panel.appendChild(content);
  root.appendChild(panel);

  return {
    element: panel,
    show() {
      panel.classList.add('visible');
    },
    hide() {
      panel.classList.remove('visible');
    }
  };
}

function getMemoryText(memoryNumber) {
  const memories = {
    1: {
      header: 'MEMORY 01',
      lines: [
        'I remember standing at the entrance of this city.',
        'But I don\'t remember coming here.',
        'I was not alone.'
      ]
    },
    2: {
      header: 'MEMORY 02',
      lines: [
        'Someone was with me.',
        'I remember their voice.',
        'But their face is gone.',
        'They told me not to trust the city.'
      ]
    },
    3: {
      header: 'MEMORY 03',
      lines: [
        'Now I remember.',
        'I wasn\'t searching for the city.',
        'The city was searching for me.'
      ]
    }
  };

  return memories[memoryNumber] || { header: '', lines: [] };
}
