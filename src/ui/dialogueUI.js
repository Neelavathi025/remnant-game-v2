import {
  continueAfterMemory
} from '../game/game.js';


export function createDialoguePanel(root, game) {

  const panel =
    document.createElement('div');

  panel.className =
    'dialogue-panel hidden';


  const speaker =
    document.createElement('div');

  speaker.className =
    'dialogue-speaker';


  const text =
    document.createElement('div');

  text.className =
    'dialogue-text';


  const buttons =
    document.createElement('div');

  buttons.className =
    'dialogue-buttons';


  panel.appendChild(
    speaker
  );

  panel.appendChild(
    text
  );

  panel.appendChild(
    buttons
  );


  root.appendChild(
    panel
  );


  function clearButtons() {

    buttons.innerHTML = '';
  }


  function makeButton(
    label,
    callback
  ) {

    const button =
      document.createElement('button');


    button.type =
      'button';


    button.textContent =
      label;


    button.style.marginTop =
      '18px';


    button.style.marginRight =
      '10px';


    button.style.padding =
      '10px 24px';


    button.style.border =
      '1px solid rgba(168,255,208,0.55)';


    button.style.background =
      'rgba(168,255,208,0.08)';


    button.style.color =
      '#ffffff';


    button.style.borderRadius =
      '6px';


    button.style.cursor =
      'pointer';


    button.style.fontSize =
      '14px';


    button.style.fontFamily =
      'inherit';


    button.addEventListener(
      'click',
      (event) => {

        event.preventDefault();

        event.stopPropagation();

        callback();
      }
    );


    buttons.appendChild(
      button
    );


    return button;
  }


  return {

    element: panel,


    show(name, value) {

      speaker.textContent =
        name;


      text.textContent =
        value;


      text.style.whiteSpace =
        'pre-line';


      clearButtons();


      /*
       * MEMORY 1
       */

      if (
        name === 'MEMORY 1'
      ) {

        makeButton(
          'CONTINUE',
          () => {

            panel.classList.add(
              'hidden'
            );

            continueAfterMemory(
              game,
              1
            );
          }
        );
      }


      /*
       * MEMORY 2
       */

      else if (
        name === 'MEMORY 2'
      ) {

        makeButton(
          'CONTINUE',
          () => {

            panel.classList.add(
              'hidden'
            );

            continueAfterMemory(
              game,
              2
            );
          }
        );
      }


      /*
       * MEMORY 3
       */

      else if (
        name === 'MEMORY 3'
      ) {

        makeButton(
          'CONTINUE',
          () => {

            panel.classList.add(
              'hidden'
            );

            continueAfterMemory(
              game,
              3
            );
          }
        );
      }


      /*
       * FINAL ENDING
       */

      else if (
        name ===
        'ALL MEMORIES RECOVERED'
      ) {

        makeButton(
          'PLAY AGAIN',
          () => {

            /*
             * Reset the state.
             */

            localStorage.removeItem(
              'remnant-save-v1'
            );


            window.location.reload();
          }
        );


        makeButton(
          'RETURN TO TITLE',
          () => {

            panel.classList.add(
              'hidden'
            );

            game.scene =
              'title';

            game.titleScreen.show();
          }
        );
      }


      /*
       * NORMAL DIALOGUE
       */

      else {

        makeButton(
          'CLOSE',
          () => {

            panel.classList.add(
              'hidden'
            );

            game.scene =
              'playing';
          }
        );
      }


      panel.classList.remove(
        'hidden'
      );
    },


    hide() {

      panel.classList.add(
        'hidden'
      );

      clearButtons();
    },


    setText(value) {

      text.textContent =
        value;

      text.style.whiteSpace =
        'pre-line';
    }
  };
}
