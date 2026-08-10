import Player from "../entities/Player.js";
import Trash from "../entities/Trash.js";
import Container from "../entities/Container.js";
import EffectsManager from "./EffectsManager.js";
import TruckSequence from "./TruckSequence.js";

// --- INTERCEPTOR GLOBAL DE AUDIO ---
if (!window._audioPlayPatched) {
  window._audioPlayPatched = true;
  const originalPlay = HTMLAudioElement.prototype.play;
  HTMLAudioElement.prototype.play = function (...args) {
    if (window._blockGameAudio && (!this.src || !this.src.includes("intro.mp4"))) {
      this.pause();
      return Promise.resolve();
    }
    return originalPlay.apply(this, args);
  };
}

export default class Game {
  shuffleArray(arr) {
    const shuffled = arr.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  clampPlayerInside() {
    if (this.scene !== "inside") return;
    this.player.x = Math.max(0, Math.min(this.player.x, this.width - this.player.width));
  }

  constructor(canvas, ctx, gameWidth, gameHeight) {
    this.canvas = canvas;
    this.ctx = ctx;

    this.width = gameWidth;
    this.height = gameHeight;
    this.worldWidth = 2400;
    this.groundY = 420;
    this.cameraX = 0;
    this.keys = {};

    // Módulos auxiliares
    this.effects = new EffectsManager(this);
    this.truckManager = new TruckSequence(this);

    this.collectedItem = null;
    this.gameOver = false;
    this.sequenceFinished = false;
    this.fadeToBlack = false;
    this.fadeAlpha = 0;

    // Estado de Pausa
    this.isPaused = false;

    this.showStartScreen = true;
    this.showIntroVideo = false;
    this.introVideoPlaying = false;
    this.introFadeAlpha = 0;
    this.introFadeMode = "in";

    this.gamepad = null;
    this.gamepadButtons = {};
    this.prevGamepadButtons = {};

    this.scene = "inside";
    this.doorZone = { x: 150, y: this.groundY - 90, width: 130, height: 150 };
    this.returnZone = { x: 0, y: this.groundY - 90, width: 150, height: 150 };
    this.outsideSpawn = { x: 150, y: this.groundY - 92 };
    this.insideSpawn = { x: 120, y: this.groundY - 92 };
    this.transitionLock = false;

    // Carga de imágenes
    this.backgroundImage = new Image(); this.backgroundImage.src = "assets/backgrounds/fondo1.png";
    this.houseImage = new Image(); this.houseImage.src = "assets/backgrounds/casa.jpg";
    this.motherImage = new Image(); this.motherImage.src = "assets/people/madre.png";
    this.fatherImage = new Image(); this.fatherImage.src = "assets/people/padre.png";
    this.motherImage2 = new Image(); this.motherImage2.src = "assets/people/madre2.png";
    this.fatherImage2 = new Image(); this.fatherImage2.src = "assets/people/padre2.png";
    this.talkImage = new Image(); this.talkImage.src = "assets/backgrounds/talk.png";
    this.dialogo1Image = new Image(); this.dialogo1Image.src = "assets/people/dialogo1.png";
    this.dialogo2Image = new Image(); this.dialogo2Image.src = "assets/people/dialogo2.png";
    this.enterImage = new Image(); this.enterImage.src = "assets/backgrounds/entrar.png";
    this.exitImage = new Image(); this.exitImage.src = "assets/backgrounds/salir.png";
    this.groundImage = new Image(); this.groundImage.src = "assets/backgrounds/suelo1.png";
    this.bushImage = new Image(); this.bushImage.src = "assets/backgrounds/arbusto.png";
    this.platformImage = new Image(); this.platformImage.src = "assets/backgrounds/plataforma.png";
    this.finishImage = new Image(); this.finishImage.src = "assets/backgrounds/terminado.png";
    this.remainingImage = new Image(); this.remainingImage.src = "assets/backgrounds/falta.png";
    this.startImage = new Image(); this.startImage.src = "assets/backgrounds/inicio.png";

    this.introVideo = document.createElement("video");
    this.introVideo.src = "assets/backgrounds/intro.mp4";
    this.introVideo.preload = "auto";
    this.introVideo.playsInline = true;
    this.introVideo.addEventListener("ended", () => {
      this.beginGameAfterIntro();
    });

    this.circulandoSound = new Audio("sounds/circulando.mp3"); this.circulandoSound.loop = true; this.circulandoSound.volume = 0.8;
    this.basuratSound = new Audio("sounds/basurat.mp3"); this.basuratSound.volume = 0.9;
    this.successSounds = [new Audio("sounds/S1.mp3"), new Audio("sounds/S2.mp3"), new Audio("sounds/S3.mp3"), new Audio("sounds/S4.mp3")];
    this.failSounds = [new Audio("sounds/No1.mp3"), new Audio("sounds/No3.mp3"), new Audio("sounds/No4.mp3")];
    this.finishSound = new Audio("sounds/terminado.mp3");

    this.player = new Player(this.insideSpawn.x, this.insideSpawn.y);

    this.platforms = [
      { x: 1340, y: this.groundY - 120, width: 200, height: 20 },
      { x: 1040, y: this.groundY - 140, width: 200, height: 20 },
      { x: 780,  y: this.groundY - 120,  width: 180, height: 20 },
      { x: 520,  y: this.groundY - 90, width: 180, height: 20 },
    ];

    this.containers = [
      new Container(440, this.groundY - 85, "amarillo"),
      new Container(830, this.groundY - 85, "azul"),
      new Container(1230, this.groundY - 85, "verde"),
      new Container(1630, this.groundY - 85, "marron"),
      new Container(2010, this.groundY - 85, "gris")
    ];

    this.trashPositions = [
      { x: 380, y: this.groundY - 30 }, { x: 650, y: this.groundY - 30 },
      { x: 580, y: this.groundY - 150 }, { x: 840, y: this.groundY - 170 },
      { x: 1350, y: this.groundY - 170 }, { x: 1750, y: this.groundY - 30 }
    ];

    this.trashDefinitions = [
      { type: "paper", color: "azul" }, { type: "plastic", color: "amarillo" },
      { type: "plastic", color: "amarillo" }, { type: "glass", color: "verde" },
      { type: "organic", color: "marron" }, { type: "resto", color: "restos" }
    ];

    this.setupTrashItems();

    this.talkZone = { x: 300, y: this.groundY - 210, width: 220, height: 210 };
    this.talkFrozen = false;
    this.lastActionPressed = false;

    this.bindEvents();
  }

  stopAllSounds() {
    const sounds = [this.circulandoSound, this.basuratSound, this.finishSound, ...this.successSounds, ...this.failSounds];
    sounds.forEach(s => {
      if (s) {
        s.pause();
        s.currentTime = 0;
      }
    });
  }

  setupTrashItems() {
    this.trashItems = [];
    const shuffled = this.shuffleArray(this.trashDefinitions);
    for (let i = 0; i < this.trashPositions.length; i++) {
      const pos = this.trashPositions[i];
      const def = shuffled[i];
      this.trashItems.push(new Trash(pos.x, pos.y, def.type, def.color));
    }
    this.remainingTrash = this.trashItems.length;
  }

  bindEvents() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.showIntroVideo) { this.skipIntro(); return; }
      if (this.showStartScreen) { this.startIntro(); return; }
      
      // Volver al menú principal tras terminar la secuencia final
      if (this.sequenceFinished && this.fadeAlpha >= 1) { 
        this.stopAllSounds();
        window.location.href = "../index.html";
        return; 
      }

      // Menú de pausa
      if (e.key === "Escape") {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
          this.stopAllSounds();
        } else if (this.scene === "outside") {
          this.circulandoSound.play().catch(() => {});
        }
        return;
      }

      this.keys[e.key] = true;
    });

    this.canvas.addEventListener("mousedown", (e) => { 
      if (this.showStartScreen) { this.startIntro(); return; }
      if (this.isPaused) { this.handlePauseMenuClick(e); return; }
      if (this.sequenceFinished && this.fadeAlpha >= 1) {
        this.stopAllSounds();
        window.location.href = "../index.html";
      }
    });

    this.canvas.addEventListener("touchstart", (e) => {
      if (this.showStartScreen) { this.startIntro(); return; }
      if (this.isPaused) { this.handlePauseMenuClick(e); return; }
      if (this.sequenceFinished && this.fadeAlpha >= 1) {
        this.stopAllSounds();
        window.location.href = "../index.html";
      }
    }, { passive: false });

    window.addEventListener("keyup", (e) => { this.keys[e.key] = false; });

    const bindTouchButton = (id, key) => {
      const button = document.getElementById(id);
      if (!button) return;
      const press = (e) => { e.preventDefault(); this.keys[key] = true; if (this.showStartScreen) this.startIntro(); };
      const release = (e) => { e.preventDefault(); this.keys[key] = false; };
      button.addEventListener("touchstart", press, { passive: false });
      button.addEventListener("touchend", release, { passive: false });
      button.addEventListener("mousedown", press);
      button.addEventListener("mouseup", release);
    };

    bindTouchButton("btnLeft", "ArrowLeft");
    bindTouchButton("btnRight", "ArrowRight");
    bindTouchButton("btnJump", "ArrowUp");
    bindTouchButton("btnAction", "Control");

    window.addEventListener("gamepadconnected", (e) => { this.gamepad = e.gamepad; });
    window.addEventListener("gamepaddisconnected", (e) => { if (this.gamepad && e.gamepad.index === this.gamepad.index) this.gamepad = null; });
  }

  handlePauseMenuClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;

    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    const panelW = 380;
    const panelH = 220;
    const panelY = (this.height - panelH) / 2;

    const btnW = 280;
    const btnH = 45;
    const btnX = (this.width - btnW) / 2;

    const resumeY = panelY + 80;
    const menuY = panelY + 140;

    // Reanudar
    if (
      clickX >= btnX && clickX <= btnX + btnW &&
      clickY >= resumeY && clickY <= resumeY + btnH
    ) {
      this.isPaused = false;
      if (this.scene === "outside") this.circulandoSound.play().catch(() => {});
    }

    // Menú Principal
    if (
      clickX >= btnX && clickX <= btnX + btnW &&
      clickY >= menuY && clickY <= menuY + btnH
    ) {
      this.stopAllSounds();
      window.location.href = "../index.html";
    }
  }

  start() { requestAnimationFrame(this.loop.bind(this)); }
  loop() { this.updateGamepadState(); this.update(); this.draw(); requestAnimationFrame(this.loop.bind(this)); }

  updateGamepadState() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    if (!pads) return;
    const pad = pads[this.gamepad ? this.gamepad.index : 0];
    if (!pad) return;
    this.prevGamepadButtons = { ...this.gamepadButtons };
    this.gamepadButtons["A"] = !!(pad.buttons[0] && pad.buttons[0].pressed);
    this.gamepadButtons["X"] = !!(pad.buttons[2] && pad.buttons[2].pressed);
    this.gamepadButtons["DLEFT"] = !!(pad.buttons[14] && pad.buttons[14].pressed);
    this.gamepadButtons["DRIGHT"] = !!(pad.buttons[15] && pad.buttons[15].pressed);
    const lx = (pad.axes || [])[0] || 0;
    this.gamepadButtons["LLEFT"] = lx < -0.25;
    this.gamepadButtons["LRIGHT"] = lx > 0.25;
    if (this.showStartScreen && pad.buttons.some(b => b.pressed)) this.startIntro();
  }

  startIntro() {
    window._blockGameAudio = true;
    this.stopAllSounds();

    document.querySelectorAll("audio, video").forEach(el => {
      if (el !== this.introVideo) {
        el.pause();
        el.currentTime = 0;
      }
    });

    this.showStartScreen = false;
    this.showIntroVideo = true;
    setTimeout(() => {
      if (!this.showIntroVideo) return;
      this.introVideoPlaying = true;
      this.introVideo.currentTime = 0;
      this.introVideo.play().catch(() => this.beginGameAfterIntro());
    }, 300);
  }

  beginGameAfterIntro() {
    if (this.introVideo) {
      try {
        this.introVideo.pause();
        this.introVideo.currentTime = 0;
      } catch (e) {}
    }

    window._blockGameAudio = false;

    this.showIntroVideo = false;
    this.introVideoPlaying = false;
    this.showStartScreen = false;
    this.fadeAlpha = 0;
    this.sequenceFinished = false;
  }

  skipIntro() {
    this.beginGameAfterIntro();
  }

  playRandomSound(list) { const a = list[Math.floor(Math.random() * list.length)]; a.currentTime = 0; a.play().catch(()=>{}); }
  isActionPressed() { return !!this.keys["Control"] || (!!this.gamepadButtons["X"] && !this.prevGamepadButtons["X"]); }

  update() {
    if (this.showIntroVideo || this.showStartScreen || this.isPaused) return;

    if (this.gamepad) {
      this.keys["ArrowUp"] = !!this.gamepadButtons["A"];
      this.keys["ArrowLeft"] = this.gamepadButtons["DLEFT"] || this.gamepadButtons["LLEFT"];
      this.keys["ArrowRight"] = this.gamepadButtons["DRIGHT"] || this.gamepadButtons["LRIGHT"];
    }

    if (this.sequenceFinished) {
      if (this.fadeToBlack && this.fadeAlpha < 1) this.fadeAlpha = Math.min(1, this.fadeAlpha + 0.012);
      return;
    }

    this.effects.update();
    this.truckManager.update();

    // FILTRAR PLATAFORMAS: Solo existen fuera de la casa
    const activePlatforms = this.scene === "outside" ? this.platforms : [];

    if (this.effects.sceneTransition.active) {
      this.player.update({}, this.worldWidth, this.groundY, activePlatforms);
      this.clampPlayerInside();
      this.updateCamera();
      return;
    }

    const inTalk = this.scene === "inside" && this.isColliding(this.player, this.talkZone);
    const actionPressed = this.isActionPressed();

    if (this.scene === "inside" && inTalk && actionPressed && !this.lastActionPressed) {
      this.talkFrozen = !this.talkFrozen;
      this.keys["Control"] = false;
    }

    if (this.talkFrozen) {
      this.player.update({}, this.worldWidth, this.groundY, activePlatforms);
      this.clampPlayerInside();
      this.updateCamera();
      this.lastActionPressed = actionPressed;
      return;
    }

    if (!this.transitionLock && this.keys["Control"]) {
      if (this.scene === "outside" && this.isColliding(this.player, this.doorZone)) {
        this.effects.startSceneTransition("inside", this.insideSpawn.x, this.insideSpawn.y);
        this.transitionLock = true; setTimeout(() => (this.transitionLock = false), 400);
        this.keys["Control"] = false;
      } else if (this.scene === "inside" && this.isColliding(this.player, this.returnZone)) {
        this.effects.startSceneTransition("outside", this.outsideSpawn.x, this.outsideSpawn.y);
        this.transitionLock = true; setTimeout(() => (this.transitionLock = false), 400);
        this.keys["Control"] = false;
      }
    }

    if (!this.truckSequenceStarted && this.keys["q"] && this.keys["r"] && this.keys["t"]) {
      this.gameOver = true;
      this.truckManager.start();
    }

    // Actualización del personaje
    if (this.truckSequenceStarted) {
      this.player.update(this.keys, this.worldWidth, this.groundY, activePlatforms);
      if (!this.keys["ArrowLeft"] && !this.keys["ArrowRight"]) {
        this.player.setAnimation("see");
      }
    } else if (this.gameOver) {
      this.player.update({}, this.worldWidth, this.groundY, activePlatforms);
    } else {
      this.player.update(this.keys, this.worldWidth, this.groundY, activePlatforms);
    }

    this.clampPlayerInside();
    this.updateCamera();

    // Recoger residuos
    if (this.scene === "outside" && !this.collectedItem && !this.effects.activeThrow) {
      for (const item of this.trashItems) {
        if (!item.collected && this.isColliding(this.player, item)) {
          item.collected = true;
          this.collectedItem = item;
          break;
        }
      }
    }

    // Comprobar reciclado al pulsar Acción
    if (this.collectedItem && this.keys["Control"]) {
      for (const container of this.containers) {
        if (this.isColliding(this.player, container)) {
          const itemToThrow = this.collectedItem;
          const trashType = itemToThrow.type;
          const binType = container.type;

          const correct =
            (binType === "amarillo" && trashType === "plastic") ||
            (binType === "azul" && trashType === "paper") ||
            (binType === "verde" && trashType === "glass") ||
            (binType === "marron" && trashType === "organic") ||
            (binType === "gris" && trashType === "resto");

          if (correct) {
            this.collectedItem = null;

            const startX = this.player.x + this.player.width / 2;
            const startY = this.player.y + 10;
            const targetX = container.x + container.width / 2;
            const targetY = container.y + 20;

            this.effects.throwTrash(itemToThrow, startX, startY, targetX, targetY, () => {
              this.playRandomSound(this.successSounds);
              this.containerGlowColor = "rgba(120, 255, 140, 0.95)";
              this.containerGlowTime = performance.now();
              this.containerGlowDuration = 160;
              this.remainingTrash--;

              if (this.remainingTrash <= 0) {
                this.gameOver = true;
                
                setTimeout(() => this.finishSound.play().catch(()=>{}), 500);

                setTimeout(() => {
                  this.truckManager.start();
                }, 5500);
              }
            });
          } else {
            this.playRandomSound(this.failSounds);
            this.containerGlowColor = "rgba(255, 110, 110, 0.95)";
            this.containerGlowTime = performance.now();
            this.containerGlowDuration = 160;
          }

          this.keys["Control"] = false;
          break;
        }
      }
    }

    this.lastActionPressed = actionPressed;
  }

  restartGame() {
    this.stopAllSounds();
    this.sequenceFinished = false;
    this.fadeToBlack = false;
    this.fadeAlpha = 0;
    this.truckSequenceStarted = false;
    this.talkFrozen = false;
    this.gameOver = false;
    this.isPaused = false;

    this.player = new Player(this.insideSpawn.x, this.insideSpawn.y);
    this.cameraX = 0;
    this.scene = "inside";
    this.setupTrashItems();
    this.collectedItem = null;
  }

  updateCamera() {
    if (this.scene === "inside") { this.cameraX = 0; return; }
    const targetX = this.player.x + this.player.width / 2 - this.width / 2;
    this.cameraX = Math.max(0, Math.min(targetX, this.worldWidth - this.width));
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.showIntroVideo) {
      if (this.introVideo.readyState >= 2) this.ctx.drawImage(this.introVideo, 0, 0, this.width, this.height);
      return;
    }

    if (this.showStartScreen) {
      if (this.startImage.complete && this.startImage.naturalWidth > 0) {
        const img = this.startImage;
        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const scale = Math.min(this.width / imgW, this.height / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const x = (this.width - drawW) / 2;
        const y = (this.height - drawH) / 2;
        this.ctx.drawImage(img, x, y, drawW, drawH);
      } else {
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "32px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Pulsa una tecla o botón para empezar", this.width / 2, this.height / 2);
      }
      return;
    }

    if (this.truckVideoPlaying) {
      if (this.truckManager.drawVideo(this.ctx, this.width, this.height)) {
        return;
      }
    }

    if (this.scene === "outside") this.drawBackground();
    else this.drawInsideBackground();

    this.drawWorld();

    this.effects.drawAmbientLighting(this.ctx, this.scene, this.width, this.height);
    this.effects.drawTransition(this.ctx, this.width, this.height);

    this.drawHUD();

    if (this.fadeToBlack && this.fadeAlpha > 0) {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.isPaused) {
      this.drawPauseMenu();
    }
  }

  drawPauseMenu() {
    this.ctx.save();

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    const panelW = 380;
    const panelH = 220;
    const panelX = (this.width - panelW) / 2;
    const panelY = (this.height - panelH) / 2;

    this.ctx.fillStyle = "#2d3436";
    this.ctx.fillRect(panelX, panelY, panelW, panelH);
    this.ctx.strokeStyle = "#ffd700";
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.ctx.fillStyle = "#ffd700";
    this.ctx.textAlign = "center";
    this.ctx.font = "bold 26px Arial";
    this.ctx.fillText("JUEGO EN PAUSA", this.width / 2, panelY + 45);

    const btnW = 280;
    const btnH = 45;
    const btnX = (this.width - btnW) / 2;

    const resumeY = panelY + 80;
    const menuY = panelY + 140;

    // Botón Reanudar
    this.ctx.fillStyle = "#00b894";
    this.ctx.fillRect(btnX, resumeY, btnW, btnH);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 18px Arial";
    this.ctx.fillText("▶ REANUDAR (ESC)", this.width / 2, resumeY + 28);

    // Botón Menú Principal
    this.ctx.fillStyle = "#d63031";
    this.ctx.fillRect(btnX, menuY, btnW, btnH);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 18px Arial";
    this.ctx.fillText("🏠 MENÚ PRINCIPAL", this.width / 2, menuY + 28);

    this.ctx.restore();
  }

  drawHUD() {
    let counterBoxX = 20, counterBoxY = 60, counterBoxW = 40, counterBoxH = 40;

    if (this.remainingImage.complete && this.remainingImage.naturalWidth > 0) {
      const w = this.remainingImage.naturalWidth * 0.15;
      const h = this.remainingImage.naturalHeight * 0.15;
      this.ctx.drawImage(this.remainingImage, 10, 10, w, h);
      counterBoxX = 10 + w + 10;
      counterBoxY = 10 + h - 40;
    }

    this.ctx.save();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(counterBoxX, counterBoxY, counterBoxW, counterBoxH);
    this.ctx.strokeStyle = "#888888";
    this.ctx.strokeRect(counterBoxX, counterBoxY, counterBoxW, counterBoxH);
    this.ctx.fillStyle = "#333333";
    this.ctx.font = "bold 24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(`${this.remainingTrash}`, counterBoxX + counterBoxW / 2, counterBoxY + counterBoxH / 2);
    this.ctx.restore();

    if (this.scene === "inside" && this.talkFrozen) {
      if (this.dialogo1Image.complete) this.ctx.drawImage(this.dialogo1Image, this.width - 320, 40, 320, 280);
      if (this.dialogo2Image.complete) this.ctx.drawImage(this.dialogo2Image, 25, 65, 320, 280);
    }

    if (this.gameOver && !this.truckSequenceStarted && !this.sequenceFinished) {
      if (this.finishImage.complete && this.finishImage.naturalWidth > 0) {
        const scale = 0.8;
        const fw = this.finishImage.naturalWidth * scale;
        const fh = this.finishImage.naturalHeight * scale;
        this.ctx.drawImage(this.finishImage, (this.width - fw) / 2, (this.height - fh) / 2, fw, fh);
      }
    }
  }

  drawInsideBackground() {
    if (this.houseImage.complete) this.ctx.drawImage(this.houseImage, -30, -10, this.width + 60, this.height + 20);
  }

  drawBackground() {
    if (this.backgroundImage.complete) {
      const scale = (this.height * 1.1) / this.backgroundImage.naturalHeight;
      const maxCamera = this.worldWidth - this.width;
      const t = maxCamera > 0 ? this.cameraX / maxCamera : 0;
      const offsetX = -t * Math.max(0, (this.backgroundImage.naturalWidth * scale) - this.width);
      this.ctx.drawImage(this.backgroundImage, offsetX, -(this.backgroundImage.naturalHeight * scale - this.height) * 0.5, this.backgroundImage.naturalWidth * scale, this.backgroundImage.naturalHeight * scale);
    }

    this.effects.drawClouds(this.ctx, this.cameraX);

    if (this.groundImage.complete) {
      const drawW = this.groundImage.naturalWidth * ((this.height - this.groundY) / this.groundImage.naturalHeight);
      for (let x = -this.cameraX % drawW; x < this.width; x += drawW) {
        this.ctx.drawImage(this.groundImage, x, this.groundY, drawW, this.height - this.groundY);
      }
    }

    if (this.bushImage.complete) {
      const drawBushW = this.bushImage.naturalWidth / 8;
      const drawBushH = this.bushImage.naturalHeight / 8;
      for (let x = -this.cameraX % 240; x < this.width; x += 240) {
        this.ctx.drawImage(this.bushImage, x, this.groundY - drawBushH, drawBushW, drawBushH);
      }
    }
  }

  drawWorld() {
    if (this.scene === "outside") {
      if (this.platformImage.complete) {
        for (const p of this.platforms) {
          this.ctx.drawImage(this.platformImage, p.x - this.cameraX, p.y, p.width, p.height);
        }
      }

      this.effects.drawSmoke(this.ctx, this.cameraX);
      this.truckManager.draw(this.ctx);

      this.player.draw(this.ctx, this.cameraX, this.collectedItem, this.groundY, this.platforms);

      this.effects.drawThrow(this.ctx, this.cameraX);

      if (this.enterImage.complete && this.isColliding(this.player, this.doorZone)) {
        this.ctx.drawImage(this.enterImage, this.player.x - this.cameraX + 11, this.player.y - 20, 50, 25);
      }

      for (const trash of this.trashItems) {
        if (!trash.collected) trash.draw(this.ctx, this.cameraX);
      }

      for (const container of this.containers) {
        if (this.truckSequenceStarted && container.type === "amarillo" && !this.yellowVisible) continue;
        const glow = this.containerGlowColor && performance.now() - this.containerGlowTime < this.containerGlowDuration && this.isColliding(this.player, container) ? this.containerGlowColor : null;
        container.draw(this.ctx, this.cameraX, glow);
      }
    } else {
      if (this.exitImage.complete && this.isColliding(this.player, this.returnZone)) {
        this.ctx.drawImage(this.exitImage, this.player.x - this.cameraX + 11, this.player.y - 20, 50, 25);
      }

      const mImg = this.talkFrozen ? this.motherImage2 : this.motherImage;
      const fImg = this.talkFrozen ? this.fatherImage2 : this.fatherImage;
      if (mImg.complete) this.ctx.drawImage(mImg, 320, this.groundY - 185, 100, 180);
      if (fImg.complete) this.ctx.drawImage(fImg, 420, this.groundY - 200, 90, 200);

      if (this.talkImage.complete && this.isColliding(this.player, this.talkZone) && !this.talkFrozen) {
        this.ctx.drawImage(this.talkImage, this.player.x - this.cameraX + 16, this.player.y - 20, 40, 20);
      }

      // Pasar plataformas vacías en el interior
      this.player.draw(this.ctx, this.cameraX, null, this.groundY, []);
    }
  }

  isColliding(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
}
