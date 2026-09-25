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
        document.documentElement.requestFullscreen().catch((err) => {
          console.error(`Error al intentar activar pantalla completa: ${err.message}`);
        });
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
      btn.style.borderRadius = "14px";
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

    // --- IZQUIERDA: CRUCETA DE DIRECCIONES ---
    // Arriba (Cambiar de carril hacia arriba)
    this.btnUp = makeBtn("▲", {
      bottom: `calc(130px + ${safeBottom})`,
      left: "75px",
      width: "56px",
      height: "56px",
      fontSize: "24px"
    });

    // Izquierda (Atrás / Reversa)
    this.btnReverse = makeBtn("◀", {
      bottom: `calc(70px + ${safeBottom})`,
      left: "15px",
      width: "56px",
      height: "56px",
      fontSize: "24px"
    });

    // Derecha (Avanzar)
    this.btnGas = makeBtn("▶", {
      bottom: `calc(70px + ${safeBottom})`,
      left: "135px",
      width: "56px",
      height: "56px",
      fontSize: "24px"
    });

    // Abajo (Cambiar de carril hacia abajo)
    this.btnDown = makeBtn("▼", {
      bottom: `calc(10px + ${safeBottom})`,
      left: "75px",
      width: "56px",
      height: "56px",
      fontSize: "24px"
    });

    // --- DERECHA: LIMPIAPARABRISAS Y PUERTAS ---
    this.btnWiper = makeBtn("🧹 LIMPIAR", {
      bottom: `calc(75px + ${safeBottom})`,
      right: "16px",
      width: "135px",
      height: "52px",
      fontSize: "13px"
    });

    this.btnPassengers = makeBtn("🚪 PUERTAS", {
      bottom: `calc(10px + ${safeBottom})`,
      right: "16px",
      width: "135px",
      height: "52px",
      fontSize: "13px"
    });

    // --- EVENTOS TÁCTILES ---

    // Arriba / Abajo (Cambios de carril directos)
    this.btnUp.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.game.changeLane(-1);
    }, { passive: false });

    this.btnDown.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.game.changeLane(1);
    }, { passive: false });

    // Avanzar (Derecha) y Reversa (Izquierda) al mantener pulsado
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
