export default class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.width = 72;
    this.height = 108;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    this.speed = isMobile ? 3.6 : 3.6;

    this.vx = 0;
    this.vy = 0;

    this.gravity = isMobile ? 0.1 : 0.1;
    this.jumpStrength = -4;

    this.onGround = false;
    this.wasGrounded = false;
    this.onPlatform = false;
    this.facing = 1;
    this.wasOnPlatform = false;
    this.jumpedFromPlatform = false;

    // Temporizador para atravesar plataformas hacia abajo
    this.passThroughTimer = 0;

    // Carga del icono de la bolsa de basura
    this.bolsaImage = new Image();
    this.bolsaImage.src = "assets/basura/bolsa.png";

    this.idleFrames = [];
    this.walkFrames = [];
    this.jumpFrames = [];
    this.seeFrames = [];

    this.currentAnim = "idle";
    this.currentFrameIndex = 0;
    this.animFrameCounter = 0;

    this.animationSpeeds = {
      idle: 70,
      walk: 26,
      jump: 30,
      see: 300
    };

    this.loadFrames(this.idleFrames, ["idle1.png", "idle2.png", "idle3.png"]);
    this.loadFrames(this.walkFrames, ["walk1.png", "walk2.png", "walk3.png", "walk4.png"]);
    this.loadFrames(this.jumpFrames, ["jump1.png", "jump2.png", "jump3.png"]);
    this.loadFrames(this.seeFrames, ["viendo1.png", "viendo2.png"]);
  }

  loadFrames(targetArray, names) {
    names.forEach(name => {
      const img = new Image();
      img.src = `assets/hero/${name}`;
      targetArray.push(img);
    });
  }

  update(keys, worldWidth, groundY, platforms) {
    this.vx = 0;
    if (keys["ArrowLeft"]) {
      this.vx = -this.speed;
      this.facing = -1;
    }
    if (keys["ArrowRight"]) {
      this.vx = this.speed;
      this.facing = 1;
    }

    // Bajar de plataformas
    if (this.passThroughTimer > 0) {
      this.passThroughTimer--;
    }

    if ((keys["ArrowDown"] || keys["s"] || keys["S"]) && this.onPlatform && this.passThroughTimer === 0) {
      this.y += 4;
      this.vy = 1;
      this.onGround = false;
      this.onPlatform = false;
      this.passThroughTimer = 15;
    }

    // Salto
    if ((keys["ArrowUp"] || keys[" "]) && this.onGround) {
      this.jumpedFromPlatform = this.onPlatform;
      this.vy = this.jumpStrength;
      this.onGround = false;
      this.onPlatform = false;
    }

    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > worldWidth) this.x = worldWidth - this.width;

    this.wasOnPlatform = this.onPlatform || this.jumpedFromPlatform;
    this.wasGrounded = this.onGround;
    this.onGround = false;
    this.onPlatform = false;

    // Colisión con plataformas
    if (this.passThroughTimer === 0) {
      for (const p of platforms) {
        const pieIzquierdo = this.x + 14;
        const pieDerecho = this.x + this.width - 14;

        if (
          pieIzquierdo < p.x + p.width &&
          pieDerecho > p.x &&
          this.y + this.height > p.y &&
          this.y + this.height < p.y + p.height &&
          this.vy >= 0
        ) {
          this.y = p.y - this.height;
          this.vy = 0;
          this.onGround = true;
          this.onPlatform = true;
          this.jumpedFromPlatform = false;
        }
      }
    }

    // Colisión suelo
    if (!this.onPlatform && this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.onGround = true;
      this.jumpedFromPlatform = false;
    }

    if (!this.onGround) {
      this.setAnimation("jump");
    } else if (this.vx !== 0) {
      this.setAnimation("walk");
    } else {
      if (this.currentAnim === "see") {
        this.setAnimation("see");
      } else {
        this.setAnimation("idle");
      }
    }

    this.updateAnimation();
  }

  setAnimation(name) {
    if (this.currentAnim !== name) {
      this.currentAnim = name;
      this.currentFrameIndex = 0;
      this.animFrameCounter = 0;
    }
  }

  updateAnimation() {
    const frames = this.getCurrentFrames();
    if (!frames || frames.length === 0) return;

    const speed = this.animationSpeeds[this.currentAnim] || 24;

    this.animFrameCounter++;
    if (this.animFrameCounter >= speed) {
      this.animFrameCounter = 0;
      this.currentFrameIndex++;
      if (this.currentFrameIndex >= frames.length) {
        this.currentFrameIndex = 0;
      }
    }
  }

  getCurrentFrames() {
    switch (this.currentAnim) {
      case "walk": return this.walkFrames;
      case "jump": return this.jumpFrames;
      case "see": return this.seeFrames;
      case "idle":
      default: return this.idleFrames;
    }
  }

  draw(ctx, cameraX, carriedItem, groundY, platforms) {
    const screenX = this.x - cameraX;
    const screenY = this.y;

    const frames = this.getCurrentFrames();
    const img = frames && frames[this.currentFrameIndex];

    const visualOffsetY = (!this.onPlatform && this.onGround) ? 15 : 5;

    let shadowY = groundY + 12;
    let shadowAlpha = 0.22;
    let shadowW = 48;
    let shadowH = 8;
    let drawShadow = true;

    if (this.onPlatform) {
      shadowY = this.y + this.height + 3;
      shadowAlpha = 0.18;
      shadowW = 40;
      shadowH = 7;
    }

    if (!this.onGround) {
      if (this.jumpedFromPlatform) {
        drawShadow = false;
      } else {
        shadowY = groundY + 10;
        shadowAlpha = 0.10;
        shadowW = 34;
        shadowH = 5;
      }
    }

    const shadowX = screenX + this.width / 2;

    if (drawShadow) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(shadowX, shadowY, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (!img || !img.complete || img.naturalWidth === 0) {
      ctx.fillStyle = "#ffcc66";
      ctx.fillRect(screenX, screenY + visualOffsetY, this.width, this.height);
      if (carriedItem && carriedItem.image && carriedItem.image.complete) {
        this.drawCarriedItem(ctx, screenX, screenY + visualOffsetY, carriedItem);
      }
      return;
    }

    const scaleX = this.width / img.naturalWidth;
    const scaleY = this.height / img.naturalHeight;
    const drawWidth = img.naturalWidth * scaleX;
    const drawHeight = img.naturalHeight * scaleY;

    ctx.save();
    if (this.facing === -1) {
      ctx.translate(screenX + drawWidth / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(screenX + drawWidth / 2), 0);
    }

    const drawX = this.facing === 1 ? screenX : screenX - (drawWidth - this.width);

    ctx.drawImage(
      img,
      drawX,
      screenY + visualOffsetY,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    if (carriedItem && carriedItem.image && carriedItem.image.complete) {
      this.drawCarriedItem(ctx, screenX, screenY + visualOffsetY, carriedItem);
    }
  }

  drawCarriedItem(ctx, screenX, screenYWithOffset, carriedItem) {
    const img = carriedItem.image;
    const cfg = carriedItem.cfg || { cols: 1 };
    const cols = cfg.cols;

    const spriteW = img.naturalWidth / cols;
    const spriteH = img.naturalHeight;
    const sx = carriedItem.spriteIndex * spriteW;

    // EFECTO POP AL RECOGER
    if (!carriedItem.pickupTime) {
      carriedItem.pickupTime = performance.now();
    }

    const elapsed = performance.now() - carriedItem.pickupTime;
    const popDuration = 220;
    let popScale = 1;

    if (elapsed < popDuration) {
      const progress = elapsed / popDuration;
      popScale = 1 + 0.45 * Math.sin((1 - progress) * (Math.PI / 2));
    }

    const baseSize = 32;
    const drawW = baseSize * popScale;
    const drawH = baseSize * popScale;

    const objX = screenX + this.width / 2 - drawW / 2;
    const objY = screenYWithOffset - drawH - 8 - (drawH - baseSize) / 2;

    ctx.save();

    // Aplica la traslucidez ligera (80% opaco / 20% transparente)
    ctx.globalAlpha = 0.8;

    // 1. DIBUJAR LA BOLSA DE TRASFONDO
    if (this.bolsaImage.complete && this.bolsaImage.naturalWidth > 0) {
      const bolsaW = drawW * 1.25;
      const bolsaH = drawH * 1.25;
      const bolsaX = screenX + this.width / 2 - bolsaW / 2;
      const bolsaY = objY + (drawH - bolsaH) / 2;

      ctx.drawImage(this.bolsaImage, bolsaX, bolsaY, bolsaW, bolsaH);
    }

    // 2. DIBUJAR EL RESIDUO ENCIMA CON GLOW BLANCO
    ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
    ctx.shadowBlur = 10;

    ctx.drawImage(img, sx, 0, spriteW, spriteH, objX, objY, drawW, drawH);

    ctx.restore();
  }
}
