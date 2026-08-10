export default class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Detectar dispositivo móvil o táctil
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);

    // Ajustar resolución y proporciones de pantalla
    this.fitCanvasToScreen();

    // Suelo de la carretera en el 82% de la altura de pantalla
    this.groundY = Math.floor(this.height * 0.82);

    // ESTADOS DEL JUEGO: "COVER", "INTRO", "PLAYING", "WIN_BANNER", "FINAL_VIDEO", "ENDED_BLACK"
    this.state = "COVER";

    // Estado del juego (9 Edificios totales)
    this.score = 0;
    this.totalBuildings = 9;
    this.remainingBuildings = 9;
    this.spawnedCount = 0;
    this.gameWon = false;
    this.isPaused = false;
    this.isTurbo = false;

    // Reloj interno
    this.gameTime = 0;

    this.isSpraying = false;
    this.aim = { x: this.width / 2, y: this.height / 2 };

    // Registro de teclas
    this.keys = {};

    // --- CONFIGURACIÓN PROPORCIONAL DE VELOCIDADES ---
    // Velocidades ajustadas proporcionalmente al ancho de la pantalla para una excelente agilidad
    this.baseScrollSpeed = this.width * 0.0032; 
    this.scrollSpeed = this.baseScrollSpeed;
    this.roadOffsetX = 0;

    // --- CONFIGURACIÓN DEL CAMIÓN (PROPORCIONAL A LA PANTALLA) ---
    const truckHeight = Math.floor(this.height * 0.28);
    const truckWidth = Math.floor(truckHeight * (260 / 245));

    this.truck = {
      x: this.width * 0.08,
      y: this.groundY - truckHeight + (5 * this.getDPR()),
      width: truckWidth,
      height: truckHeight,
      speed: this.width * 0.0085 // Camión rápido y reactivo al teclado/controles
    };

    // --- CARGA DE ASSETS EN IMÁGENES ---
    this.coverImage = new Image();
    this.coverImage.src = "assets/portada.png";

    this.bgImage = new Image(); 
    this.bgImage.src = "assets/fondo.png";

    this.bg2Image = new Image();
    this.bg2Image.src = "assets/fondo2.png";

    this.roadImage = new Image(); 
    this.roadImage.src = "assets/carretera.png";

    this.truckImg1 = new Image(); 
    this.truckImg1.src = "assets/bombero1.png";

    this.truckImg2 = new Image(); 
    this.truckImg2.src = "assets/bombero2.png";

    this.waterImage = new Image();
    this.waterImage.src = "assets/agua.png";

    this.faltaImage = new Image();
    this.faltaImage.src = "assets/falta.png";

    this.terminadoImage = new Image();
    this.terminadoImage.src = "assets/terminado.png";

    this.buildingImages = [new Image(), new Image(), new Image()];
    this.buildingImages[0].src = "assets/edificios1.png";
    this.buildingImages[1].src = "assets/edificios2.png";
    this.buildingImages[2].src = "assets/edificios3.png";

    this.fireImage = new Image();
    this.fireImage.src = "assets/fuego.png";

    this.birdsImage = new Image();
    this.birdsImage.src = "assets/pajaros.png";

    // --- CARGA DE VÍDEOS ---
    this.introVideo = null;
    this.finalVideo = null;

    // --- CARGA DE SONIDOS Y VOLÚMENES ---
    this.sndMarcha = new Audio("sounds/marcha.mp3");
    this.sndMarcha.loop = true;

    this.sndMusica = new Audio("sounds/musica.mp3");
    this.sndMusica.loop = true;

    this.sndSirena = new Audio("sounds/sirena.mp3");
    this.sndSirena.loop = true;

    this.sndTurbo = new Audio("sounds/turbo.mp3");
    this.sndTurbo.volume = 0.45;

    this.sndAgua = new Audio("sounds/agua.mp3");
    this.sndAgua.loop = true;

    this.sndTerminado = new Audio("sounds/terminado.mp3");
    this.sndClear = new Audio("sounds/clear.mp3");

    // Colecciones de efectos
    this.buildings = [];
    this.fires = [];
    this.embers = [];          
    this.waterParticles = [];
    this.waterImpacts = [];    
    this.puddles = [];         
    this.extinguishEffects = [];
    this.cleanSparkles = [];
    this.exhaustSmoke = [];
    this.turboFlames = [];
    this.speedLines = [];
    this.birds = [];
    this.clouds = [];

    this.lastBuildingX = this.width * 0.5;
    
    this.initClouds();
    this.initBirds();
    this.initCity();

    this.bindEvents();
  }

  getDPR() {
    return Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2.0);
  }

  fitCanvasToScreen() {
    const dpr = this.getDPR();
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  resize() {
    this.fitCanvasToScreen();
    const dpr = this.getDPR();

    this.groundY = Math.floor(this.height * 0.82);
    
    const truckHeight = Math.floor(this.height * 0.28);
    const truckWidth = Math.floor(truckHeight * (260 / 245));

    this.truck.height = truckHeight;
    this.truck.width = truckWidth;
    this.truck.y = this.groundY - truckHeight + (5 * dpr);
    this.truck.speed = this.width * 0.0085;
    this.baseScrollSpeed = this.width * 0.0032;

    const maxX = this.width - this.truck.width - (10 * dpr);
    this.truck.x = Math.max(10 * dpr, Math.min(this.truck.x, maxX));
  }

  initClouds() {
    const dpr = this.getDPR();
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: (20 + Math.random() * 70) * dpr,
        scale: (0.7 + Math.random() * 0.5) * dpr,
        parallax: 0.25 + Math.random() * 0.2
      });
    }
  }

  initBirds() {
    this.birds = [];
    for (let i = 0; i < 2; i++) {
      this.birds.push(this.createBird(i, true));
    }
  }

  createBird(flockType, initialSpawn = false) {
    const dpr = this.getDPR();
    const direction = Math.random() < 0.7 ? 1 : -1; 
    const baseSpeed = (0.5 + Math.random() * 0.4) * dpr;
    
    let x;
    if (initialSpawn) {
      x = Math.random() < 0.5 ? Math.random() * this.width : (direction === 1 ? -300 * dpr : this.width + 300 * dpr);
    } else {
      const offscreenDistance = (400 + Math.random() * 700) * dpr;
      x = direction === 1 ? -offscreenDistance : this.width + offscreenDistance;
    }

    return {
      flockType: flockType !== undefined ? flockType : Math.floor(Math.random() * 4),
      x: x,
      y: (15 + Math.random() * 80) * dpr,
      direction: direction,
      flightSpeed: baseSpeed,
      scale: (0.12 + Math.random() * 0.10) * dpr,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.015 + Math.random() * 0.01,
      wobbleAmp: (3 + Math.random() * 4) * dpr,
      flapPhase: Math.random() * Math.PI * 2,
      flapSpeed: 0.08 + Math.random() * 0.04
    };
  }

  initCity() {
    for (let i = 0; i < 3; i++) {
      this.spawnNextBuilding();
    }
  }

  spawnNextBuilding() {
    if (this.spawnedCount >= this.totalBuildings) return;

    const dpr = this.getDPR();
    const templateIdx = this.spawnedCount;

    const imgIdx = Math.floor(Math.random() * this.buildingImages.length);
    const col = Math.floor(Math.random() * 4);

    this.spawnedCount++;

    const buildingScale = 1.4; 
    const sizeMultiplier = (1.0 + Math.random() * 0.2) * buildingScale; 

    const baseW = 115 + (templateIdx % 3) * 25;
    const baseH = 190 + (templateIdx % 4) * 45;

    const bWidth = baseW * sizeMultiplier * dpr; 
    const bHeight = baseH * sizeMultiplier * dpr; 
    const gap = (150 + Math.random() * 100) * dpr; 

    let x;
    if (templateIdx === 0) {
      x = this.width * 0.75;
    } else {
      x = Math.max(this.width + (100 * dpr), this.lastBuildingX + gap);
    }

    const building = {
      id: Math.random(),
      templateIdx: templateIdx,
      imgIdx: imgIdx, 
      col: col,       
      x: x,
      y: this.groundY - bHeight,
      width: bWidth,
      height: bHeight,
      extinguished: false,
      cleanPulse: 0
    };

    this.buildings.push(building);
    this.lastBuildingX = x + bWidth;

    const windowStepY = 55 * dpr;
    const windowStepX = 42 * dpr;

    for (let wy = building.y + (30 * dpr); wy < building.y + building.height - (40 * dpr); wy += windowStepY) {
      for (let wx = building.x + (15 * dpr); wx < building.x + building.width - (30 * dpr); wx += windowStepX) {
        if (Math.random() < 0.55) {
          const randomSize = (22 + Math.random() * 28) * dpr;

          this.fires.push({
            buildingId: building.id,
            x: wx + (12 * dpr),
            y: wy + (15 * dpr),
            size: randomSize,
            variant: Math.floor(Math.random() * 3), 
            flickerSpeed: 0.008 + Math.random() * 0.008,
            flickerPhase: Math.random() * Math.PI * 2,
            floatOffset: Math.random() * 100
          });
        }
      }
    }
  }

  playSound(audio) {
    if (!audio) return;
    audio.play().catch(() => {});
  }

  pauseAllSounds() {
    [this.sndMarcha, this.sndMusica, this.sndSirena, this.sndTurbo, this.sndAgua, this.sndTerminado, this.sndClear].forEach(s => {
      if (s) s.pause();
    });
  }

  startIntro() {
    this.state = "INTRO";
    
    this.introVideo = document.createElement("video");
    this.introVideo.src = "assets/intro.mp4";
    this.introVideo.playsInline = true;

    this.introVideo.onended = () => this.endIntro();
    this.introVideo.onerror = () => this.endIntro();

    this.introVideo.play().catch(() => this.endIntro());
  }

  endIntro() {
    if (this.introVideo) {
      this.introVideo.pause();
      this.introVideo.src = "";
      this.introVideo = null;
    }

    this.state = "PLAYING";
    this.playSound(this.sndMusica);
    this.playSound(this.sndMarcha);
  }

  triggerVictory() {
    if (this.state === "WIN_BANNER" || this.state === "FINAL_VIDEO" || this.state === "ENDED_BLACK") return;

    this.gameWon = true;
    this.remainingBuildings = 0;
    this.isSpraying = false;
    this.state = "WIN_BANNER";

    this.pauseAllSounds();
    this.playSound(this.sndTerminado);

    setTimeout(() => {
      if (this.state === "WIN_BANNER") {
        this.startFinalVideo();
      }
    }, 3000);
  }

  startFinalVideo() {
    this.state = "FINAL_VIDEO";
    this.pauseAllSounds();

    this.finalVideo = document.createElement("video");
    this.finalVideo.src = "assets/final.mp4";
    this.finalVideo.playsInline = true;

    this.finalVideo.onended = () => this.endFinalVideo();
    this.finalVideo.onerror = () => this.endFinalVideo();

    this.finalVideo.play().catch(() => this.endFinalVideo());
  }

  endFinalVideo() {
    if (this.finalVideo) {
      this.finalVideo.pause();
      this.finalVideo.src = "";
      this.finalVideo = null;
    }
    this.state = "ENDED_BLACK";
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());

    const updateAim = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = this.getDPR();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      this.aim.x = (clientX - rect.left) * dpr;
      this.aim.y = (clientY - rect.top) * dpr;
    };

    const handleUserInteraction = () => {
      if (this.state === "ENDED_BLACK") {
        window.location.reload();
        return;
      }
      if (this.state === "COVER") {
        this.startIntro();
      }
    };

    window.addEventListener("keydown", (e) => {
      if (this.state === "ENDED_BLACK") {
        window.location.reload();
        return;
      }

      if (this.state === "COVER") {
        this.startIntro();
        return;
      }

      if (this.state === "INTRO") {
        if (e.key === "Escape") {
          this.endIntro();
        }
        return;
      }

      if (this.state === "PLAYING") {
        this.keys[e.key] = true;
        this.keys[e.key.toLowerCase()] = true;

        if (
          (this.keys["q"] || this.keys["Q"]) &&
          (this.keys["r"] || this.keys["R"]) &&
          (this.keys["t"] || this.keys["T"])
        ) {
          this.triggerVictory();
          return;
        }

        if (e.key === "Escape") {
          this.isPaused = !this.isPaused;
          if (this.isPaused) {
            this.isSpraying = false;
            this.pauseAllSounds();
          } else {
            this.playSound(this.sndMusica);
            this.playSound(this.sndMarcha);
          }
        } else if (e.key === "Control") {
          e.preventDefault();
          if (!this.keys["Control"]) {
            this.sndTurbo.currentTime = 0;
            this.playSound(this.sndTurbo);
          }
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
      if (e.key) this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener("mousemove", updateAim);

    this.canvas.addEventListener("mousedown", (e) => {
      updateAim(e);
      if (this.state === "ENDED_BLACK") {
        window.location.reload();
        return;
      }
      if (this.state === "COVER") {
        handleUserInteraction();
        return;
      }
      if (this.state === "PLAYING") {
        if (this.isPaused) {
          this.handlePauseMenuClick();
          return;
        }
        this.isSpraying = true;
      }
    });

    window.addEventListener("mouseup", () => this.isSpraying = false);

    this.canvas.addEventListener("touchmove", (e) => { updateAim(e); e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener("touchstart", (e) => {
      updateAim(e);
      if (this.state === "ENDED_BLACK") {
        window.location.reload();
        e.preventDefault();
        return;
      }
      if (this.state === "COVER") {
        handleUserInteraction();
        e.preventDefault();
        return;
      }
      if (this.state === "PLAYING") {
        if (this.isPaused) {
          this.handlePauseMenuClick();
          return;
        }
        this.isSpraying = true;
      }
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener("touchend", () => this.isSpraying = false);
  }

  handlePauseMenuClick() {
    const dpr = this.getDPR();
    const panelW = Math.min(this.width * 0.85, 380 * dpr);
    const panelH = Math.min(this.height * 0.65, 220 * dpr);
    const panelY = (this.height - panelH) / 2;

    const btnW = panelW * 0.8;
    const btnH = 45 * dpr;
    const btnX = (this.width - btnW) / 2;

    const resumeY = panelY + (panelH * 0.35);
    const menuY = panelY + (panelH * 0.65);

    if (
      this.aim.x >= btnX && this.aim.x <= btnX + btnW &&
      this.aim.y >= resumeY && this.aim.y <= resumeY + btnH
    ) {
      this.isPaused = false;
      this.playSound(this.sndMusica);
      this.playSound(this.sndMarcha);
    }

    if (
      this.aim.x >= btnX && this.aim.x <= btnX + btnW &&
      this.aim.y >= menuY && this.aim.y <= menuY + btnH
    ) {
      this.pauseAllSounds();
      window.location.href = "../index.html";
    }
  }

  start() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1); 
      lastTime = now;

      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  update(dt = 0.016) {
    if (this.state !== "PLAYING" || this.isPaused) return;

    const dtFactor = dt * 60;
    this.gameTime += dt * 1000;
    const dpr = this.getDPR();

    this.isTurbo = !!this.keys["Control"];
    const turboMultiplier = this.isTurbo ? 3.2 : 1.0; 
    
    const sprayFactor = this.isSpraying ? 0.85 : 1.0; 
    this.scrollSpeed = this.baseScrollSpeed * turboMultiplier * sprayFactor;

    if (this.sndMusica.paused) this.playSound(this.sndMusica);
    if (this.sndMarcha.paused) this.playSound(this.sndMarcha);

    if (this.isTurbo) {
      if (this.sndSirena.paused) this.playSound(this.sndSirena);
    } else {
      if (!this.sndSirena.paused) {
        this.sndSirena.pause();
        this.sndSirena.currentTime = 0;
      }
    }

    if (this.isSpraying) {
      if (this.sndAgua.paused) this.playSound(this.sndAgua);
    } else {
      if (!this.sndAgua.paused) {
        this.sndAgua.pause();
        this.sndAgua.currentTime = 0;
      }
    }

    this.roadOffsetX += this.scrollSpeed * dtFactor;

    if (this.keys["ArrowLeft"] || this.keys["a"] || this.keys["A"]) {
      this.truck.x -= this.truck.speed * dtFactor;
    }
    if (this.keys["ArrowRight"] || this.keys["d"] || this.keys["D"]) {
      this.truck.x += this.truck.speed * dtFactor;
    }

    const minX = 10 * dpr;
    const maxX = this.width - this.truck.width - (10 * dpr);
    this.truck.x = Math.max(minX, Math.min(this.truck.x, maxX));

    this.clouds.forEach(c => {
      c.x -= this.scrollSpeed * c.parallax * dtFactor;
      if (c.x < -150 * dpr) {
        c.x = this.width + (50 * dpr);
        c.y = (20 + Math.random() * 70) * dpr;
      }
    });

    this.birds.forEach((b, index) => {
      b.x += ((b.direction * b.flightSpeed) - this.scrollSpeed) * dtFactor;
      b.wobblePhase += b.wobbleSpeed * dtFactor;
      b.flapPhase += b.flapSpeed * dtFactor;

      const margin = 500 * dpr;
      if (b.x < -margin || b.x > this.width + margin) {
        this.birds[index] = this.createBird(index % 4, false);
      }
    });

    this.buildings.forEach(b => {
      b.x -= this.scrollSpeed * dtFactor;
      if (b.cleanPulse > 0) b.cleanPulse -= 0.02 * dtFactor;
    });

    this.fires.forEach(f => f.x -= this.scrollSpeed * dtFactor);
    this.extinguishEffects.forEach(e => e.x -= this.scrollSpeed * dtFactor);
    this.cleanSparkles.forEach(s => s.x -= this.scrollSpeed * dtFactor);
    this.lastBuildingX -= this.scrollSpeed * dtFactor;

    // --- ASCUAS / CHISPAS FLOTANTES ---
    if (this.fires.length > 0 && Math.random() < 0.35 * dtFactor) {
      const visibleFires = this.fires.filter(f => f.x > 0 && f.x < this.width);
      if (visibleFires.length > 0) {
        const randomFire = visibleFires[Math.floor(Math.random() * visibleFires.length)];
        this.embers.push({
          x: randomFire.x + (Math.random() - 0.5) * randomFire.size,
          y: randomFire.y + (Math.random() - 0.5) * randomFire.size,
          vx: (Math.random() - 0.5) * (0.8 * dpr),
          vy: -(0.8 + Math.random() * 1.5) * dpr,
          radius: (1.5 + Math.random() * 2.2) * dpr,
          alpha: 0.95,
          life: 40 + Math.random() * 30,
          maxLife: 70,
          color: Math.random() < 0.5 ? "#ff3300" : (Math.random() < 0.8 ? "#ff9900" : "#ffff33")
        });
      }
    }

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.x += (e.vx - this.scrollSpeed) * dtFactor;
      e.y += e.vy * dtFactor;
      e.life -= dtFactor;
      e.alpha = e.life / e.maxLife;
      if (e.life <= 0) this.embers.splice(i, 1);
    }

    // --- CHARCOS ---
    for (let i = this.puddles.length - 1; i >= 0; i--) {
      const p = this.puddles[i];
      p.x -= this.scrollSpeed * dtFactor;
      p.life -= dtFactor;
      p.alpha = (p.life / p.maxLife) * 0.65;
      if (p.life <= 0) this.puddles.splice(i, 1);
    }

    if (this.spawnedCount < this.totalBuildings && this.lastBuildingX < this.width + (300 * dpr)) {
      this.spawnNextBuilding();
    }

    if (this.buildings.length > 0 && this.buildings[0].x + this.buildings[0].width < -150 * dpr) {
      const oldBuilding = this.buildings.shift();

      if (!oldBuilding.extinguished) {
        const gap = (150 + Math.random() * 100) * dpr;
        const newX = Math.max(this.width + (100 * dpr), this.lastBuildingX) + gap;
        const dx = newX - oldBuilding.x;

        oldBuilding.x = newX;

        this.fires.forEach(f => {
          if (f.buildingId === oldBuilding.id) {
            f.x += dx;
          }
        });

        this.buildings.push(oldBuilding);
        this.lastBuildingX = newX + oldBuilding.width;
      }
    }

    const truckBob = Math.sin(this.gameTime * 0.0025) * (0.7 * dpr);
    const exhaustX = this.truck.x + (15 * dpr);
    const exhaustY = this.truck.y + truckBob + this.truck.height - (30 * dpr);

    const smokeRate = this.isTurbo ? 0.95 : 0.6;
    if (Math.random() < smokeRate * dtFactor) {
      this.exhaustSmoke.push({
        x: exhaustX,
        y: exhaustY,
        vx: -this.scrollSpeed - ((0.4 + Math.random() * 0.8) * dpr),
        vy: -(0.15 + Math.random() * 0.3) * dpr,
        radius: (this.isTurbo ? 6 + Math.random() * 5 : 4 + Math.random() * 3) * dpr,
        alpha: this.isTurbo ? 0.7 : 0.5,
        life: 50 + Math.random() * 20,
        maxLife: 70
      });
    }

    for (let i = this.exhaustSmoke.length - 1; i >= 0; i--) {
      const s = this.exhaustSmoke[i];
      s.x += s.vx * dtFactor;
      s.y += s.vy * dtFactor;
      s.radius += 0.22 * dpr * dtFactor;
      s.life -= dtFactor;
      s.alpha = (s.life / s.maxLife) * (this.isTurbo ? 0.7 : 0.5);

      if (s.life <= 0) this.exhaustSmoke.splice(i, 1);
    }

    if (this.isTurbo) {
      for (let i = 0; i < 3; i++) {
        this.turboFlames.push({
          x: exhaustX,
          y: exhaustY + (Math.random() - 0.5) * (8 * dpr),
          vx: -this.scrollSpeed * (1.2 + Math.random() * 0.8),
          vy: (Math.random() - 0.5) * (1.5 * dpr),
          radius: (5 + Math.random() * 6) * dpr,
          color: Math.random() < 0.4 ? "#ff3300" : (Math.random() < 0.7 ? "#ff9900" : "#ffff33"),
          alpha: 1.0,
          life: 12 + Math.random() * 8,
          maxLife: 20
        });
      }

      if (Math.random() < 0.8 * dtFactor) {
        this.speedLines.push({
          x: this.width + (50 * dpr),
          y: Math.random() * this.height,
          length: (40 + Math.random() * 80) * dpr,
          speed: (18 + Math.random() * 10) * dpr,
          alpha: 0.3 + Math.random() * 0.4
        });
      }
    }

    for (let i = this.turboFlames.length - 1; i >= 0; i--) {
      const f = this.turboFlames[i];
      f.x += f.vx * dtFactor;
      f.y += f.vy * dtFactor;
      f.life -= dtFactor;
      f.alpha = f.life / f.maxLife;

      if (f.life <= 0) this.turboFlames.splice(i, 1);
    }

    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      const l = this.speedLines[i];
      l.x -= l.speed * dtFactor;
      if (l.x + l.length < 0) this.speedLines.splice(i, 1);
    }

    // --- BOLAS DE AGUA ---
    for (let i = this.waterParticles.length - 1; i >= 0; i--) {
      const p = this.waterParticles[i];
      
      p.x += p.vx * dtFactor;
      p.y += p.vy * dtFactor;
      p.vy += (0.22 * dpr) * dtFactor; 
      p.life -= dtFactor;

      if (p.y >= this.groundY - (5 * dpr)) {
        if (Math.random() < 0.2) {
          this.puddles.push({
            x: p.x,
            y: this.groundY + (6 + Math.random() * 22) * dpr,
            rx: (12 + Math.random() * 14) * dpr,
            ry: (3.5 + Math.random() * 3) * dpr,
            alpha: 0.65,
            life: 200 + Math.random() * 120,
            maxLife: 320
          });
        }
        this.waterParticles.splice(i, 1);
        continue;
      }

      let hitFire = false;

      for (let j = this.fires.length - 1; j >= 0; j--) {
        const f = this.fires[j];
        const dist = Math.hypot(p.x - f.x, p.y - f.y);

        if (dist < f.size + p.radius) {
          f.size -= 0.65 * dpr * dtFactor;
          hitFire = true;

          this.waterImpacts.push({
            x: p.x,
            y: p.y,
            radius: (4 + Math.random() * 3) * dpr,
            maxRadius: (16 + Math.random() * 10) * dpr,
            alpha: 0.85,
            life: 14,
            maxLife: 14
          });

          if (f.size <= 5 * dpr) {
            for (let k = 0; k < 5; k++) {
              this.extinguishEffects.push({
                x: f.x + (Math.random() - 0.5) * (15 * dpr),
                y: f.y + (Math.random() - 0.5) * (15 * dpr),
                vx: (Math.random() - 0.5) * (1.2 * dpr),
                vy: -(0.5 + Math.random() * 1.2) * dpr,
                radius: (6 + Math.random() * 8) * dpr,
                alpha: 0.8,
                life: 35 + Math.random() * 20,
                maxLife: 55,
                isWaterSplash: false
              });
            }

            const buildingId = f.buildingId;
            this.fires.splice(j, 1);
            this.score += 100;

            const activeFiresOnBuilding = this.fires.filter(fire => fire.buildingId === buildingId);
            const parentBuilding = this.buildings.find(b => b.id === buildingId);

            if (activeFiresOnBuilding.length === 0 && parentBuilding && !parentBuilding.extinguished) {
              parentBuilding.extinguished = true;
              parentBuilding.cleanPulse = 1.0;
              this.remainingBuildings = Math.max(0, this.remainingBuildings - 1);

              this.sndClear.currentTime = 0;
              this.playSound(this.sndClear);

              for (let s = 0; s < 14; s++) {
                this.cleanSparkles.push({
                  x: parentBuilding.x + Math.random() * parentBuilding.width,
                  y: parentBuilding.y + Math.random() * parentBuilding.height,
                  vx: (Math.random() - 0.5) * (1.5 * dpr),
                  vy: -(0.8 + Math.random() * 1.5) * dpr,
                  radius: (3 + Math.random() * 5) * dpr,
                  alpha: 1.0,
                  life: 40 + Math.random() * 25,
                  maxLife: 65
                });
              }

              if (this.remainingBuildings === 0) {
                this.triggerVictory();
              }
            }
          }
          break;
        }
      }

      if (hitFire || p.life <= 0) {
        let hitsBuildingOrFire = hitFire;
        if (!hitsBuildingOrFire) {
          for (let b of this.buildings) {
            if (p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height) {
              hitsBuildingOrFire = true;
              
              this.waterImpacts.push({
                x: p.x,
                y: p.y,
                radius: (3 + Math.random() * 3) * dpr,
                maxRadius: (12 + Math.random() * 8) * dpr,
                alpha: 0.75,
                life: 12,
                maxLife: 12
              });
              break;
            }
          }
        }

        if (hitsBuildingOrFire && Math.random() < 0.5) {
          this.extinguishEffects.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * (3.0 * dpr),
            vy: -(Math.random() * 2.2 + 0.5) * dpr,
            radius: (3 + Math.random() * 4) * dpr,
            alpha: 0.75,
            life: 12 + Math.random() * 8,
            maxLife: 20,
            isWaterSplash: true
          });
        }

        if (p.life <= 0 || hitFire) {
          this.waterParticles.splice(i, 1);
          continue;
        }
      }

      if (p.y > this.height) {
        this.waterParticles.splice(i, 1);
      }
    }

    for (let i = this.waterImpacts.length - 1; i >= 0; i--) {
      const imp = this.waterImpacts[i];
      imp.x -= this.scrollSpeed * dtFactor;
      imp.radius += ((imp.maxRadius - imp.radius) * 0.25) * dtFactor;
      imp.life -= dtFactor;
      imp.alpha = imp.life / imp.maxLife;

      if (imp.life <= 0) this.waterImpacts.splice(i, 1);
    }

    // GENERAR CHORRO
    if (this.isSpraying) {
      const nozzleX = this.truck.x + this.truck.width * 0.98;
      const nozzleY = this.truck.y + truckBob + (60 * dpr);

      const rawDx = this.aim.x - nozzleX;
      const rawDy = this.aim.y - nozzleY;
      const rawDist = Math.hypot(rawDx, rawDy);

      if (rawDist > 5 * dpr) { 
        const maxDist = 450 * dpr; 
        const effectiveDist = Math.min(rawDist, maxDist);
        const angleToAim = Math.atan2(rawDy, rawDx);

        const muzzleSpeed = 18 * dpr; 
        const travelFrames = Math.max(3, Math.floor(effectiveDist / muzzleSpeed));

        const vxBase = Math.cos(angleToAim) * muzzleSpeed;
        const g = 0.22 * dpr;
        const vyBase = Math.sin(angleToAim) * muzzleSpeed - (0.5 * g * travelFrames);

        const streamDensity = 10;
        for (let i = 0; i < streamDensity; i++) {
          const step = i / streamDensity; 
          const spreadX = (Math.random() - 0.5) * (1.2 * dpr);
          const spreadY = (Math.random() - 0.5) * (1.5 * dpr); 

          this.waterParticles.push({
            x: nozzleX + vxBase * step, 
            y: nozzleY + vyBase * step, 
            vx: vxBase + spreadX,
            vy: vyBase + spreadY,
            radius: (8.5 + Math.random() * 4) * dpr, 
            life: travelFrames,
            maxLife: travelFrames
          });
        }
      }
    }

    for (let i = this.extinguishEffects.length - 1; i >= 0; i--) {
      const e = this.extinguishEffects[i];
      e.x += e.vx * dtFactor;
      e.y += e.vy * dtFactor;
      e.radius += 0.2 * dpr * dtFactor;
      e.life -= dtFactor;
      e.alpha = (e.life / e.maxLife) * 0.75;

      if (e.life <= 0) this.extinguishEffects.splice(i, 1);
    }

    for (let i = this.cleanSparkles.length - 1; i >= 0; i--) {
      const s = this.cleanSparkles[i];
      s.x += s.vx * dtFactor;
      s.y += s.vy * dtFactor;
      s.life -= dtFactor;
      s.alpha = s.life / s.maxLife;

      if (s.life <= 0) this.cleanSparkles.splice(i, 1);
    }
  }

  draw() {
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.state === "COVER") {
      this.drawCover();
      return;
    }

    if (this.state === "INTRO") {
      this.drawIntro();
      return;
    }

    if (this.state === "FINAL_VIDEO") {
      this.drawFinalVideo();
      return;
    }

    if (this.state === "ENDED_BLACK") {
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(0, 0, this.width, this.height);
      return;
    }

    const dpr = this.getDPR();

    this.ctx.save();
    if (this.isTurbo && !this.isPaused && this.state === "PLAYING") {
      const shakeAmount = 1.0 * dpr;
      const shakeX = (Math.random() - 0.5) * shakeAmount;
      const shakeY = (Math.random() - 0.5) * shakeAmount;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. FONDO CIELO
    if (this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      this.ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = "#87ceeb";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. NUBES Y PÁJAROS
    this.clouds.forEach(c => this.drawCloud(c.x, c.y, c.scale));
    this.drawBirds();

    // 3. FONDO 2
    this.drawBg2();

    // Líneas de velocidad
    if (this.isTurbo) {
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      this.ctx.lineWidth = 2 * dpr;
      this.speedLines.forEach(l => {
        this.ctx.beginPath();
        this.ctx.moveTo(l.x, l.y);
        this.ctx.lineTo(l.x + l.length, l.y);
        this.ctx.stroke();
      });
      this.ctx.restore();
    }

    // 4. EDIFICIOS
    this.buildings.forEach(b => {
      if (b.x + b.width > -50 * dpr && b.x < this.width + (50 * dpr)) {
        this.ctx.save();

        if (!this.isMobile) {
          if (b.extinguished) {
            const pulse = Math.sin(this.gameTime * 0.005) * 4 * dpr;
            this.ctx.shadowColor = "rgba(40, 255, 120, 0.95)";
            this.ctx.shadowBlur = (12 + pulse + b.cleanPulse * 10) * dpr;
          } else {
            const pulse = Math.sin(this.gameTime * 0.008) * 5 * dpr;
            this.ctx.shadowColor = "rgba(255, 50, 50, 0.95)";
            this.ctx.shadowBlur = (12 + pulse) * dpr;
          }
        }

        const bImg = this.buildingImages[b.imgIdx];
        if (bImg && bImg.complete && bImg.naturalWidth > 0) {
          const spriteW = bImg.naturalWidth / 4; 
          const spriteH = bImg.naturalHeight;     
          const sx = b.col * spriteW;

          this.ctx.drawImage(
            bImg,
            sx, 0, spriteW, spriteH,
            b.x, b.y, b.width, b.height
          );
        } else {
          this.ctx.fillStyle = b.extinguished ? "#2ecc71" : "#4a69bd";
          this.ctx.fillRect(b.x, b.y, b.width, b.height);
        }

        this.ctx.restore();
      }
    });

    // 5. FUEGOS VIVOS
    this.fires.forEach(f => {
      if (f.x > -40 * dpr && f.x < this.width + (40 * dpr)) {
        this.ctx.save();

        const pulse = Math.sin(this.gameTime * f.flickerSpeed + f.flickerPhase);
        const currentSize = f.size + (pulse * 2.5 * dpr);

        if (!this.isMobile) {
          this.ctx.shadowColor = `rgba(255, ${Math.floor(100 + pulse * 40)}, 0, ${0.85 + pulse * 0.15})`;
          this.ctx.shadowBlur = (8 + pulse * 4) * dpr;
        }

        if (this.fireImage.complete && this.fireImage.naturalWidth > 0) {
          const frameW = this.fireImage.naturalWidth / 3;
          const frameH = this.fireImage.naturalHeight;
          const sx = f.variant * frameW;

          this.ctx.drawImage(
            this.fireImage,
            sx, 0, frameW, frameH,
            f.x - currentSize / 2, 
            f.y - currentSize / 2, 
            currentSize, 
            currentSize
          );
        } else {
          this.ctx.fillStyle = "#ff4d4d";
          this.ctx.beginPath();
          this.ctx.arc(f.x, f.y, currentSize / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
      }
    });

    // 6. ASCUAS / CHISPAS FLOTANTES
    this.drawEmbers();

    // 7. CARRETERA Y CHARCOS
    this.drawRoad();
    this.drawPuddles();

    // 8. HUMO Y FUEGO TURBO
    this.drawExhaustSmoke();
    this.drawTurboFlames();

    // 9. ONDAS DE IMPACTO
    this.drawWaterImpacts();

    // 10. EFECTOS DE EXTINCIÓN
    this.extinguishEffects.forEach(e => {
      this.ctx.save();
      if (e.isWaterSplash) {
        this.ctx.fillStyle = `rgba(180, 235, 255, ${e.alpha})`;
      } else {
        this.ctx.fillStyle = `rgba(230, 230, 230, ${e.alpha})`;
      }
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 11. DESTELLOS DE LIMPIEZA
    this.cleanSparkles.forEach(s => {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(100, 255, 180, ${s.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 12. CAMIÓN DE BOMBEROS Y RUEDAS
    this.drawTruck();

    // 13. GOTAS DE AGUA
    this.drawWaterDroplets();

    // 14. PUNTERO DE APUNTADO
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    this.ctx.lineWidth = 3 * dpr;
    this.ctx.beginPath();
    this.ctx.arc(this.aim.x, this.aim.y, 18 * dpr, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.restore();

    // 15. HUD FIJO
    this.drawHUD();

    if (this.state === "WIN_BANNER") {
      this.drawWinBanner();
    }

    if (this.isPaused) {
      this.drawPauseMenu();
    }
  }

  drawEmbers() {
    this.ctx.save();
    this.embers.forEach(e => {
      this.ctx.fillStyle = e.color;
      this.ctx.globalAlpha = e.alpha;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  drawPuddles() {
    const dpr = this.getDPR();
    this.ctx.save();

    this.puddles.forEach(p => {
      if (p.x > -60 * dpr && p.x < this.width + (60 * dpr)) {
        this.ctx.fillStyle = `rgba(35, 90, 120, ${p.alpha * 0.75})`;
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = `rgba(180, 230, 255, ${p.alpha * 0.35})`;
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y, p.rx * 0.65, p.ry * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
    this.ctx.restore();
  }

  drawWaterImpacts() {
    const dpr = this.getDPR();
    this.ctx.save();
    this.waterImpacts.forEach(imp => {
      this.ctx.strokeStyle = `rgba(180, 240, 255, ${imp.alpha})`;
      this.ctx.fillStyle = `rgba(220, 250, 255, ${imp.alpha * 0.4})`;
      this.ctx.lineWidth = 2 * dpr;

      this.ctx.beginPath();
      this.ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
    this.ctx.restore();
  }

  drawCover() {
    this.ctx.fillStyle = "#1e272e";
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.coverImage.complete && this.coverImage.naturalWidth > 0) {
      const imgRatio = this.coverImage.naturalWidth / this.coverImage.naturalHeight;
      const canvasRatio = this.width / this.height;

      let drawW, drawH;
      if (canvasRatio > imgRatio) {
        drawH = this.height;
        drawW = drawH * imgRatio;
      } else {
        drawW = this.width;
        drawH = drawW / imgRatio;
      }

      const drawX = (this.width - drawW) / 2;
      const drawY = (this.height - drawH) / 2;

      this.ctx.drawImage(this.coverImage, drawX, drawY, drawW, drawH);
    }
  }

  drawIntro() {
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.introVideo && this.introVideo.readyState >= 2) {
      const vW = this.introVideo.videoWidth || this.width;
      const vH = this.introVideo.videoHeight || this.height;
      const vRatio = vW / vH;
      const cRatio = this.width / this.height;

      let drawW, drawH;
      if (cRatio > vRatio) {
        drawH = this.height;
        drawW = drawH * vRatio;
      } else {
        drawW = this.width;
        drawH = drawW / vRatio;
      }

      const drawX = (this.width - drawW) / 2;
      const drawY = (this.height - drawH) / 2;

      this.ctx.drawImage(this.introVideo, drawX, drawY, drawW, drawH);

      const currentTime = this.introVideo.currentTime || 0;
      const duration = this.introVideo.duration || 10;
      const fadeTime = 1.0; 

      let alpha = 1.0;
      if (currentTime < fadeTime) {
        alpha = currentTime / fadeTime;
      } else if (duration > 0 && currentTime > duration - fadeTime) {
        alpha = Math.max(0, (duration - currentTime) / fadeTime);
      }

      if (alpha < 1.0) {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - alpha})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
      }
    }
  }

  drawFinalVideo() {
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.finalVideo && this.finalVideo.readyState >= 2) {
      const vW = this.finalVideo.videoWidth || this.width;
      const vH = this.finalVideo.videoHeight || this.height;
      const vRatio = vW / vH;
      const cRatio = this.width / this.height;

      let drawW, drawH;
      if (cRatio > vRatio) {
        drawH = this.height;
        drawW = drawH * vRatio;
      } else {
        drawW = this.width;
        drawH = drawW / vRatio;
      }

      const drawX = (this.width - drawW) / 2;
      const drawY = (this.height - drawH) / 2;

      this.ctx.drawImage(this.finalVideo, drawX, drawY, drawW, drawH);

      const currentTime = this.finalVideo.currentTime || 0;
      const duration = this.finalVideo.duration || 10;
      const fadeTime = 1.0; 

      let alpha = 1.0;
      if (currentTime < fadeTime) {
        alpha = currentTime / fadeTime;
      } else if (duration > 0 && currentTime > duration - fadeTime) {
        alpha = Math.max(0, (duration - currentTime) / fadeTime);
      }

      if (alpha < 1.0) {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - alpha})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();
      }
    }
  }

  drawWinBanner() {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.terminadoImage.complete && this.terminadoImage.naturalWidth > 0) {
      const imgRatio = this.terminadoImage.naturalWidth / this.terminadoImage.naturalHeight;

      let drawW = this.width * 0.75;
      let drawH = drawW / imgRatio;

      if (drawH > this.height * 0.75) {
        drawH = this.height * 0.75;
        drawW = drawH * imgRatio;
      }

      const drawX = (this.width - drawW) / 2;
      const drawY = (this.height - drawH) / 2;

      this.ctx.drawImage(this.terminadoImage, drawX, drawY, drawW, drawH);
    }
    this.ctx.restore();
  }

  drawWaterDroplets() {
    this.waterParticles.forEach(p => {
      this.ctx.save();

      const lifeProgress = p.life / p.maxLife; 
      const ageProgress = 1.0 - lifeProgress;   

      const fadeOut = Math.min(1.0, lifeProgress * 3.0);
      const alpha = 0.60 * fadeOut;

      const scale = 0.35 + (ageProgress * 0.65); 
      const currentRadius = p.radius * scale;
      const drawSize = currentRadius * 2;

      this.ctx.globalAlpha = alpha;

      if (this.waterImage.complete && this.waterImage.naturalWidth > 0) {
        const angle = Math.atan2(p.vy, p.vx);

        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(angle);

        this.ctx.drawImage(
          this.waterImage,
          -drawSize / 2,
          -drawSize / 2,
          drawSize,
          drawSize
        );
      } else {
        this.ctx.fillStyle = "rgba(0, 168, 255, 0.60)";
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  drawBg2() {
    if (this.bg2Image.complete && this.bg2Image.naturalWidth > 0) {
      const imgW = this.bg2Image.naturalWidth;
      const imgH = this.bg2Image.naturalHeight;

      const drawH = this.height * 0.55; 
      const drawW = imgW * (drawH / imgH);

      const drawY = this.groundY - drawH;

      const currentOffsetX = (this.roadOffsetX % drawW + drawW) % drawW;

      for (let x = -currentOffsetX; x < this.width + drawW; x += drawW) {
        this.ctx.drawImage(this.bg2Image, x, drawY, drawW, drawH);
      }
    }
  }

  drawCloud(x, y, scale) {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    this.ctx.beginPath();
    this.ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
    this.ctx.arc(x + (16 * scale), y - (10 * scale), 18 * scale, 0, Math.PI * 2);
    this.ctx.arc(x + (32 * scale), y, 20 * scale, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawBirds() {
    if (!this.birdsImage.complete || this.birdsImage.naturalWidth === 0) return;

    const frameW = this.birdsImage.naturalWidth / 2;  
    const frameH = this.birdsImage.naturalHeight / 2; 

    this.birds.forEach(b => {
      const col = b.flockType % 2;
      const row = Math.floor(b.flockType / 2);

      const sx = col * frameW;
      const sy = row * frameH;

      const wobbleY = Math.sin(b.wobblePhase) * b.wobbleAmp;
      const flapScaleY = 1 + Math.sin(b.flapPhase) * 0.15;
      const tilt = Math.cos(b.wobblePhase) * 0.08;

      const drawW = frameW * b.scale;
      const drawH = frameH * b.scale * flapScaleY;

      this.ctx.save();
      this.ctx.translate(b.x, b.y + wobbleY);

      if (b.direction === 1) {
        this.ctx.scale(-1, 1);
      }

      this.ctx.rotate(tilt);

      this.ctx.drawImage(
        this.birdsImage,
        sx, sy, frameW, frameH,
        -drawW / 2, -drawH / 2, drawW, drawH
      );

      this.ctx.restore();
    });
  }

  drawHUD() {
    const dpr = this.getDPR();

    this.ctx.save();

    const imgX = 20 * dpr;
    const imgY = 20 * dpr;
    const targetH = Math.floor(this.height * 0.11);

    if (this.faltaImage.complete && this.faltaImage.naturalWidth > 0) {
      const aspect = this.faltaImage.naturalWidth / this.faltaImage.naturalHeight;
      const targetW = targetH * aspect;

      this.ctx.drawImage(this.faltaImage, imgX, imgY, targetW, targetH);

      const textStr = `${this.remainingBuildings} / ${this.totalBuildings}`;
      const fontSize = Math.floor(targetH * 0.32);
      this.ctx.font = `bold ${fontSize}px Arial`;

      const textWidth = this.ctx.measureText(textStr).width;
      const paddingX = 14 * dpr;
      const paddingY = 8 * dpr;

      const boxW = textWidth + paddingX * 2;
      const boxH = fontSize + paddingY * 2;
      const boxX = imgX + targetW + (12 * dpr);
      const boxY = imgY + (targetH - boxH) / 2;

      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(boxX, boxY, boxW, boxH);

      this.ctx.strokeStyle = "#000000";
      this.ctx.lineWidth = 2.5 * dpr;
      this.ctx.strokeRect(boxX, boxY, boxW, boxH);

      this.ctx.fillStyle = "#000000";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(textStr, boxX + boxW / 2, boxY + boxH / 2);

    } else {
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fillRect(imgX, imgY, 140 * dpr, 50 * dpr);
      this.ctx.fillStyle = "#000000";
      this.ctx.font = `bold ${Math.floor(22 * dpr)}px Arial`;
      this.ctx.fillText(`${this.remainingBuildings} / ${this.totalBuildings}`, imgX + (15 * dpr), imgY + (30 * dpr));
    }

    this.ctx.restore();
  }

  drawPauseMenu() {
    const dpr = this.getDPR();

    this.ctx.save();

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    const panelW = Math.min(this.width * 0.85, 380 * dpr);
    const panelH = Math.min(this.height * 0.65, 220 * dpr);
    const panelX = (this.width - panelW) / 2;
    const panelY = (this.height - panelH) / 2;

    this.ctx.fillStyle = "#2d3436";
    this.ctx.fillRect(panelX, panelY, panelW, panelH);
    this.ctx.strokeStyle = "#ffd700";
    this.ctx.lineWidth = 3 * dpr;
    this.ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.ctx.fillStyle = "#ffd700";
    this.ctx.textAlign = "center";
    this.ctx.font = `bold ${Math.floor(22 * dpr)}px Arial`;
    this.ctx.fillText("JUEGO EN PAUSA", this.width / 2, panelY + (panelH * 0.22));

    const btnW = panelW * 0.8;
    const btnH = 45 * dpr;
    const btnX = (this.width - btnW) / 2;

    const resumeY = panelY + (panelH * 0.38);
    const menuY = panelY + (panelH * 0.68);

    this.ctx.fillStyle = "#00b894";
    this.ctx.fillRect(btnX, resumeY, btnW, btnH);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `bold ${Math.floor(16 * dpr)}px Arial`;
    this.ctx.fillText("▶ REANUDAR (ESC)", this.width / 2, resumeY + (btnH * 0.62));

    this.ctx.fillStyle = "#d63031";
    this.ctx.fillRect(btnX, menuY, btnW, btnH);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `bold ${Math.floor(16 * dpr)}px Arial`;
    this.ctx.fillText("🏠 MENÚ PRINCIPAL", this.width / 2, menuY + (btnH * 0.62));

    this.ctx.restore();
  }

  drawExhaustSmoke() {
    this.exhaustSmoke.forEach(s => {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(180, 180, 180, ${s.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawTurboFlames() {
    this.ctx.save();
    this.turboFlames.forEach(f => {
      this.ctx.fillStyle = f.color;
      this.ctx.globalAlpha = f.alpha;
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  drawRoad() {
    const roadY = this.groundY;
    const roadH = this.height - this.groundY;

    if (this.roadImage.complete && this.roadImage.naturalWidth > 0) {
      const tileWidth = this.roadImage.naturalWidth * (roadH / this.roadImage.naturalHeight);
      const currentOffsetX = (this.roadOffsetX % tileWidth + tileWidth) % tileWidth;

      for (let x = -currentOffsetX; x < this.width + tileWidth; x += tileWidth) {
        this.ctx.drawImage(this.roadImage, x, roadY, tileWidth, roadH);
      }
    } else {
      this.ctx.fillStyle = "#485460";
      this.ctx.fillRect(0, roadY, this.width, roadH);
    }
  }

  drawWheel(wx, wy, radius, angle) {
    const dpr = this.getDPR();
    this.ctx.save();
    this.ctx.translate(wx, wy);

    this.ctx.fillStyle = "#181c24";
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 2.5 * dpr;
    this.ctx.stroke();

    this.ctx.fillStyle = "#333a48";
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 2 * dpr;
    this.ctx.stroke();

    this.ctx.rotate(angle);
    this.ctx.strokeStyle = "#181c24";
    this.ctx.lineWidth = 2.5 * dpr;

    for (let i = 0; i < 4; i++) {
      this.ctx.rotate(Math.PI / 2);
      this.ctx.beginPath();
      this.ctx.moveTo(radius * 0.2, 0);
      this.ctx.lineTo(radius * 0.58, 0);
      this.ctx.stroke();
    }

    this.ctx.fillStyle = "#181c24";
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawTruck() {
    const dpr = this.getDPR();
    const x = this.truck.x;
    const w = this.truck.width;
    const h = this.truck.height;

    const truckBob = Math.sin(this.gameTime * 0.0025) * (0.7 * dpr);
    const y = this.truck.y + truckBob;

    // Sombra del camión
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    this.ctx.beginPath();
    this.ctx.ellipse(
      x + (w * 0.38),
      y + h - (12 * dpr),
      w * 0.38,
      12 * dpr,
      0, 0, Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.restore();

    // Imagen base del camión
    const isFrame1 = Math.floor(this.gameTime / 10000) % 2 === 0;
    const currentTruckImg = isFrame1 ? this.truckImg1 : this.truckImg2;

    if (currentTruckImg.complete && currentTruckImg.naturalWidth > 0) {
      this.ctx.drawImage(currentTruckImg, x, y, w, h);
    } else {
      this.ctx.fillStyle = "#ff3838";
      this.ctx.fillRect(x, y + 20, w * 0.8, h * 0.5);
    }

    // Ruedas animadas
    const wheelRadius = w * 0.078;                       
    const wheelY = y + h - wheelRadius + (3 * dpr);      
    const wheelAngle = this.roadOffsetX / wheelRadius;

    const rearWheelX = x + (w * 0.188);
    const frontWheelX = x + (w * 0.685);

    this.drawWheel(rearWheelX, wheelY, wheelRadius, wheelAngle);
    this.drawWheel(frontWheelX, wheelY, wheelRadius, wheelAngle);

    // --- SIRENA LUMINOSA RESTAURADA (DEGRADADO Y DESTELLO COMPLETO) ---
    if (this.isTurbo) {
      this.ctx.save();

      const sirenY = y + (h * 0.535);
      const sirenBlueY = y + (h * 0.542);
      const sirenBlueX = x + (w * 0.785);
      const sirenRedX = x + (w * 0.825);

      const flash = Math.floor(this.gameTime / 90) % 2 === 0;

      // LUZ AZUL
      const blueAlpha = flash ? 0.95 : 0.25;
      const blueRadius = (flash ? 24 : 12) * dpr;
      let gradBlue = this.ctx.createRadialGradient(sirenBlueX, sirenBlueY, 2 * dpr, sirenBlueX, sirenBlueY, blueRadius);
      gradBlue.addColorStop(0, `rgba(255, 255, 255, ${blueAlpha})`);
      gradBlue.addColorStop(0.35, `rgba(0, 160, 255, ${blueAlpha})`);
      gradBlue.addColorStop(1, "rgba(0, 160, 255, 0)");

      this.ctx.fillStyle = gradBlue;
      this.ctx.beginPath();
      this.ctx.arc(sirenBlueX, sirenBlueY, blueRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // LUZ ROJA
      const redAlpha = !flash ? 0.95 : 0.25;
      const redRadius = (!flash ? 24 : 12) * dpr;
      let gradRed = this.ctx.createRadialGradient(sirenRedX, sirenY, 2 * dpr, sirenRedX, sirenY, redRadius);
      gradRed.addColorStop(0, `rgba(255, 255, 255, ${redAlpha})`);
      gradRed.addColorStop(0.35, `rgba(255, 40, 40, ${redAlpha})`);
      gradRed.addColorStop(1, "rgba(255, 40, 40, 0)");

      this.ctx.fillStyle = gradRed;
      this.ctx.beginPath();
      this.ctx.arc(sirenRedX, sirenY, redRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }
}
