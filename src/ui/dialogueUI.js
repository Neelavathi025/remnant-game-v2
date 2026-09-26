export function createDialoguePanel(root, game) {
  const panel = document.createElement('div');
  panel.className = 'dialogue-panel hidden';

  const speaker = document.createElement('div');
  speaker.className = 'dialogue-speaker';

  const text = document.createElement('div');
  text.className = 'dialogue-text';

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'dialogue-buttons';

  panel.appendChild(speaker);
  panel.appendChild(text);
  panel.appendChild(buttonContainer);

  root.appendChild(panel);

  function clearButtons() {
    buttonContainer.innerHTML = '';
  }

  function createButton(label) {
    const button = document.createElement('button');

    button.textContent = label;

    button.type = 'button';

    button.style.marginTop = '18px';
    button.style.padding = '10px 22px';
    button.style.border = '1px solid rgba(168,255,208,0.5)';
    button.style.background = 'rgba(168,255,208,0.08)';
    button.style.color = '#ffffff';
    button.style.borderRadius = '6px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontFamily = 'inherit';

    button.addEventListener('mouseenter', () => {
      button.style.background =
        'rgba(168,255,208,0.18)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background =
        'rgba(168,255,208,0.08)';
    });

    buttonContainer.appendChild(button);

    return button;
  }

  return {
    element: panel,

    show(name, value) {
      speaker.textContent = name;

      text.textContent = value;

      /*
       * Allow the \n characters in the memory story
       * to appear as separate lines.
       */
      text.style.whiteSpace = 'pre-line';

      clearButtons();

      /*
       * Memory screens need a CONTINUE button.
       */
      if (
        name === 'MEMORY 1' ||
        name === 'MEMORY 2' ||
        name === 'MEMORY 3'
      ) {
        createButton('CONTINUE');
      }

      /*
       * Final ending screen.
       */
      if (
        name === 'ALL MEMORIES RECOVERED'
      ) {
        createButton('PLAY AGAIN');

        createButton('RETURN');
      }

      panel.classList.remove('hidden');
    },

    hide() {
      panel.classList.add('hidden');

      clearButtons();
    },

    setText(value) {
      text.textContent = value;

      text.style.whiteSpace = 'pre-line';
    }
  };
}
