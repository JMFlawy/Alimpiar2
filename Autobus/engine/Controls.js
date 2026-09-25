export default class Controls {
  constructor(game) {
    this.game = game;

    this.keys = {
      gas: false,
      reverse: false,
      space: false,
      " ": false
    };

    this.isMobile = game.isMobile;

    this.initInputs();
    this.createFullscreenButton();
    this.createMobileUI();

    // Activa automáticamente la pantalla completa en móviles al instanciar (elegir autobús)
    if (this.isMobile) {
      this.requestFullscreen();
    }
  }

  requestFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Pantalla completa no activada: ${err.message}`);
      });
    }
  }

  createFullscreenButton() {
    const oldBtn = document.getElementById("fullscreen-btn");
    if (oldBtn) oldBtn.remove();

    const btn = document.createElement("button");
    btn.id = "fullscreen-btn";
    btn.innerHTML = "⛶";

    Object.assign(btn.style, {
      position: "fixed",
      top: "12px",
      left: "12px",
      zIndex: "9999",
      width: "44px",
      height: "44px",
      fontSize: "20px",
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      color: "#ffffff",
      border: "2px solid rgba(255, 255, 255, 0.4)",
      borderRadius: "10px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
      backdropFilter: "blur(6px)",
      userSelect: "none",
      webkitUserSelect: "none"
    });

    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        this.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  }

  initInputs() {
    window.addEventListener("keydown", (e) => {
      // Espacio: activa el limpiaparabrisas
      if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        this.keys.space = true;
        this.keys[" "] = true;
      }

      // Cambio de carril
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        this.game.changeLane(-1);
      }

      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        this.game.changeLane(1);
      }

      // Avanzar y retroceder
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        this.keys.gas = true;
      }

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        this.keys.reverse = true;
      }

      // Acción de pasajeros (Ctrl o Enter)
      if (e.key === "Control" || e.key === "Enter") {
        e.preventDefault();
        if (this.game && typeof this.game.performAction === "function") {
          this.game.performAction();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
        this.keys.space = false;
        this.keys[" "] = false;
      }

      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        this.keys.gas = false;
      }

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        this.keys.reverse = false;
      }
    });
  }

  createMobileUI() {
    if (!this.isMobile) return;

    const oldOverlay = document.getElementById("mobile-controls-overlay");
    if (oldOverlay) oldOverlay.remove();

    this.mobileOverlay = document.createElement("div");
    this.mobileOverlay.id = "mobile-controls-overlay";
    Object.assign(this.mobileOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100dvh",
      pointerEvents: "none",
      zIndex: "9999"
    });

    document.body.appendChild(this.mobileOverlay);

    // Creador de botones transparentes
    const makeBtn = (html, cssStyles) => {
      const btn = document.createElement("button");
      btn.innerHTML = html;
      btn.style.position = "absolute";
      btn.style.pointerEvents = "auto";
      btn.style.userSelect = "none";
      btn.style.webkitUserSelect = "none";
      btn.style.touchAction = "manipulation";
      
      // Estilo transparente tipo cristal
      btn.style.backgroundColor = "rgba(255, 255, 255, 0.18)";
      btn.style.border = "2px solid rgba(255, 255, 255, 0.45)";
      btn.style.borderRadius = "10px";
      btn.style.color = "#ffffff";
      btn.style.fontWeight = "bold";
      btn.style.backdropFilter = "blur(5px)";
      btn.style.webkitBackdropFilter = "blur(5px)";
      btn.style.textShadow = "0px 2px 4px rgba(0, 0, 0, 0.8)";
      btn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";

      Object.assign(btn.style, cssStyles);
      this.mobileOverlay.appendChild(btn);
      return btn;
    };

    const safeBottom = "env(safe-area-inset-bottom, 0px)";

    // --- IZQUIERDA: CRUCETA COMPACTA DE DIRECCIONES (44x44px) ---
    this.btnUp = makeBtn("▲", {
      bottom: `calc(98px + ${safeBottom})`,
      left: "55px",
      width: "44px",
      height: "44px",
      fontSize: "18px"
    });

    this.btnReverse = makeBtn("◀", {
      bottom: `calc(54px + ${safeBottom})`,
      left: "10px",
      width: "44px",
      height: "44px",
      fontSize: "18px"
    });

    this.btnGas = makeBtn("▶", {
      bottom: `calc(54px + ${safeBottom})`,
      left: "100px",
      width: "44px",
      height: "44px",
      fontSize: "18px"
    });

    this.btnDown = makeBtn("▼", {
      bottom: `calc(10px + ${safeBottom})`,
      left: "55px",
      width: "44px",
      height: "44px",
      fontSize: "18px"
    });

    // --- ICONOS VECTORIALES ---
    const wiperIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18c0-5.5 4.5-10 10-10s10 4.5 10 10"/><line x1="12" y1="18" x2="19" y2="9"/></svg>`;

    const doorIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="7" y1="6" x2="10" y2="6"/><line x1="14" y1="6" x2="17" y2="6"/><circle cx="10" cy="12" r="1" fill="currentColor"/><circle cx="14" cy="12" r="1" fill="currentColor"/></svg>`;

    // --- DERECHA: LIMPIAPARABRISAS Y PUERTAS (CIRCULARES) ---
    this.btnWiper = makeBtn(wiperIcon, {
      bottom: `calc(65px + ${safeBottom})`,
      right: "15px",
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    });

    this.btnPassengers = makeBtn(doorIcon, {
      bottom: `calc(10px + ${safeBottom})`,
      right: "15px",
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    });

    // --- EVENTOS TÁCTILES ---
    this.btnUp.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.game.changeLane(-1);
    }, { passive: false });

    this.btnDown.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.game.changeLane(1);
    }, { passive: false });

    const bindHoldKey = (btn, keyName) => {
      btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.keys[keyName] = true;
      }, { passive: false });

      btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        this.keys[keyName] = false;
      }, { passive: false });

      btn.addEventListener("touchcancel", (e) => {
        e.preventDefault();
        this.keys[keyName] = false;
      }, { passive: false });
    };

    bindHoldKey(this.btnGas, "gas");
    bindHoldKey(this.btnReverse, "reverse");

    // Limpiaparabrisas (Mantener pulsado)
    this.btnWiper.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.keys.space = true;
      this.keys[" "] = true;
    }, { passive: false });

    this.btnWiper.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.keys.space = false;
      this.keys[" "] = false;
    }, { passive: false });

    this.btnWiper.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      this.keys.space = false;
      this.keys[" "] = false;
    }, { passive: false });

    // Puertas / Pasajeros (Un toque)
    this.btnPassengers.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (this.game && typeof this.game.performAction === "function") {
        this.game.performAction();
      }
    }, { passive: false });
  }
}
