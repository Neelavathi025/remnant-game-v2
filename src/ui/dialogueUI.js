export function createDialoguePanel(root, game) {
  const panel = document.createElement('div');
  panel.className = 'dialogue-panel hidden';

  const speaker = document.createElement('div');
  speaker.className = 'dialogue-speaker';

  const text = document.createElement('div');
  text.className = 'dialogue-text';

  panel.appendChild(speaker);
  panel.appendChild(text);
  root.appendChild(panel);

  return {
    element: panel,
    show(name, value) {
      speaker.textContent = name;
      text.textContent = value;
      panel.classList.remove('hidden');
    },
    hide() {
      panel.classList.add('hidden');
    },
    setText(value) {
      text.textContent = value;
    }
  };
}
