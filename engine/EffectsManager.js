export default class EffectsManager {
  constructor(game) {
    this.game = game;
    this.clouds = this.initClouds();
    this.smokeParticles = [];
    this.activeThrow = null; // Para la animación de lanzamiento en arco

    this.sceneTransition = {
      active: false,
      mode: "none",
      alpha: 0,
      targetScene: null,
      targetX: 0,
      targetY: 0
    };
  }

  initClouds() {
    const clouds = [];
    for (let i = 0; i < 7; i++) {
      clouds.push({
        x: Math.random() * 2400,
        y: 20 + Math.random() * 110,
        speed: 0.12 + Math.random() * 0.2,
        scale: 0.6 + Math.random() * 0.5
      });
    }
    return clouds;
  }

  update() {
    if (this.game.scene === "outside") {
      this.clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -200) {
          c.x = this.game.worldWidth + 200;
          c.y = 20 + Math.random() * 110;
        }
      });
    }

    this.updateSmoke();
    this.updateTransition();
    this.updateThrow();
  }

  // --- PUNTO 3: Trayectoria en Arco al Reciclar ---
  throwTrash(item, startX, startY, targetX, targetY, onComplete) {
    this.activeThrow = {
      item,
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      speed: 0.05,
      arcHeight: 50,
      onComplete
    };
  }

  updateThrow() {
    if (!this.activeThrow) return;

    this.activeThrow.progress += this.activeThrow.speed;
    if (this.activeThrow.progress >= 1) {
      const callback = this.activeThrow.onComplete;
      this.activeThrow = null;
      if (callback) callback();
    }
  }

  drawThrow(ctx, cameraX) {
    if (!this.activeThrow) return;

    const t = this.activeThrow.progress;
    const currentX = this.activeThrow.startX + (this.activeThrow.targetX - this.activeThrow.startX) * t;
    const linearY = this.activeThrow.startY + (this.activeThrow.targetY - this.activeThrow.startY) * t;
    const currentY = linearY - Math.sin(t * Math.PI) * this.activeThrow.arcHeight;

    const screenX = currentX - cameraX;
    const item = this.activeThrow.item;

    if (item && item.image && item.image.complete) {
      const cfg = item.cfg || { cols: 1 };
      const spriteW = item.image.naturalWidth / cfg.cols;
      const spriteH = item.image.naturalHeight;
      ctx.drawImage(
        item.image,
        item.spriteIndex * spriteW, 0, spriteW, spriteH,
        screenX - 16, currentY - 16, 32, 32
      );
    }
  }

  // --- NUBES Y HUMO ---
  spawnTruckSmoke(x, y) {
    this.smokeParticles.push({
      x, y,
      vx: 0.5 + Math.random() * 0.5,
      vy: -0.2 - Math.random() * 0.3,
      radius: 3.5 + Math.random() * 3,
      alpha: 0.45
    });
  }

  updateSmoke() {
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      let s = this.smokeParticles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.radius += 0.18;
      s.alpha -= 0.012;
      if (s.alpha <= 0) this.smokeParticles.splice(i, 1);
    }
  }

  drawClouds(ctx, cameraX) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    this.clouds.forEach(c => {
      const drawX = c.x - cameraX;
      ctx.beginPath();
      ctx.arc(drawX, c.y, 30 * c.scale, 0, Math.PI * 2);
      ctx.arc(drawX + 25 * c.scale, c.y - 10 * c.scale, 40 * c.scale, 0, Math.PI * 2);
      ctx.arc(drawX + 50 * c.scale, c.y, 30 * c.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawSmoke(ctx, cameraX) {
    if (this.smokeParticles.length === 0) return;
    ctx.save();
    this.smokeParticles.forEach(s => {
      ctx.fillStyle = `rgba(160, 160, 165, ${Math.max(0, s.alpha)})`;
      ctx.beginPath();
      ctx.arc(s.x - cameraX, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // --- TRANSICIÓN A NEGRO ---
  startSceneTransition(targetScene, targetX, targetY) {
    if (this.sceneTransition.active) return;
    this.sceneTransition.active = true;
    this.sceneTransition.mode = "out";
    this.sceneTransition.alpha = 0;
    this.sceneTransition.targetScene = targetScene;
    this.sceneTransition.targetX = targetX;
    this.sceneTransition.targetY = targetY;
  }

  updateTransition() {
    if (!this.sceneTransition.active) return;

    if (this.sceneTransition.mode === "out") {
      this.sceneTransition.alpha += 0.08;
      if (this.sceneTransition.alpha >= 1) {
        this.sceneTransition.alpha = 1;
        this.game.scene = this.sceneTransition.targetScene;
        this.game.player.x = this.sceneTransition.targetX;
        this.game.player.y = this.sceneTransition.targetY;
        this.game.player.vx = 0;
        this.game.player.vy = 0;
        this.game.player.onGround = true;
        this.game.updateCamera();
        this.sceneTransition.mode = "in";
      }
    } else if (this.sceneTransition.mode === "in") {
      this.sceneTransition.alpha -= 0.08;
      if (this.sceneTransition.alpha <= 0) {
        this.sceneTransition.alpha = 0;
        this.sceneTransition.active = false;
        this.sceneTransition.mode = "none";
      }
    }
  }

  drawTransition(ctx, width, height) {
    if (this.sceneTransition.alpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${this.sceneTransition.alpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  // --- PUNTO 4: Iluminación de Ambiente ---
  drawAmbientLighting(ctx, scene, width, height) {
    ctx.save();
    if (scene === "inside") {
      // Luz cálida de hogar
      ctx.fillStyle = "rgba(255, 200, 110, 0.06)";
      ctx.fillRect(0, 0, width, height);
    } else {
      // Luz exterior fresca y natural
      ctx.fillStyle = "rgba(180, 220, 255, 0.03)";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }
}