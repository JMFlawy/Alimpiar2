import Bus from './Bus.js';
import Controls from './Controls.js';
import GameAssets from './GameAssets.js';
import GameRenderer from './GameRenderer.js';
import GameTraffic from './GameTraffic.js';
import PassengerBoardingAnimation from './PassengerBoardingAnimation.js';

export default class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);

    this.bus = new Bus();
    this.controls = new Controls(this);

    this.assets = new GameAssets();
    this.boardingAnimation = new PassengerBoardingAnimation(this);

    // ==========================================
    // CARGA DE EFECTOS DE SONIDO REALES (sounds/)
    // ==========================================
    this.soundMarcha = new Audio("sounds/marcha.mp3");
    this.soundMarcha.loop = true;
    this.soundMarcha.volume = 0.5;

    this.soundAtras = new Audio("sounds/atras.mp3");
    this.soundAtras.loop = true;
    this.soundAtras.volume = 0.5;

    this.soundFreno = new Audio("sounds/freno.mp3");
    this.soundFreno.volume = 0;

    this.soundParada = new Audio("sounds/parada.mp3");
    this.soundParada.volume = 0.6;

    // Volumen de barro bajado al 15%
    this.soundBarro = new Audio("sounds/barro.mp3");
    this.soundBarro.volume = 0.15;

    this.soundLimpia = new Audio("sounds/limpia.mp3");
    this.soundLimpia.volume = 0.95;

    this.soundPuertas1 = new Audio("sounds/puertas1.mp3");
    this.soundPuertas2 = new Audio("sounds/puertas2.mp3");
    this.soundTarjeta = new Audio("sounds/tarjeta.mp3");

    this.soundMusica = new Audio("sounds/musica.mp3");
    this.soundMusica.loop = true;
    this.soundMusica.volume = 0.51;

    this.soundTerminado = new Audio("sounds/terminado.wav");
    this.soundTerminado.volume = 0.8;

    this.imgTerminado = new Image();
    this.imgTerminado.src = "assets/terminado.png";

    this.isCompleted = false;
    this.fadeAlpha = 0; // Control del difuminado a negro
    this.endTimerStarted = false;

    // Cuando la música haga loop y vuelva a empezar, saltar de nuevo al segundo 2
    this.soundMusica.addEventListener("seeking", () => {
      if (this.soundMusica.currentTime < 2) {
        this.soundMusica.currentTime = 2;
      }
    });

    this.saludos = [
      new Audio("sounds/saludo1.mp3"),
      new Audio("sounds/saludo2.mp3"),
      new Audio("sounds/saludo3.mp3"),
      new Audio("sounds/saludo4.mp3"),
      new Audio("sounds/saludo5.wav")
    ];

    // Estados internos para la reproducción de sonidos continuos
    this.isMarchaPlaying = false;
    this.isAtrasPlaying = false;

    this.BARRO_OFFSET_Y = 25;

    this.stopNames = this.assets.stopNames;
    this.lastDestination = null;

    this.passengersPool = [
      { id: 1, destination: "Supermercado", state: "AVAILABLE" },
      { id: 2, destination: "Centro comercial", state: "AVAILABLE" },
      { id: 3, destination: "Gimnasio", state: "AVAILABLE" },
      { id: 4, destination: "Parque", state: "AVAILABLE" },
      { id: 5, destination: "Aeropuerto", state: "AVAILABLE" }
    ];

    this.score = 0;
    this.scrollOffset = 0;
    this.isPaused = false;
    this.isSelectingBus = true;

    this.actionMessage = "";
    this.actionMessageTimer = 0;

    this.obstacles = [];
    this.puddles = [];
    this.trafficCars = [];
    this.trafficLights = [];
    this.busStops = [];
    this.buildings = [];
    this.streetProps = [];
    this.clouds = [];
    this.particles = [];

    this.spawnTimer = 0;
    this.nextObstacleTime = 0.8;

    this.distanceSinceLastStop = 0;
    this.nextStopTargetDistance = this.getNewStopDistance();

    this.steeringAngle = 0;

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    window.addEventListener("orientationchange", () => setTimeout(() => this.resizeCanvas(), 150));

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        this.togglePause();
      }
      // Limpiaparabrisas (Espacio)
      if (e.key === " " || e.code === "Space") {
        if (this.bus && this.bus.windshield && this.bus.windshield.splatters.length > 0) {
          this.soundLimpia.currentTime = 0;
          this.soundLimpia.play().catch(() => {});
        }
      }
    });

    this.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));

    this.initBuildings();
    this.initStreetProps();
    this.initClouds();
    this.initStops();

    this.playIntroVideo();
  }

  playIntroVideo() {
    const video = document.createElement("video");
    video.src = "assets/intro.mp4";
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    Object.assign(video.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100dvh",
      objectFit: "contain",
      backgroundColor: "#000000",
      zIndex: "20000",
      cursor: "pointer"
    });

    let finished = false;
    const finishIntro = () => {
      if (finished) return;
      finished = true;
      video.remove();
      this.showBusMenu();
    };

    video.addEventListener("ended", finishIntro);
    video.addEventListener("click", finishIntro);

    document.body.appendChild(video);

    video.play().catch(() => {
      finishIntro();
    });
  }

  showBusMenu() {
    this.isSelectingBus = true;

    const oldMenu = document.getElementById("bus-selection-menu");
    if (oldMenu) oldMenu.remove();

    const menuOverlay = document.createElement("div");
    menuOverlay.id = "bus-selection-menu";
    menuOverlay.style.position = "fixed";
    menuOverlay.style.top = "0";
    menuOverlay.style.left = "0";
    menuOverlay.style.width = "100vw";
    menuOverlay.style.height = "100dvh";
    menuOverlay.style.backgroundColor = "rgba(10, 15, 29, 0.94)";
    menuOverlay.style.backdropFilter = "blur(12px)";
    menuOverlay.style.webkitBackdropFilter = "blur(12px)";
    menuOverlay.style.zIndex = "10000";
    menuOverlay.style.display = "flex";
    menuOverlay.style.flexDirection = "column";
    menuOverlay.style.alignItems = "center";
    menuOverlay.style.justifyContent = "center";
    menuOverlay.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    menuOverlay.style.color = "#ffffff";
    menuOverlay.style.padding = "clamp(12px, 3vh, 24px)";
    menuOverlay.style.boxSizing = "border-box";
    menuOverlay.style.overflowY = "auto";

    let styleSheet = document.getElementById("bus-menu-styles");
    if (!styleSheet) {
      styleSheet = document.createElement("style");
      styleSheet.id = "bus-menu-styles";
      styleSheet.innerHTML = `
        .bus-card {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98));
          border-radius: 20px;
          padding: clamp(14px, 2.5vw, 24px) clamp(10px, 2vw, 18px);
          width: clamp(140px, 28vw, 200px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          box-sizing: border-box;
        }
        @media (hover: hover) {
          .bus-card:hover {
            transform: translateY(-8px) scale(1.04);
          }
        }
        .bus-card:active {
          transform: scale(0.97);
        }
      `;
      document.head.appendChild(styleSheet);
    }

    const buses = [
      { id: "bus1", name: "Autobús amarillo", img: "assets/bus1.png", color: "#f1c40f" },
      { id: "busr1", name: "Autobús rojo", img: "assets/busr1.png", color: "#e74c3c" },
      { id: "busa1", name: "Autobús azul", img: "assets/busa1.png", color: "#3498db" },
      { id: "busv1", name: "Autobús verde", img: "assets/busv1.png", color: "#2ecc71" },
      { id: "busl1", name: "Autobús de Londres", img: "assets/busl1s.png", color: "#e11d48" }
    ];

    const cardsHtml = buses.map(b => `
      <div class="bus-card" data-id="${b.id}" style="
        border: 3px solid ${b.color};
        box-shadow: 0 10px 25px -5px ${b.color}40, 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      ">
        <div style="
          width: 100%;
          height: clamp(70px, 12vh, 110px);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img src="${b.img}" alt="${b.name}" style="
            max-width: 100%;
            max-height: clamp(60px, 11vh, 100px);
            object-fit: contain;
            filter: drop-shadow(0 8px 12px rgba(0,0,0,0.6));
          " />
        </div>

        <span style="
          font-size: clamp(14px, 2vw, 18px);
          font-weight: 800;
          margin-top: clamp(8px, 1.5vh, 16px);
          color: #ffffff;
          text-align: center;
          line-height: 1.25;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        ">${b.name}</span>

        <button style="
          margin-top: clamp(10px, 1.8vh, 18px);
          width: 100%;
          background: ${b.color};
          color: #0f172a;
          border: none;
          padding: clamp(6px, 1vh, 10px) 0;
          border-radius: 12px;
          font-weight: 800;
          font-size: clamp(11px, 1.5vw, 14px);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          box-shadow: 0 4px 12px ${b.color}66;
          pointer-events: none;
        ">
          Elegir
        </button>
      </div>
    `).join("");

    menuOverlay.innerHTML = `
      <div style="text-align: center; margin-bottom: clamp(16px, 3vh, 35px);">
        <h1 style="
          margin: 0;
          font-size: clamp(22px, 4vw, 36px);
          font-weight: 900;
          letter-spacing: -0.5px;
          text-shadow: 0 4px 20px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 1.5vw, 14px);
        ">
          <span style="font-size: clamp(26px, 4.5vw, 42px);">🚌</span> SELECCIONA TU AUTOBÚS
        </h1>
        <p style="
          margin: 6px 0 0 0;
          color: #94a3b8;
          font-size: clamp(13px, 2vw, 18px);
          font-weight: 500;
        ">Elige tu vehículo para comenzar el recorrido</p>
      </div>

      <div style="
        display: flex;
        flex-wrap: wrap;
        gap: clamp(12px, 2vw, 24px);
        justify-content: center;
        max-width: 1150px;
        width: 100%;
      ">
        ${cardsHtml}
      </div>
    `;

    document.body.appendChild(menuOverlay);

    menuOverlay.querySelectorAll(".bus-card").forEach(card => {
      card.addEventListener("click", () => {
        const selectedId = card.getAttribute("data-id");
        this.selectBus(selectedId);
        menuOverlay.remove();
      });
    });
  }

  selectBus(busType) {
    if (this.bus) {
      this.bus.setBusType(busType);
    }
    this.isSelectingBus = false;

    // Iniciar música de fondo con el volumen restaurado desde el segundo 2
    if (this.soundMusica) {
      this.soundMusica.volume = 0.51;
      this.soundMusica.currentTime = 2;
      this.soundMusica.play().catch(() => {});
    }
  }

  togglePause() {
    if (this.isSelectingBus || (this.boardingAnimation && this.boardingAnimation.active)) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.stopEngineSounds();
      this.soundMusica.pause();
    } else {
      if (this.soundMusica.currentTime < 2) {
        this.soundMusica.currentTime = 2;
      }
      this.soundMusica.play().catch(() => {});
    }
  }

  stopEngineSounds() {
    if (this.isMarchaPlaying) {
      this.soundMarcha.pause();
      this.isMarchaPlaying = false;
    }
    if (this.isAtrasPlaying) {
      this.soundAtras.pause();
      this.isAtrasPlaying = false;
    }
  }

  handleCanvasClick(e) {
    if (!this.isPaused || !this.pauseButtons) return;

    const rect = this.canvas.getBoundingClientRect();
    const scale = this.scale || 1;
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    const btnResume = this.pauseButtons.resume;
    if (btnResume && clickX >= btnResume.x && clickX <= btnResume.x + btnResume.w &&
        clickY >= btnResume.y && clickY <= btnResume.y + btnResume.h) {
      this.isPaused = false;
      if (this.soundMusica.currentTime < 2) {
        this.soundMusica.currentTime = 2;
      }
      this.soundMusica.play().catch(() => {});
      return;
    }

    const btnMenu = this.pauseButtons.menu;
    if (btnMenu && clickX >= btnMenu.x && clickX <= btnMenu.x + btnMenu.w &&
        clickY >= btnMenu.y && clickY <= btnMenu.y + btnMenu.h) {

      this.stopEngineSounds();
      if (this.soundMusica) this.soundMusica.pause();

      window.location.href = '../';
    }
  }

  resetGame() {
    this.isCompleted = false;
    this.fadeAlpha = 0;
    this.endTimerStarted = false;
    this.score = 0;
    this.scrollOffset = 0;

    if (this.soundMusica) {
      this.soundMusica.volume = 0.51;
      if (this.soundMusica.paused) {
        this.soundMusica.currentTime = 2;
        this.soundMusica.play().catch(() => {});
      }
    }

    this.passengersPool = [
      { id: 1, destination: "Supermercado", state: "AVAILABLE" },
      { id: 2, destination: "Centro comercial", state: "AVAILABLE" },
      { id: 3, destination: "Gimnasio", state: "AVAILABLE" },
      { id: 4, destination: "Parque", state: "AVAILABLE" },
      { id: 5, destination: "Aeropuerto", state: "AVAILABLE" }
    ];

    if (this.bus) {
      this.bus.passengers = [];
      this.bus.speed = 0;
      this.bus.currentLane = 0;
      if (this.lanes) this.bus.targetY = this.lanes[0];
    }

    this.obstacles = [];
    this.puddles = [];
    this.trafficCars = [];
    this.trafficLights = [];
    this.particles = [];

    this.initBuildings();
    this.initStreetProps();
    this.initClouds();
    this.initStops();

    this.showBusMenu();
  }

  getAvailablePassengers(count) {
    const available = this.passengersPool.filter(p => p.state === "AVAILABLE");
    const numToGet = Math.min(count, available.length);
    const selected = [];

    for (let i = 0; i < numToGet; i++) {
      const randIdx = Math.floor(Math.random() * available.length);
      const passenger = available.splice(randIdx, 1)[0];

      passenger.state = "WAITING";
      selected.push(passenger);
    }
    return selected;
  }

  checkAllPassengersCompleted() {
    const allDelivered = this.passengersPool.every(p => p.state === "DELIVERED");
    const busEmpty = this.bus.passengers.length === 0;

    if (allDelivered && busEmpty && !this.isCompleted) {
      this.isCompleted = true;

      if (this.soundMusica) {
        this.soundMusica.volume = 0.15;
      }

      if (this.soundTerminado) {
        this.soundTerminado.currentTime = 0;
        this.soundTerminado.play().catch(() => {});

        this.soundTerminado.onended = () => {
          if (!this.endTimerStarted) {
            this.endTimerStarted = true;
            setTimeout(() => {
              this.startFadeToBlack();
            }, 3000);
          }
        };
      }
    }
  }

  startFadeToBlack() {
    const fadeInterval = setInterval(() => {
      this.fadeAlpha += 0.05;
      if (this.fadeAlpha >= 1) {
        this.fadeAlpha = 1;
        clearInterval(fadeInterval);
        if (this.onGoToMenu) {
          this.onGoToMenu();
        } else {
          this.resetGame();
        }
      }
    }, 50);
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const realWidth = window.innerWidth;
    const realHeight = window.innerHeight;

    const isMobileDevice = this.isMobile || (realWidth < 1024 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

    const oldLanes = this.lanes ? [...this.lanes] : null;

    if (!isMobileDevice && realWidth >= realHeight) {
      // 1. MODO PC / DESKTOP (100% INTACTO ORIGINAL)
      this.scale = 1.0;
      this.width = realWidth;
      this.height = realHeight;

      const roadTop = this.height * 0.55;
      const roadHeight = this.height * 0.42;
      const laneSpacing = roadHeight / 3;

      this.lanes = [
        roadTop + laneSpacing * 0.35,
        roadTop + laneSpacing * 1.35,
        roadTop + laneSpacing * 2.35
      ];
    } else if (realWidth >= realHeight) {
      // 2. MODO MÓVIL HORIZONTAL (LANDSCAPE)
      // Ajuste de altura lógica a 720px para mantener la misma escala visual que en PC
      this.scale = realHeight / 720;
      this.width = realWidth / this.scale;
      this.height = 720;

      const roadTop = this.height * 0.52;
      const roadHeight = this.height * 0.44;
      const laneSpacing = roadHeight / 3;

      this.lanes = [
        roadTop + laneSpacing * 0.35,
        roadTop + laneSpacing * 1.35,
        roadTop + laneSpacing * 2.35
      ];
    } else {
      // 3. MODO MÓVIL VERTICAL (PORTRAIT)
      // Ancho lógico de 800px para evitar desbordamientos laterales
      this.scale = realWidth / 800;
      this.width = 800;
      this.height = realHeight / this.scale;

      const effectiveRoadHeight = Math.min(this.height * 0.35, 450);
      const roadTop = this.height - effectiveRoadHeight - 40;
      const laneSpacing = effectiveRoadHeight / 3;

      this.lanes = [
        roadTop + laneSpacing * 0.35,
        roadTop + laneSpacing * 1.35,
        roadTop + laneSpacing * 2.35
      ];
    }

    this.canvas.width = realWidth * dpr;
    this.canvas.height = realHeight * dpr;
    this.canvas.style.width = `${realWidth}px`;
    this.canvas.style.height = `${realHeight}px`;

    // APLICACIÓN DIRECTA DEL ESCALADO AL CONTEXTO DEL CANVAS
    this.ctx.setTransform(dpr * this.scale, 0, 0, dpr * this.scale, 0, 0);

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";

    if (this.bus) {
      this.bus.targetY = this.lanes[this.bus.currentLane];
      this.bus.y = this.bus.targetY;
    }

    if (this.trafficCars) {
      this.trafficCars.forEach(car => {
        if (car.currentLane !== undefined && car.currentLane >= 0 && car.currentLane < this.lanes.length) {
          const newTargetY = this.lanes[car.currentLane];
          if (car.isChangingLane && oldLanes) {
            let closestStartLane = 0;
            let minDiff = Infinity;
            oldLanes.forEach((lY, idx) => {
              const diff = Math.abs(lY - car.startY);
              if (diff < minDiff) {
                minDiff = diff;
                closestStartLane = idx;
              }
            });
            car.startY = this.lanes[closestStartLane];
            car.targetY = newTargetY;
            const t = car.laneProgress || 0;
            const smoothFactor = t * t * (3 - 2 * t);
            car.y = car.startY + (car.targetY - car.startY) * smoothFactor;
          } else {
            car.targetY = newTargetY;
            car.startY = newTargetY;
            car.y = newTargetY;
          }
        }
      });
    }

    if (this.obstacles) {
      this.obstacles.forEach(obs => {
        if (obs.laneIdx !== undefined && obs.laneIdx >= 0 && obs.laneIdx < this.lanes.length) {
          obs.y = this.lanes[obs.laneIdx] + (obs.offsetY || 0);
        } else if (oldLanes) {
          let closestLane = 0;
          let minDiff = Infinity;
          oldLanes.forEach((lY, idx) => {
            const diff = Math.abs(lY - obs.y);
            if (diff < minDiff) {
              minDiff = diff;
              closestLane = idx;
            }
          });
          const diffY = obs.y - oldLanes[closestLane];
          obs.y = this.lanes[closestLane] + diffY;
        }
      });
    }

    if (this.puddles) {
      this.puddles.forEach(puddle => {
        if (puddle.laneIdx !== undefined && puddle.laneIdx >= 0 && puddle.laneIdx < this.lanes.length) {
          puddle.y = this.lanes[puddle.laneIdx];
        } else if (oldLanes) {
          let closestLane = 0;
          let minDiff = Infinity;
          oldLanes.forEach((lY, idx) => {
            const diff = Math.abs(lY - puddle.y);
            if (diff < minDiff) {
              minDiff = diff;
              closestLane = idx;
            }
          });
          puddle.y = this.lanes[closestLane];
        }
      });
    }
  }

  getNewStopDistance() {
    return 1400 + Math.random() * 1200;
  }

  initStops() {
    this.busStops = [];
    let currentX = 1000;

    const initialPassengers = this.getAvailablePassengers(1);
    if (initialPassengers.length > 0) {
      this.busStops.push({
        x: currentX,
        type: "PICKUP",
        passengers: initialPassengers,
        width: 300,
        processed: false
      });
    }
  }

  isBusInStopZone(stop) {
    const stopZoneLeft = stop.x;
    const stopZoneRight = stop.x + stop.width;

    const busFront = this.bus.x + this.bus.width;
    const busRear = this.bus.x;

    return (busFront >= stopZoneLeft) && (busRear <= stopZoneRight);
  }

  initBuildings() {
    this.buildings = [];
    let x = -50;
    while (x < this.width + 600) {
      const scale = 0.85 + Math.random() * 0.55;
      const gap = -8 + Math.random() * 15;

      this.buildings.push({
        x: x,
        scale: scale,
        width: 120 * scale,
        height: 160 * scale,
        imgIdx: Math.floor(Math.random() * this.assets.buildingSources.length),
        subIdx: Math.floor(Math.random() * 4)
      });
      x += (120 * scale) + gap;
    }
  }

  initStreetProps() {
    this.streetProps = [];
    this.farolaSpacing = 1020;
    this.papeleraSpacing = 1560;
    this.arbustoSpacing = 480;

    const farolaW = 60, farolaH = 140;
    const papeleraW = 35, papeleraH = 50;

    for (let x = 0; x < this.width + 1200; x += this.farolaSpacing) {
      this.streetProps.push({ x: x, type: "farola", width: farolaW, height: farolaH });
    }

    for (let x = 300; x < this.width + 1200; x += this.papeleraSpacing) {
      this.streetProps.push({ x: x, type: "papelera", width: papeleraW, height: papeleraH });
    }

    for (let x = 120; x < this.width + 1200; x += this.arbustoSpacing + (Math.random() * 250 - 100)) {
      const scale = 0.65 + Math.random() * 0.6;
      this.streetProps.push({
        x: x,
        type: "arbusto",
        scale: scale,
        width: 75 * scale,
        height: 50 * scale,
        hueShift: Math.floor(Math.random() * 50 - 25),
        brightness: Math.floor(88 + Math.random() * 28)
      });
    }
  }

  initClouds() {
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * (this.width + 400) - 100,
        y: 20 + Math.random() * (this.height * 0.28),
        scale: 0.6 + Math.random() * 0.8,
        speed: 12 + Math.random() * 20,
        opacity: 0.55 + Math.random() * 0.35
      });
    }
  }

  changeLane(dir) {
    if (this.isPaused || this.isSelectingBus || (this.boardingAnimation && this.boardingAnimation.active)) return;

    const newLane = this.bus.currentLane + dir;
    if (newLane >= 0 && newLane < this.lanes.length) {
      const targetY = this.lanes[newLane];

      const busLeft = this.bus.x - 20;
      const busRight = this.bus.x + this.bus.width + 20;

      const carInWay = this.trafficCars.some(car => {
        if (Math.abs(car.y - targetY) < 30) {
          return busLeft < (car.x + car.width) && busRight > car.x;
        }
        return false;
      });

      const obsInWay = this.obstacles.some(obs => {
        if (Math.abs(obs.y - targetY) < 30) {
          return busLeft < (obs.x + obs.width) && busRight > obs.x;
        }
        return false;
      });

      if (!carInWay && !obsInWay) {
        this.bus.currentLane = newLane;
        this.bus.targetY = targetY;
        this.steeringAngle = dir * 0.45;

        if (dir < 0) {
          this.bus.triggerDirection("up");
        } else if (dir > 0) {
          this.bus.triggerDirection("down");
        }
      }
    }
  }

  performAction() {
    if (this.isPaused || this.isSelectingBus || (this.boardingAnimation && this.boardingAnimation.active)) return;
    if (Math.abs(this.bus.speed) > 0.4) return;

    if (this.bus.currentLane !== 0) {
      return;
    }

    const stop = this.busStops.find(s => !s.processed && this.isBusInStopZone(s));
    if (!stop) return;

    if (stop.type === "PICKUP") {
      let boarded = 0;

      while (this.bus.passengers.length < this.bus.maxPassengers && stop.passengers.length > 0) {
        const passenger = stop.passengers.shift();

        if (this.boardingAnimation.start(passenger, stop, () => {
          passenger.state = "ON_BUS";
          this.bus.passengers.push(passenger);
          this.score += 50;
        })) {
          boarded++;
        }
      }

      if (stop.passengers.length === 0) stop.processed = true;
    } else if (stop.type === "DROPOFF") {
      const leavingPassengers = this.bus.passengers.filter(p => p.destination === stop.name);

      if (leavingPassengers.length > 0) {
        this.bus.dropOffPassengersByDestination(stop.name);

        leavingPassengers.forEach(p => {
          p.state = "DELIVERED";
        });

        stop.droppedPassengers = leavingPassengers;

        const pts = leavingPassengers.length * 120;
        this.score += pts;
        stop.processed = true;

        this.soundPuertas2.currentTime = 0;
        this.soundPuertas2.play().catch(() => {});

        this.checkAllPassengersCompleted();
      }
    }
  }

  showFloatingMessage(msg) {
    this.actionMessage = msg;
    this.actionMessageTimer = 2.2;
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(now) {
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (isNaN(dt) || dt < 0) dt = 0;
    if (dt > 0.1) dt = 0.1;

    if (!this.isPaused && !this.isSelectingBus) {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (this.isSelectingBus) return;

    if (this.boardingAnimation && this.boardingAnimation.active) {
      this.boardingAnimation.update(dt);
      this.bus.speed = 0;
      this.stopEngineSounds();
      return;
    }

    const factor = dt * 120;

    const isGasPressed = this.controls.keys && this.controls.keys.gas;
    const isReversePressed = this.controls.keys && this.controls.keys.reverse;

    if (isGasPressed) {
      if (this.isAtrasPlaying) {
        this.soundAtras.pause();
        this.isAtrasPlaying = false;
      }
      if (!this.isMarchaPlaying) {
        this.soundMarcha.currentTime = 0;
        this.soundMarcha.play().catch(() => {});
        this.isMarchaPlaying = true;
      }
    } else if (isReversePressed) {
      if (this.isMarchaPlaying) {
        this.soundMarcha.pause();
        this.isMarchaPlaying = false;
      }
      if (!this.isAtrasPlaying) {
        this.soundAtras.currentTime = 0;
        this.soundAtras.play().catch(() => {});
        this.isAtrasPlaying = true;
      }
      if (this.soundFreno.paused && Math.abs(this.bus.speed) > 0.1) {
        this.soundFreno.currentTime = 0;
        this.soundFreno.play().catch(() => {});
      }
    } else {
      this.stopEngineSounds();
    }

    this.steeringAngle *= Math.pow(0.9, factor);

    if (this.actionMessageTimer > 0) {
      this.actionMessageTimer -= dt;
    }

    let blockedForward = false;
    let blockedReverse = false;

    this.obstacles.forEach(obs => {
      if (Math.abs(obs.y - this.bus.targetY) < 30) {
        if (obs.x >= this.bus.x + this.bus.width - 5 && obs.x <= this.bus.x + this.bus.width + 15) blockedForward = true;
        if (obs.x + obs.width >= this.bus.x - 15 && obs.x + obs.width <= this.bus.x + 10) blockedReverse = true;
      }
    });

    this.trafficLights.forEach(tl => {
      if (tl.state === "RED") {
        if (tl.x >= this.bus.x + this.bus.width - 5 && tl.x <= this.bus.x + this.bus.width + 30) blockedForward = true;
      }
    });

    this.trafficCars.forEach(car => {
      if (Math.abs(car.y - this.bus.targetY) < 30) {
        if (car.x >= this.bus.x + this.bus.width - 10 && car.x <= this.bus.x + this.bus.width + 15) blockedForward = true;
        if (car.x + car.width >= this.bus.x - 15 && car.x + car.width <= this.bus.x + 10) blockedReverse = true;
      }
    });

    this.bus.update(dt, this.controls.keys, blockedForward, blockedReverse);
    this.scrollOffset += this.bus.speed * factor;

    if (Math.abs(this.bus.speed) > 0.15) {
      this.emitSmoke(this.bus.x, this.bus.y + 15, Math.abs(this.bus.speed) * 1.1);
    }

    this.puddles.forEach(puddle => {
      puddle.x -= this.bus.speed * factor;

      if (!puddle.splashed) {
        const busFront = this.bus.x + this.bus.width;
        const busRear = this.bus.x;

        const inX = busFront >= puddle.x && busRear <= (puddle.x + puddle.width);
        const inY = Math.abs(this.bus.targetY - puddle.y) < 35;

        if (inX && inY && Math.abs(this.bus.speed) > 0.2) {
          puddle.splashed = true;

          if (this.bus.windshield) {
            this.bus.windshield.addMudSplatter();
          }
        }
      }
    });

    this.clouds.forEach(cloud => {
      cloud.x -= (cloud.speed + this.bus.speed * 8) * dt;
      if (cloud.x < -250) {
        cloud.x = this.width + Math.random() * 200;
        cloud.y = 20 + Math.random() * (this.height * 0.28);
        cloud.scale = 0.6 + Math.random() * 0.8;
      }
    });

    this.buildings.forEach(b => {
      b.x -= this.bus.speed * 0.25 * factor;
    });

    const maxX = Math.max(...this.buildings.map(b => b.x + b.width), this.width);
    this.buildings.forEach(b => {
      if (b.x + b.width < -120) {
        const gap = -8 + Math.random() * 15;
        b.scale = 0.85 + Math.random() * 0.55;
        b.x = maxX + gap;
        b.imgIdx = Math.floor(Math.random() * this.assets.buildingSources.length);
        b.subIdx = Math.floor(Math.random() * 4);
      }
    });

    this.streetProps.forEach(p => p.x -= this.bus.speed * factor);

    const farolas = this.streetProps.filter(p => p.type === "farola");
    const papeleras = this.streetProps.filter(p => p.type === "papelera");
    const arbustos = this.streetProps.filter(p => p.type === "arbusto");

    const maxFarolaX = farolas.length > 0 ? Math.max(...farolas.map(f => f.x)) : this.width;
    const maxPapeleraX = papeleras.length > 0 ? Math.max(...papeleras.map(p => p.x)) : this.width;
    const maxArbustoX = arbustos.length > 0 ? Math.max(...arbustos.map(a => a.x)) : this.width;

    this.streetProps.forEach(p => {
      if (p.x < -180) {
        if (p.type === "farola") p.x = maxFarolaX + this.farolaSpacing;
        if (p.type === "papelera") p.x = maxPapeleraX + this.papeleraSpacing;
        if (p.type === "arbusto") {
          p.x = maxArbustoX + this.arbustoSpacing + (Math.random() * 250 - 80);
          p.scale = 0.65 + Math.random() * 0.6;
          p.width = 75 * p.scale;
          p.height = 50 * p.scale;
          p.hueShift = Math.floor(Math.random() * 50 - 25);
          p.brightness = Math.floor(88 + Math.random() * 28);
        }
      }
    });

    this.trafficCars.forEach(car => {
      GameTraffic.updateCarAI(this, car);
      car.x -= (this.bus.speed - car.speed) * factor;
      car.y += (car.targetY - car.y) * (1 - Math.pow(0.9, factor));

      const isCochet = car.img && car.img.src && car.img.src.includes("cochet");
      if (car.speed > 0.1) {
        if (isCochet) {
          this.emitAirEffect(car.x, car.y + 12);
        } else {
          this.emitSmoke(car.x, car.y + 12, car.speed * 1.1);
        }
      }
    });

    this.particles.forEach(p => {
      p.life += dt;
      p.x -= this.bus.speed * factor;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += (p.maxSize - p.size) * (dt / p.maxLife);
    });
    this.particles = this.particles.filter(p => p.life < p.maxLife);

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.nextObstacleTime) {
      this.spawnTimer = 0;
      this.nextObstacleTime = 0.8 + Math.random() * 0.8;
      GameTraffic.generateTrafficOrObstacle(this);
    }

    if (this.bus.speed > 0.1) {
      this.distanceSinceLastStop += this.bus.speed * factor;
      if (this.distanceSinceLastStop >= this.nextStopTargetDistance) {
        this.distanceSinceLastStop = 0;
        this.nextStopTargetDistance = this.getNewStopDistance();

        const newStop = GameTraffic.spawnBusStop(this);

        if (newStop && newStop.type === "DROPOFF" && !newStop.soundPlayed) {
          newStop.soundPlayed = true;
          this.soundParada.currentTime = 0;
          this.soundParada.play().catch(() => {});

          this.showFloatingMessage(`Parada solicitada: ${newStop.name}`);
        }
      }
    }

    this.trafficLights.forEach(tl => {
      tl.x -= this.bus.speed * factor;
      tl.timer += dt;

      if (tl.state === "RED" && tl.timer > 4.0) {
        tl.state = "GREEN";
        tl.timer = 0;
      } else if (tl.state === "GREEN" && tl.timer > 5.0) {
        tl.state = "YELLOW";
        tl.timer = 0;
      } else if (tl.state === "YELLOW" && tl.timer > 1.5) {
        tl.state = "RED";
        tl.timer = 0;
      }
    });

    this.obstacles.forEach(obs => obs.x -= this.bus.speed * factor);
    this.busStops.forEach(stop => stop.x -= this.bus.speed * factor);

    this.busStops.forEach(bs => {
      if (bs.x <= -1200) {
        if (bs.type === "PICKUP" && bs.passengers) {
          bs.passengers.forEach(p => {
            if (p.state === "WAITING") {
              p.state = "AVAILABLE";
            }
          });
        }
      }
    });

    this.obstacles = this.obstacles.filter(o => o.x > -500 && o.x < this.width + 1000);
    this.puddles = this.puddles.filter(p => p.x > -500 && p.x < this.width + 1000);
    this.trafficLights = this.trafficLights.filter(tl => tl.x > -500 && tl.x < this.width + 1000);
    this.busStops = this.busStops.filter(bs => bs.x > -1200 && bs.x < this.width + 1000);
    this.trafficCars = this.trafficCars.filter(c => c.x > -500 && c.x < this.width + 1000);
  }

  emitSmoke(x, y, intensity = 1.0) {
    if (Math.random() < 0.45) {
      this.particles.push({
        x: x,
        y: y + (Math.random() * 6 - 3),
        vx: -(30 + Math.random() * 20) * intensity,
        vy: -6 + Math.random() * 12,
        size: 3 + Math.random() * 3,
        maxSize: 13 + Math.random() * 8,
        alpha: 0.45 + Math.random() * 0.25,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35
      });
    }
  }

  emitAirEffect(x, y) {
    if (Math.random() < 0.25) {
      this.particles.push({
        x: x,
        y: y + (Math.random() * 6 - 3),
        vx: -(20 + Math.random() * 15),
        vy: -2 + Math.random() * 4,
        size: 1 + Math.random() * 2,
        maxSize: 4,
        alpha: 0.12,
        life: 0,
        maxLife: 0.25
      });
    }
  }

  render() {
    const dpr = window.devicePixelRatio || 1;
    const currentScale = this.scale || 1;

    // Asegura el escalado constante en cada frame de renderizado
    this.ctx.setTransform(dpr * currentScale, 0, 0, dpr * currentScale, 0, 0);

    GameRenderer.render(this);

    if (this.isCompleted && this.imgTerminado.complete && this.imgTerminado.naturalWidth > 0) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      this.ctx.fillRect(0, 0, this.width, this.height);

      const imgW = Math.min(this.width * 0.6, this.imgTerminado.naturalWidth);
      const imgH = imgW * (this.imgTerminado.naturalHeight / this.imgTerminado.naturalWidth);
      const imgX = (this.width - imgW) / 2;
      const imgY = (this.height - imgH) / 2;

      this.ctx.drawImage(this.imgTerminado, imgX, imgY, imgW, imgH);
      this.ctx.restore();
    }

    if (this.fadeAlpha > 0) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.restore();
    }
  }
}
