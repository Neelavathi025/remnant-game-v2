export function createHUD(root, game) {
  const hud = document.createElement('div');
  hud.className = 'hud';

  const title = document.createElement('div');
  title.className = 'hud-title';
  title.textContent = 'REMNANT';

  const memory = document.createElement('div');
  memory.className = 'hud-memory';
  memory.textContent = 'MEMORY 0/3';

  const objective = document.createElement('div');
  objective.className = 'hud-objective';
  objective.textContent = 'Current objective';

  const prompt = document.createElement('div');
  prompt.className = 'interaction-prompt';
  prompt.textContent = '';

  hud.appendChild(title);
  hud.appendChild(memory);
  hud.appendChild(objective);
  hud.appendChild(prompt);
  root.appendChild(hud);

  return {
    element: hud,
    updateMemoryText(count, max) {
      memory.textContent = `MEMORY ${count}/${max}`;
    },
    updateObjective(text) {
      objective.textContent = text;
    },
    updatePrompt(text) {
      prompt.textContent = text;
      prompt.classList.toggle('visible', Boolean(text));
    }
  };
}
