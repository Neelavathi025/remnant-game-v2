export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.velocityX = 0;
    this.velocityY = 0;
    this.drag = 0.82;
    this.maxSpeed = 175;
    this.acceleration = 700;
  }

  update(dt, movement, colliders) {
    const desiredX = movement.x * this.acceleration * dt;
    const desiredY = movement.y * this.acceleration * dt;

    this.velocityX += desiredX;
    this.velocityY += desiredY;

    const speed = Math.hypot(this.velocityX, this.velocityY);
    if (speed > this.maxSpeed) {
      const ratio = this.maxSpeed / speed;
      this.velocityX *= ratio;
      this.velocityY *= ratio;
    }

    const nextX = this.x + this.velocityX * dt;
    const nextY = this.y + this.velocityY * dt;

    if (!this.collidesWithWall(nextX, this.y, colliders)) {
      this.x = nextX;
    }

    if (!this.collidesWithWall(this.x, nextY, colliders)) {
      this.y = nextY;
    }

    this.velocityX *= this.drag;
    this.velocityY *= this.drag;
    if (Math.abs(this.velocityX) < 0.01) this.velocityX = 0;
    if (Math.abs(this.velocityY) < 0.01) this.velocityY = 0;
  }

  collidesWithWall(x, y, colliders) {
    const bounds = {
      x: x - this.radius,
      y: y - this.radius,
      w: this.radius * 2,
      h: this.radius * 2
    };

    for (const wall of colliders) {
      const overlaps =
        bounds.x < wall.x + wall.w &&
        bounds.x + bounds.w > wall.x &&
        bounds.y < wall.y + wall.h &&
        bounds.y + bounds.h > wall.y;

      if (overlaps) return true;
    }

    return false;
  }

  draw(ctx, cameraX, cameraY) {
    ctx.fillStyle = '#dfe6ff';
    ctx.beginPath();
    ctx.arc(this.x - cameraX, this.y - cameraY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(this.x - cameraX, this.y - cameraY, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
