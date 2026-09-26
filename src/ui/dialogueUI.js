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

  function styleButton(button) {
    button.type = 'button';

    button.style.marginTop = '18px';
    button.style.marginRight = '10px';
    button.style.padding = '10px 24px';
    button.style.border = '1px solid rgba(168,255,208,0.55)';
    button.style.background = 'rgba(168,255,208,0.08)';
    button.style.color = '#ffffff';
    button.style.borderRadius = '6px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontFamily = 'inherit';

    button.addEventListener('mouseenter', () => {
      button.style.background =
        'rgba(168,255,208,0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background =
        'rgba(168,255,208,0.08)';
    });
  }

  function createButton(label, action) {
    const button = document.createElement('button');

    button.textContent = label;

    styleButton(button);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      action();
    });

    buttonContainer.appendChild(button);

    return button;
  }

  function continueMemory(memoryNumber) {
    /*
     * Close the current memory dialogue.
     */
    panel.classList.add('hidden');

    /*
     * Keep the game in the playing state.
     */
    game.scene = 'playing';

    /*
     * Update the objective according to the
     * number of memories already collected.
     */
    if (memoryNumber === 1) {
      game.state.objective = 'Find Memory 2.';
    }

    if (memoryNumber === 2) {
      game.state.objective = 'Find Memory 3.';
    }

    /*
     * After Memory 3, show the final ending.
     */
    if (memoryNumber === 3) {
      game.state.objective = 'Remember.';
      showEnding();
      return;
    }

    /*
     * Update the HUD immediately.
     */
    if (game.hud) {
      game.hud.updateMemoryText(
        game.state.memories.length,
        3
      );

      game.hud.updateObjective(
        game.state.objective
      );

      game.hud.updatePrompt('');
    }
  }

  function showEnding() {
    game.scene = 'ending';

    speaker.textContent =
      'ALL MEMORIES RECOVERED';

    text.textContent =
      'You came here looking for answers.\n\n' +
      'But some memories were never meant to be remembered.';

    text.style.whiteSpace = 'pre-line';

    clearButtons();

    createButton('PLAY AGAIN', () => {
      /*
       * Completely reset the game state.
       */
      game.state = {
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

      /*
       * Reset player position.
       */
      game.player.x = 190;
      game.player.y = 220;

      /*
       * Return to gameplay.
       */
      game.scene = 'playing';

      panel.classList.add('hidden');

      if (game.hud) {
        game.hud.updateMemoryText(0, 3);
        game.hud.updateObjective(
          'Find the Memory Recorder.'
        );
        game.hud.updatePrompt('');
      }
    });

    createButton('RETURN TO TITLE', () => {
      panel.classList.add('hidden');

      game.scene = 'title';

      if (game.titleScreen) {
        game.titleScreen.show();
      }
    });

    panel.classList.remove('hidden');
  }

  return {
    element: panel,

    show(name, value) {
      speaker.textContent = name;

      text.textContent = value;

      text.style.whiteSpace = 'pre-line';

      clearButtons();

      /*
       * MEMORY 1
       */
      if (name === 'MEMORY 1') {
        createButton('CONTINUE', () => {
          continueMemory(1);
        });
      }

      /*
       * MEMORY 2
       */
      else if (name === 'MEMORY 2') {
        createButton('CONTINUE', () => {
          continueMemory(2);
        });
      }

      /*
       * MEMORY 3
       */
      else if (name === 'MEMORY 3') {
        createButton('CONTINUE', () => {
          continueMemory(3);
        });
      }

      /*
       * Final ending.
       */
      else if (name === 'ALL MEMORIES RECOVERED') {
        showEnding();
        return;
      }

      /*
       * Normal dialogue such as BED,
       * WINDOW, and MEMORY RECORDER.
       */
      else {
        createButton('CLOSE', () => {
          panel.classList.add('hidden');
          game.scene = 'playing';
        });
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
