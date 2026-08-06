import Player from "../entities/Player.js";
import Trash from "../entities/Trash.js";
import Container from "../entities/Container.js";

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
    this.insideWorldWidth = 900;
    this.groundY = 420;

    this.cameraX = 0;
    this.keys = {};

    this.collectedItem = null;
    this.gameOver = false;
    this.sequenceFinished = false;
    this.fadeToBlack = false;
    this.fadeAlpha = 0;

    this.showStartScreen = true;
    this.showIntroVideo = false;
    this.introVideoPlaying = false;
    this.introFadeAlpha = 0;
    this.introFadeMode = "in";
    this.introVideoDone = false;
    this.introSkipRequested = false;
    this.introStartDelay = 300;

    this.gamepad = null;
    this.gamepadButtons = {};
    this.prevGamepadButtons = {};

    this.scene = "inside";
    this.doorZone = { x: 150, y: this.groundY - 90, width: 130, height: 150 };
    this.returnZone = { x: 0, y: this.groundY - 90, width: 150, height: 150 };
    this.outsideSpawn = { x: 150, y: this.groundY - 92 };
    this.insideSpawn = { x: 120, y: this.groundY - 92 };
    this.transitionLock = false;

    this.backgroundImage = new Image();
    this.backgroundImage.src = "assets/backgrounds/fondo1.png";

    this.houseImage = new Image();
    this.houseImage.src = "assets/backgrounds/casa.jpg";

    this.motherImage = new Image();
    this.motherImage.src = "assets/people/madre.png";
    this.fatherImage = new Image();
    this.fatherImage.src = "assets/people/padre.png";
    this.motherImage2 = new Image();
    this.motherImage2.src = "assets/people/madre2.png";
    this.fatherImage2 = new Image();
    this.fatherImage2.src = "assets/people/padre2.png";

    this.talkImage = new Image();
    this.talkImage.src = "assets/backgrounds/talk.png";

    this.dialogo1Image = new Image();
    this.dialogo1Image.src = "assets/people/dialogo1.png";
    this.dialogo2Image = new Image();
    this.dialogo2Image.src = "assets/people/dialogo2.png";

    this.enterImage = new Image();
    this.enterImage.src = "assets/backgrounds/entrar.png";
    this.exitImage = new Image();
    this.exitImage.src = "assets/backgrounds/salir.png";

    this.introVideo = document.createElement("video");
    this.introVideo.src = "assets/backgrounds/intro.mp4";
    this.introVideo.preload = "auto";
    this.introVideo.playsInline = true;
    this.introVideo.loop = false;
    this.introVideoPlaying = false;
    this.introVideo.addEventListener("ended", () => {
      this.introVideoDone = true;
      this.showIntroVideo = false;
      this.introVideoPlaying = false;
      this.beginGameAfterIntro();
    });

    this.groundImage = new Image();
    this.groundImage.src = "assets/backgrounds/suelo1.png";
    this.bushImage = new Image();
    this.bushImage.src = "assets/backgrounds/arbusto.png";
    this.platformImage = new Image();
    this.platformImage.src = "assets/backgrounds/plataforma.png";
    this.finishImage = new Image();
    this.finishImage.src = "assets/backgrounds/terminado.png";
    this.remainingImage = new Image();
    this.remainingImage.src = "assets/backgrounds/falta.png";
    this.startImage = new Image();
    this.startImage.src = "assets/backgrounds/inicio.png";

    this.circulandoSound = new Audio("sounds/circulando.mp3");
    this.circulandoSound.loop = true;
    this.circulandoSound.volume = 0.8;

    this.basuratSound = new Audio("sounds/basurat.mp3");
    this.basuratSound.loop = false;
    this.basuratSound.volume = 0.9;

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
      { x: 380, y: this.groundY - 30 },
      { x: 650, y: this.groundY - 30 },
      { x: 580, y: this.groundY - 120 - 30 },
      { x: 840, y: this.groundY - 140 - 30 },
      { x: 1350, y: this.groundY - 140 - 30 },
      { x: 1750, y: this.groundY - 30 }
    ];

    this.trashDefinitions = [
      { type: "paper", color: "azul" },
      { type: "plastic", color: "amarillo" },
      { type: "plastic", color: "amarillo" },
      { type: "glass", color: "verde" },
      { type: "organic", color: "marron" },
      { type: "resto", color: "restos" }
    ];

    this.trashItems = [];
    const shuffledDefsInit = this.shuffleArray(this.trashDefinitions);
    for (let i = 0; i < this.trashPositions.length; i++) {
      const pos = this.trashPositions[i];
      const def = shuffledDefsInit[i];
      this.trashItems.push(new Trash(pos.x, pos.y, def.type, def.color));
    }

    this.remainingTrash = this.trashItems.length;

    this.successSounds = [new Audio("sounds/S1.mp3"), new Audio("sounds/S2.mp3"), new Audio("sounds/S3.mp3"), new Audio("sounds/S4.mp3")];
    this.failSounds = [new Audio("sounds/No1.mp3"), new Audio("sounds/No3.mp3"), new Audio("sounds/No4.mp3")];
    this.finishSound = new Audio("sounds/terminado.mp3");

    this.finishTime = null;
    this.truckSequenceStarted = false;

    this.truckBaseImage = new Image();
    this.truckBaseImage.src = "assets/contenedores/camion.png";

    this.truckFrames = [];
    for (let i = 1; i <= 6; i++) {
      const img = new Image();
      img.src = `assets/contenedores/camion${i}.png`;
      this.truckFrames.push(img);
    }

    this.truckVideo = document.createElement("video");
    this.truckVideo.src = "assets/contenedores/video.mp4";
    this.truckVideo.preload = "auto";
    this.truckVideo.playsInline = true;
    this.truckVideoPlaying = false;
    this.truckVideoFinished = false;
    this.truckVideo.addEventListener("ended", () => {
      this.truckVideoPlaying = false;
      this.truckVideoFinished = true;
      this.yellowVisible = true;
      this.truckLeaving = true;
      this.truckLeaveTime = performance.now();
    });

    this.truckAnimIndex = 0;
    this.truckAnimCounter = 0;
    this.truckX = 0;
    this.truckY = this.groundY + 100;
    this.truckTargetX = 400;
    this.truckLeaving = false;
    this.truckLeaveTime = null;
    this.truckStopTime = null;
    this.yellowVisible = true;
    this.containerGlowColor = null;
    this.containerGlowTime = 0;
    this.containerGlowDuration = 0;

    this.talkZone = { x: 300, y: this.groundY - 210, width: 220, height: 210 };
    this.talkFrozen = false;
    this.lastActionPressed = false;

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.showIntroVideo) {
        this.skipIntro();
        return;
      }
      if (this.showStartScreen) {
        this.startIntro();
        return;
      }
      if (this.sequenceFinished && this.fadeAlpha >= 1) {
        this.restartGame();
        return;
      }
      this.keys[e.key] = true;
    });

    this.canvas.addEventListener("mousedown", () => {
      if (this.showStartScreen) this.startIntro();
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
    });

    const bindTouchButton = (id, key) => {
      const button = document.getElementById(id);
      if (!button) return;
      const press = (e) => {
        e.preventDefault();
        this.keys[key] = true;
        if (!this.touchMusicStarted) {
          this.touchMusicStarted = true;
          if (this.showStartScreen) this.startIntro();
        }
      };
      const release = (e) => {
        e.preventDefault();
        this.keys[key] = false;
      };
      button.addEventListener("touchstart", press, { passive: false });
      button.addEventListener("touchend", release, { passive: false });
      button.addEventListener("touchcancel", release, { passive: false });
      button.addEventListener("mousedown", press);
      button.addEventListener("mouseup", release);
      button.addEventListener("mouseleave", release);
    };

    bindTouchButton("btnLeft", "ArrowLeft");
    bindTouchButton("btnRight", "ArrowRight");
    bindTouchButton("btnJump", "ArrowUp");
    bindTouchButton("btnAction", "Control");

    window.addEventListener("gamepadconnected", (e) => { this.gamepad = e.gamepad; });
    window.addEventListener("gamepaddisconnected", (e) => { if (this.gamepad && e.gamepad.index === this.gamepad.index) this.gamepad = null; });
  }

  start() { requestAnimationFrame(this.loop.bind(this)); }
  loop() { this.updateGamepadState(); this.update(); this.draw(); requestAnimationFrame(this.loop.bind(this)); }

  updateGamepadState() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    if (!pads) return;
    if (!this.gamepad) {
      for (const pad of pads) if (pad) { this.gamepad = pad; break; }
      if (!this.gamepad) return;
    }
    const pad = navigator.getGamepads()[this.gamepad.index];
    if (!pad) return;
    this.prevGamepadButtons = { ...this.gamepadButtons };
    this.gamepadButtons["A"] = !!(pad.buttons[0] && pad.buttons[0].pressed);
    this.gamepadButtons["X"] = !!(pad.buttons[2] && pad.buttons[2].pressed);
    this.gamepadButtons["DLEFT"] = !!(pad.buttons[14] && pad.buttons[14].pressed);
    this.gamepadButtons["DRIGHT"] = !!(pad.buttons[15] && pad.buttons[15].pressed);
    const axes = pad.axes || [];
    const lx = axes[0] || 0;
    const deadzone = 0.25;
    this.gamepadButtons["LLEFT"] = lx < -deadzone;
    this.gamepadButtons["LRIGHT"] = lx > deadzone;
    if (this.showStartScreen) {
      let anyButtonPressed = false;
      for (let i = 0; i < pad.buttons.length; i++) {
        if (pad.buttons[i].pressed) { anyButtonPressed = true; break; }
      }
      if (anyButtonPressed) this.startIntro();
    }
  }

  startIntro() {
    this.showStartScreen = false;
    this.showIntroVideo = true;
    this.introFadeAlpha = 0;
    this.introFadeMode = "in";
    this.introSkipRequested = false;
    this.introVideoDone = false;
    this.introVideoPlaying = false;
    setTimeout(() => {
      if (!this.showIntroVideo || this.introSkipRequested) return;
      this.introVideoPlaying = true;
      this.introVideo.currentTime = 0;
      this.introVideo.play().catch(() => {
        this.showIntroVideo = false;
        this.introVideoPlaying = false;
        this.beginGameAfterIntro();
      });
    }, this.introStartDelay);
  }

  beginGameAfterIntro() {
    this.showIntroVideo = false;
    this.introVideoPlaying = false;
    this.showStartScreen = false;
    this.fadeAlpha = 0;
    this.sequenceFinished = false;
  }

  skipIntro() {
    this.introSkipRequested = true;
    try { this.introVideo.pause(); } catch (e) {}
    this.showIntroVideo = false;
    this.introVideoPlaying = false;
    this.beginGameAfterIntro();
  }

  playRandomSound(list) {
    if (!list || list.length === 0) return;
    const i = Math.floor(Math.random() * list.length);
    const audio = list[i];
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  startTruckSequence() {
    if (this.truckSequenceStarted) return;
    this.truckSequenceStarted = true;

    const yellowContainer = this.containers.find(c => c.type === "amarillo");
    this.truckTargetX = yellowContainer ? yellowContainer.x - 60 : this.cameraX + this.width / 2;
    this.truckX = this.cameraX + this.width + 300;
    this.truckY = this.groundY;
    this.truckAnimIndex = 0;
    this.truckAnimCounter = 0;
    this.truckLeaving = false;
    this.truckLeaveTime = null;
    this.truckStopTime = null;
    this.yellowVisible = true;

    this.circulandoSound.currentTime = 0;
    this.circulandoSound.play().catch(() => {});
  }

  updateTruckSequence() {
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const speed = isMobile ? 1.8 : 1.8;

    if (!this.truckLeaving && !this.truckVideoPlaying && !this.truckVideoFinished) {
      if (this.truckX > this.truckTargetX) {
        this.truckX -= speed;
        if (this.truckX <= this.truckTargetX) {
          this.truckX = this.truckTargetX;
          this.truckStopTime = performance.now();
        }
        return;
      }

      if (this.truckStopTime !== null) {
        const elapsedStop = performance.now() - this.truckStopTime;
        if (elapsedStop < 1000) return;

        this.truckVideoPlaying = true;
        this.yellowVisible = false;

        try {
          this.basuratSound.pause();
          this.basuratSound.currentTime = 0;
        } catch (e) {}

        this.truckVideo.currentTime = 0;
        const playPromise = this.truckVideo.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(() => {
            this.truckVideoPlaying = false;
            this.truckVideoFinished = true;
            this.yellowVisible = true;
            this.truckLeaving = true;
            this.truckLeaveTime = performance.now();
          });
        }
        return;
      }
    }

    if (this.truckVideoPlaying) return;

    if (this.truckLeaving) {
      this.truckX -= speed;
      const offscreenLimit = this.cameraX - 400;
      if (this.truckX < offscreenLimit) {
        this.truckSequenceStarted = false;
        this.sequenceFinished = true;
        this.fadeToBlack = true;
        this.fadeAlpha = 0;
        this.circulandoSound.pause();
        this.circulandoSound.currentTime = 0;
        this.basuratSound.pause();
        this.basuratSound.currentTime = 0;
      }
    }
  }

  isActionPressed() {
    return !!this.keys["Control"] || (!!this.gamepadButtons["X"] && !this.prevGamepadButtons["X"]);
  }

  consumeAction() {
    this.keys["Control"] = false;
    this.gamepadButtons["X"] = false;
  }

  update() {
    const now = performance.now();

    if (this.showIntroVideo) {
      if (this.introFadeMode === "in") {
        this.introFadeAlpha = Math.min(1, this.introFadeAlpha + 0.01);
        if (this.introFadeAlpha >= 1) this.introFadeMode = "steady";
      } else if (this.introFadeMode === "steady") {
        if (this.introVideoPlaying && this.introVideo.duration && this.introVideo.currentTime >= this.introVideo.duration - 0.8) this.introFadeMode = "out";
      } else if (this.introFadeMode === "out") {
        this.introFadeAlpha = Math.max(0, this.introFadeAlpha - 0.01);
        if (this.introFadeAlpha <= 0) {
          this.showIntroVideo = false;
          this.introVideoPlaying = false;
          this.beginGameAfterIntro();
        }
      }
      return;
    }

    if (this.showStartScreen) return;

    if (this.gamepad) {
      this.keys["ArrowUp"] = !!this.gamepadButtons["A"];
      const left = this.gamepadButtons["DLEFT"] || this.gamepadButtons["LLEFT"];
      const right = this.gamepadButtons["DRIGHT"] || this.gamepadButtons["LRIGHT"];
      this.keys["ArrowLeft"] = left;
      this.keys["ArrowRight"] = right;
    }

    if (this.sequenceFinished) {
      if (this.fadeToBlack && this.fadeAlpha < 1) {
        this.fadeAlpha = Math.min(1, this.fadeAlpha + 0.012);
      }
      return;
    }

    const inTalkZone = this.scene === "inside" && this.isColliding(this.player, this.talkZone);
    const actionPressed = this.isActionPressed();
    const actionRisingEdge = actionPressed && !this.lastActionPressed;

    if (this.scene === "inside" && inTalkZone && actionRisingEdge) {
      this.talkFrozen = !this.talkFrozen;
      this.consumeAction();
      if (this.talkFrozen) {
        this.keys["ArrowLeft"] = false;
        this.keys["ArrowRight"] = false;
        this.keys["ArrowUp"] = false;
      }
    }

    if (this.talkFrozen) {
      this.player.update({}, this.worldWidth, this.groundY, this.platforms);
      this.clampPlayerInside();
      this.keys["ArrowLeft"] = false;
      this.keys["ArrowRight"] = false;
      this.keys["ArrowUp"] = false;
      this.keys["Control"] = false;
      this.updateCamera();
      this.lastActionPressed = actionPressed;
      return;
    }

    if (!this.transitionLock && this.keys["Control"]) {
      if (this.scene === "outside" && this.isColliding(this.player, this.doorZone)) {
        this.scene = "inside";
        this.player.x = this.insideSpawn.x;
        this.player.y = this.insideSpawn.y;
        this.cameraX = 0;
        this.transitionLock = true;
        setTimeout(() => (this.transitionLock = false), 300);
        this.keys["Control"] = false;
        this.lastActionPressed = actionPressed;
        return;
      }

      if (this.scene === "inside" && this.isColliding(this.player, this.returnZone)) {
        this.scene = "outside";
        this.player.x = this.outsideSpawn.x;
        this.player.y = this.outsideSpawn.y;
        this.cameraX = 0;
        this.transitionLock = true;
        setTimeout(() => (this.transitionLock = false), 300);
        this.keys["Control"] = false;
        this.lastActionPressed = actionPressed;
        return;
      }
    }

    if (!this.truckSequenceStarted && this.keys["q"] && this.keys["r"] && this.keys["t"]) {
      this.gameOver = true;
      this.finishTime = now;
      this.startTruckSequence();
    }

    if (this.gameOver && this.finishTime !== null) {
      if (now - this.finishTime >= 8000 && !this.truckSequenceStarted) {
        this.startTruckSequence();
      }
    }

    if (this.truckSequenceStarted) {
      this.player.update(this.keys, this.worldWidth, this.groundY, this.platforms);
      this.clampPlayerInside();
      if (!this.keys["ArrowLeft"] && !this.keys["ArrowRight"]) {
        this.player.setAnimation("see");
      }
      this.updateCamera();
      this.updateTruckSequence();
      this.lastActionPressed = actionPressed;
      return;
    }

    if (this.gameOver) {
      this.player.update({}, this.worldWidth, this.groundY, this.platforms);
    } else {
      this.player.update(this.keys, this.worldWidth, this.groundY, this.platforms);
    }

    this.clampPlayerInside();
    this.updateCamera();

    if (this.scene === "outside" && !this.collectedItem) {
      for (const item of this.trashItems) {
        if (!item.collected && this.isColliding(this.player, item)) {
          item.collected = true;
          this.collectedItem = item;
          break;
        }
      }
    }

    if (this.collectedItem && this.keys["Control"]) {
      for (const container of this.containers) {
        if (this.isColliding(this.player, container)) {
          const binType = container.type;
          const trashType = this.collectedItem.type;

          const correct =
            (binType === "amarillo" && trashType === "plastic") ||
            (binType === "azul" && trashType === "paper") ||
            (binType === "verde" && trashType === "glass") ||
            (binType === "marron" && trashType === "organic") ||
            (binType === "gris" && trashType === "resto");

          if (correct) {
            this.playRandomSound(this.successSounds);
            this.containerGlowColor = "rgba(120, 255, 140, 0.95)";
            this.containerGlowTime = performance.now();
            this.containerGlowDuration = 160;
            this.collectedItem = null;
            this.remainingTrash--;

            if (this.remainingTrash <= 0) {
              this.gameOver = true;
              this.finishTime = performance.now();
              setTimeout(() => {
                this.finishSound.currentTime = 0;
                this.finishSound.play().catch(() => {});
              }, 2500);
            }
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
    this.sequenceFinished = false;
    this.fadeToBlack = false;
    this.fadeAlpha = 0;
    this.truckSequenceStarted = false;
    this.truckLeaving = false;
    this.truckStopTime = null;
    this.truckLeaveTime = null;
    this.truckVideoPlaying = false;
    this.truckVideoFinished = false;
    this.talkFrozen = false;
    this.lastActionPressed = false;

    try {
      this.truckVideo.pause();
      this.truckVideo.currentTime = 0;
    } catch (e) {}

    this.gameOver = false;
    this.finishTime = null;

    this.player = new Player(this.insideSpawn.x, this.insideSpawn.y);
    this.cameraX = 0;
    this.scene = "inside";

    const shuffledDefs = this.shuffleArray(this.trashDefinitions);
    this.trashItems = [];
    for (let i = 0; i < this.trashPositions.length; i++) {
      const pos = this.trashPositions[i];
      const def = shuffledDefs[i];
      this.trashItems.push(new Trash(pos.x, pos.y, def.type, def.color));
    }

    this.remainingTrash = this.trashItems.length;
    this.collectedItem = null;

    this.truckX = 0;
    this.truckTargetX = 400;
    this.truckAnimIndex = 0;
    this.truckAnimCounter = 0;
    this.yellowVisible = true;
  }

  updateCamera() {
    if (this.scene === "inside") {
      this.cameraX = 0;
      return;
    }

    const targetX = this.player.x + this.player.width / 2 - this.width / 2;
    this.cameraX = Math.max(0, Math.min(targetX, this.worldWidth - this.width));
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.showIntroVideo) {
      if (this.introVideo.readyState >= 2) {
        this.ctx.drawImage(this.introVideo, 0, 0, this.width, this.height);
      } else {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.width, this.height);
      }
      this.ctx.save();
      this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.introFadeAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.restore();
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

    if (this.truckVideoPlaying && this.truckVideo.readyState >= 2) {
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.drawImage(this.truckVideo, 0, 0, this.width, this.height);
      return;
    }

    if (this.scene === "outside") {
      this.drawBackground();
    } else {
      this.drawInsideBackground();
    }

    this.drawWorld();

    if (this.sequenceFinished && this.fadeToBlack && this.fadeAlpha > 0) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.restore();
      return;
    }

    let counterBoxX = 20;
    let counterBoxY = 60;
    let counterBoxW = 80;
    let counterBoxH = 40;

    if (this.remainingImage.complete && this.remainingImage.naturalWidth > 0) {
      const img = this.remainingImage;
      const scale = 0.15;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const x = 10;
      const y = 10;
      this.ctx.drawImage(img, x, y, w, h);
      counterBoxX = x + w + 10;
      counterBoxY = y + h - 40;
      counterBoxW = 40;
      counterBoxH = 40;
    }

    this.ctx.save();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(counterBoxX, counterBoxY, counterBoxW, counterBoxH);
    this.ctx.strokeStyle = "#888888";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(counterBoxX, counterBoxY, counterBoxW, counterBoxH);
    this.ctx.beginPath();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.moveTo(counterBoxX + 1, counterBoxY + counterBoxH - 1);
    this.ctx.lineTo(counterBoxX + 1, counterBoxY + 1);
    this.ctx.lineTo(counterBoxX + counterBoxW - 1, counterBoxY + 1);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.strokeStyle = "#bbbbbb";
    this.ctx.moveTo(counterBoxX + counterBoxW - 1, counterBoxY + 1);
    this.ctx.lineTo(counterBoxX + counterBoxW - 1, counterBoxY + counterBoxH - 1);
    this.ctx.lineTo(counterBoxX + 1, counterBoxY + counterBoxH - 1);
    this.ctx.stroke();
    this.ctx.fillStyle = "#333333";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(`${this.remainingTrash}`, counterBoxX + counterBoxW / 2, counterBoxY + counterBoxH / 2);
    this.ctx.restore();

    if (this.scene === "inside" && this.talkFrozen) {
      if (this.dialogo1Image.complete && this.dialogo1Image.naturalWidth > 0) {
        this.ctx.drawImage(this.dialogo1Image, this.width - 320, 40, 320, 280);
      }
      if (this.dialogo2Image.complete && this.dialogo2Image.naturalWidth > 0) {
        this.ctx.drawImage(this.dialogo2Image, 25, 65, 320, 280);
      }
    }

    if (this.gameOver && !this.truckSequenceStarted) {
      if (this.finishImage.complete && this.finishImage.naturalWidth > 0) {
        const img = this.finishImage;
        const scale = 0.8;
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const x = (this.width - w) / 2;
        const y = (this.height - h) / 2;
        this.ctx.drawImage(img, x, y, w, h);
      } else {
        this.ctx.font = "42px Arial";
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = "#000";
        this.ctx.fillText("¡COMPLETADO!", 250, 220);
      }
    }
  }

  drawInsideBackground() {
    const img = this.houseImage;
    const bgW = this.width + 60;
    const bgH = this.height + 20;

    if (img.complete && img.naturalWidth > 0) {
      this.ctx.drawImage(img, -30, -10, bgW, bgH);
    } else {
      this.ctx.fillStyle = "#d9c7a2";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = "#8b6b3e";
      this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
    }
  }

  drawBackground() {
    const img = this.backgroundImage;

    if (img.complete && img.naturalWidth > 0) {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const scale = (this.height * 1.1) / imgHeight;
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;
      const maxCamera = this.worldWidth - this.width;
      const t = maxCamera > 0 ? this.cameraX / maxCamera : 0;
      const maxOffset = Math.max(0, drawWidth - this.width);
      const offsetX = -t * maxOffset;
      const offsetY = -(drawHeight - this.height) * 0.5;
      this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      this.ctx.fillStyle = "#87cfff";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.groundImage.complete && this.groundImage.naturalWidth > 0) {
      const tileW = this.groundImage.naturalWidth;
      const tileH = this.groundImage.naturalHeight;
      const scale = (this.height - this.groundY) / tileH;
      const drawH = tileH * scale;
      const drawW = tileW * scale;
      for (let x = -this.cameraX % drawW; x < this.width; x += drawW) {
        this.ctx.drawImage(this.groundImage, x, this.groundY, drawW, drawH);
      }
    } else {
      this.ctx.fillStyle = "#6cc36c";
      this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
    }

    if (this.bushImage.complete && this.bushImage.naturalWidth > 0) {
      const bushW = this.bushImage.naturalWidth;
      const bushH = this.bushImage.naturalHeight;
      const scaleBush = 1 / 8;
      const drawBushW = bushW * scaleBush;
      const drawBushH = bushH * scaleBush;
      for (let x = -this.cameraX % 240; x < this.width; x += 240) {
        this.ctx.drawImage(this.bushImage, x, this.groundY - drawBushH, drawBushW, drawBushH);
      }
    }
  }

  drawWorld() {
    if (this.scene === "outside") {
      if (this.platformImage.complete && this.platformImage.naturalWidth > 0) {
        const img = this.platformImage;
        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        for (const platform of this.platforms) {
          const screenX = platform.x - this.cameraX;
          const screenY = platform.y;
          const scaleX = platform.width / imgW;
          const scaleY = platform.height / imgH;
          const drawW = imgW * scaleX;
          const drawH = imgH * scaleY;
          this.ctx.drawImage(img, screenX, screenY, drawW, drawH);
        }
      } else {
        this.ctx.fillStyle = "#8b5a2b";
        for (const platform of this.platforms) {
          const screenX = platform.x - this.cameraX;
          this.ctx.fillRect(screenX, platform.y, platform.width, platform.height);
        }
      }
    }

    if (this.truckSequenceStarted && !this.truckVideoPlaying) {
      const screenX = this.truckX - this.cameraX;
      const screenY = this.truckY;
      const scale = 0.8;
      const img = this.truckLeaving ? this.truckFrames[this.truckFrames.length - 1] : this.truckBaseImage;
      if (img.complete && img.naturalWidth > 0) {
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        this.ctx.drawImage(img, screenX, screenY - h + 25, w, h);
      }
    }

    if (this.scene === "outside") {
      this.player.draw(this.ctx, this.cameraX, this.collectedItem, this.groundY, this.platforms);

      const nearDoor = this.isColliding(this.player, this.doorZone);
      if (this.enterImage.complete && this.enterImage.naturalWidth > 0 && nearDoor) {
        const w = 50;
        const h = 25;
        const x = this.player.x - this.cameraX + this.player.width / 2 - w / 2;
        const y = this.player.y - 20;
        this.ctx.drawImage(this.enterImage, x, y, w, h);
      }

      for (const trash of this.trashItems) {
        if (!trash.collected) trash.draw(this.ctx, this.cameraX);
      }

      for (const container of this.containers) {
        if (this.truckSequenceStarted && container.type === "amarillo" && !this.yellowVisible) continue;
        const glow =
          this.containerGlowColor &&
          performance.now() - this.containerGlowTime < this.containerGlowDuration &&
          this.isColliding(this.player, container)
            ? this.containerGlowColor
            : null;
        container.draw(this.ctx, this.cameraX, glow);
      }
    } else {
      const nearReturn = this.isColliding(this.player, this.returnZone);
      if (this.exitImage.complete && this.exitImage.naturalWidth > 0 && nearReturn) {
        const w = 50;
        const h = 25;
        const x = this.player.x - this.cameraX + this.player.width / 2 - w / 2;
        const y = this.player.y - 20;
        this.ctx.drawImage(this.exitImage, x, y, w, h);
      }

      const familyFrozen = this.talkFrozen;
      const motherImg = familyFrozen ? this.motherImage2 : this.motherImage;
      const fatherImg = familyFrozen ? this.fatherImage2 : this.fatherImage;

      if (motherImg.complete && motherImg.naturalWidth > 0) this.ctx.drawImage(motherImg, 320, this.groundY - 185, 100, 180);
      if (fatherImg.complete && fatherImg.naturalWidth > 0) this.ctx.drawImage(fatherImg, 420, this.groundY - 200, 90, 200);

      if (this.talkImage.complete && this.talkImage.naturalWidth > 0) {
        const nearTalk = this.isColliding(this.player, this.talkZone);
        if (nearTalk && !this.talkFrozen) {
          const w = 40;
          const h = 20;
          const x = this.player.x - this.cameraX + this.player.width / 2 - w / 2;
          const y = this.player.y - 20;
          this.ctx.drawImage(this.talkImage, x, y, w, h);
        }
      }

      this.player.draw(this.ctx, this.cameraX, null, this.groundY, this.platforms);
    }
  }

  isColliding(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
}
