const keys = new Set();
const pressed = new Set();

export function bindInput() {
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'e', 'escape'].includes(key)) {
      event.preventDefault();
    }
    if (!keys.has(key)) pressed.add(key);
    keys.add(key);
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    keys.delete(key);
    pressed.delete(key);
  });
}

export function isKeyDown(key) {
  return keys.has(key.toLowerCase());
}

export function consumePressed(key) {
  const normalized = key.toLowerCase();
  if (pressed.has(normalized)) {
    pressed.delete(normalized);
    return true;
  }
  return false;
}

export function getMovementVector() {
  let x = 0;
  let y = 0;

  if (isKeyDown('w') || isKeyDown('arrowup')) y -= 1;
  if (isKeyDown('s') || isKeyDown('arrowdown')) y += 1;
  if (isKeyDown('a') || isKeyDown('arrowleft')) x -= 1;
  if (isKeyDown('d') || isKeyDown('arrowright')) x += 1;

  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}
