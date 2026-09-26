export function createTitleScreen(root, game) {
  const panel = document.createElement('div');
  panel.className = 'title-screen';

  const content = document.createElement('div');
  content.className = 'title-content';

  const title = document.createElement('h1');
  title.textContent = 'REMNANT';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'Some memories are better left forgotten.';

  const buttons = document.createElement('div');
  buttons.className = 'title-buttons';

  const newGameButton = document.createElement('button');
  newGameButton.textContent = 'NEW GAME';
  newGameButton.addEventListener('click', () => {
    game.state.currentLocation = 'apartment';
    game.state.player = { x: 190, y: 220 };
    game.state.memories = [];
    game.state.objective = 'Find the Memory Recorder.';
    game.start();
  });

  const settingsButton = document.createElement('button');
  settingsButton.textContent = 'SETTINGS';
  settingsButton.addEventListener('click', () => {
    game.settingsPanel.show();
  });

  buttons.appendChild(newGameButton);
  buttons.appendChild(settingsButton);
  content.appendChild(title);
  content.appendChild(subtitle);
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
