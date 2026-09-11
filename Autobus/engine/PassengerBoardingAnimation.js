/**
 * PassengerBoardingAnimation.js
 * Corrección de sincro para Pasajeros 3 y 5:
 * El estado de salida NO se activa hasta que las promesas de audio (saludo + tarjeta)
 * hayan finalizado por completo.
 */
export default class PassengerBoardingAnimation {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.time = 0;
    this.passenger = null;
    this.stop = null;
    this.onComplete = null;

    this.baseWidth = 1280;
    this.baseHeight = 720;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();
    this.audioBuffers = {};

    this.soundFiles = {
      tarjeta: "sounds/tarjeta.wav",
      saludo1: "sounds/saludo1.wav",
      saludo2: "sounds/saludo2.wav",
      saludo3: "sounds/saludo3.wav",
      saludo4: "sounds/saludo4.wav",
      saludo5: "sounds/saludo5.wav",
      saludo6: "sounds/saludo6.wav"
    };

    this.soundPuertas = new Audio("sounds/puertas1.wav");
    this.soundPuertas.volume = 0.7;

    this.soundTarjetaFallback = new Audio("sounds/tarjeta.wav");
    this.soundTarjetaFallback.volume = 0.8;

    this.preloadSounds();

    // Control de estados explícitos:
    // 'WAITING_DOOR' -> 'WALKING_TO_VALIDATOR' -> 'AUDIO_AND_VALIDATING' -> 'WALKING_INSIDE' -> 'FINISHED'
    this.animState = "WAITING_DOOR";
    this.cardValidated = false;
    this.cardValidationGlow = 0;
    this.exitProgress = 0;
  }

  async preloadSounds() {
    for (const [key, url] of Object.entries(this.soundFiles)) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffers[key] = await this.audioCtx.decodeAudioData(arrayBuffer);
      } catch (err) {
        console.error(`Error al decodificar sonido (${url}):`, err);
      }
    }
  }

  playSound(key) {
    return new Promise((resolve) => {
      if (this.audioCtx.state === "suspended") this.audioCtx.resume();

      const buffer = this.audioBuffers[key];
      if (!buffer) {
        resolve(false);
        return;
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      source.onended = () => resolve(true);
      source.start(0);
    });
  }

  async executeBoardingSequence() {
    // 1. Reproducir el saludo completo y ESPERAR a que termine de sonar
    const saludoKey = this.getPassengerAudioKey();
    const saludoOk = await this.playSound(saludoKey);
    
    if (!saludoOk && this.game.saludos) {
      const idx = parseInt(saludoKey.replace("saludo", "")) - 1;
      if (this.game.saludos[idx]) {
        this.game.saludos[idx].currentTime = 0;
        await new Promise((resolve) => {
          const audio = this.game.saludos[idx];
          audio.onended = resolve;
          audio.play().catch(resolve);
        });
      }
    }

    // Pequeña pausa natural antes de pasar la tarjeta
    await new Promise((r) => setTimeout(r, 250));

    // 2. Encender luz verde y sonar pitido de validación
    this.cardValidated = true;
    const tarjetaOk = await this.playSound("tarjeta");

    if (!tarjetaOk) {
      if (this.game.soundTarjeta) {
        this.game.soundTarjeta.currentTime = 0;
        await this.game.soundTarjeta.play().catch(() => {});
      } else if (this.soundTarjetaFallback) {
        this.soundTarjetaFallback.currentTime = 0;
        await this.soundTarjetaFallback.play().catch(() => {});
      }
    }

    // Pausa con la luz verde encendida antes de empezar a andar
    await new Promise((r) => setTimeout(r, 400));

    // 3. Habilitar la caminata hacia adentro
    this.animState = "WALKING_INSIDE";
  }

  getPassengerAudioKey() {
    if (!this.passenger) return "saludo1";
    let key = this.passenger.destination || this.passenger.id || 1;

    const destinationMap = {
      "Supermercado": "saludo1",
      "Centro comercial": "saludo2",
      "Gimnasio": "saludo3",
      "Parque": "saludo4",
      "Aeropuerto": "saludo5",
      "Colegio": "saludo6"
    };

    if (destinationMap[key]) return destinationMap[key];

    if (typeof key === "number") {
      return `saludo${((key - 1) % 6) + 1}`;
    }

    if (typeof key === "string") {
      const match = key.match(/\d+/);
      if (match) {
        return `saludo${((parseInt(match[0], 10) - 1) % 6) + 1}`;
      }
    }

    return "saludo1";
  }

  start(passenger, stop, onComplete = null) {
    if (this.active || !passenger || !stop) return false;
    this.active = true;
    this.time = 0;
    this.passenger = passenger;
    this.stop = stop;
    this.onComplete = onComplete;
    
    this.animState = "WAITING_DOOR";
    this.cardValidated = false;
    this.cardValidationGlow = 0;
    this.exitProgress = 0;

    if (this.game.bus) this.game.bus.speed = 0;

    if (this.audioCtx.state === "suspended") this.audioCtx.resume();

    if (this.soundPuertas) {
      this.soundPuertas.currentTime = 0;
      this.soundPuertas.play().catch(() => {
        if (this.game.soundPuertas1) {
          this.game.soundPuertas1.currentTime = 0;
          this.game.soundPuertas1.play().catch(() => {});
        }
      });
    }

    return true;
  }

  update(dt) {
    if (!this.active) return;
    this.time += dt;

    // Transiciones de estado
    if (this.animState === "WAITING_DOOR" && this.time >= 0.8) {
      this.animState = "WALKING_TO_VALIDATOR";
    }

    if (this.animState === "WALKING_TO_VALIDATOR" && this.time >= 1.8) {
      this.animState = "AUDIO_AND_VALIDATING";
      // Arranca la secuencia asíncrona de audio sin bloquear el bucle de render
      this.executeBoardingSequence();
    }

    if (this.cardValidated && this.cardValidationGlow < 1) {
      this.cardValidationGlow = Math.min(1, this.cardValidationGlow + dt * 4);
    }

    // Progreso de salida
    if (this.animState === "WALKING_INSIDE") {
      this.exitProgress += dt * 0.7; // Velocidad de caminata interior
      if (this.exitProgress >= 1) {
        this.finish();
      }
    }
  }

  finish() {
    if (!this.active) return;
    this.active = false;
    const callback = this.onComplete;
    this.onComplete = null;
    this.passenger = null;
    this.stop = null;
    if (callback) callback();
  }

  ease(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  getAsset(name) {
    const assets = this.game.assets || {};
    return (
      assets[name] ||
      assets[`${name}.png`] ||
      assets[`${name}Img`] ||
      (assets.images && assets.images[name])
    );
  }

  render(ctx, width, height) {
    if (!this.active) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const scale = Math.min(width / this.baseWidth, height / this.baseHeight);
    const offsetX = (width - this.baseWidth * scale) / 2;
    const offsetY = (height - this.baseHeight * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const renderW = this.baseWidth;
    const renderH = this.baseHeight;

    const doorOpenProgress = this.ease(Math.min(1, Math.max(0, (this.time - 0.2) / 1.0)));

    const doorBounds = {
      left: renderW * 0.532,
      right: renderW * 0.858,
      top: renderH * 0.230,
      bottom: renderH * 1.0
    };

    const isInsideBus = this.animState !== "WAITING_DOOR";

    // 1. Fondo de la parada
    this.renderParadaBackground(ctx, doorBounds);

    // 2. Pasajero DETRÁS de las puertas al inicio
    if (!isInsideBus) {
      this.renderPassenger(ctx, renderW, renderH, doorBounds);
    }

    // 3. Puertas de cristal
    this.renderDoors(ctx, doorBounds, doorOpenProgress);

    // 4. Marco interior
    this.renderInteriorFrame(ctx, renderW, renderH);

    // 5. Pasamanos
    this.renderLeftHandrails(ctx, renderW, renderH);

    // 6. Validador
    this.renderCardValidator(ctx, doorBounds);

    // 7. Pasajero DELANTE del marco cuando cruza el umbral
    if (isInsideBus) {
      this.renderPassenger(ctx, renderW, renderH, doorBounds);
    }

    ctx.restore();
  }

  renderParadaBackground(ctx, bounds) {
    const paradaImg =
      this.getAsset("busStop") ||
      this.getAsset("parada") ||
      this.getAsset("stop") ||
      this.getAsset("background");

    const doorW = bounds.right - bounds.left;
    const doorH = bounds.bottom - bounds.top;

    ctx.save();
    ctx.beginPath();
    ctx.rect(bounds.left, bounds.top, doorW, doorH);
    ctx.clip();

    const halfH = doorH / 2;
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(bounds.left, bounds.top, doorW, halfH);
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(bounds.left, bounds.top + halfH, doorW, halfH);

    if (paradaImg && (paradaImg.complete || paradaImg.naturalWidth > 0)) {
      const scale = Math.max(doorW / paradaImg.naturalWidth, doorH / paradaImg.naturalHeight) * 0.85;
      const imgW = paradaImg.naturalWidth * scale;
      const imgH = paradaImg.naturalHeight * scale;
      const imgX = bounds.left + (doorW - imgW) / 2;
      const imgY = bounds.top + (doorH - imgH) / 2;

      ctx.drawImage(paradaImg, imgX, imgY, imgW, imgH);
    }

    ctx.restore();
  }

  renderDoors(ctx, bounds, openProgress) {
    const doorW = bounds.right - bounds.left;
    const doorH = bounds.bottom - bounds.top;
    const panelW = doorW / 2;
    const slideOffset = panelW * 0.95 * openProgress;

    ctx.save();
    ctx.beginPath();
    ctx.rect(bounds.left, bounds.top, doorW, doorH);
    ctx.clip();

    const drawGlassPanel = (x, direction) => {
      ctx.save();
      const currentX = x + direction * slideOffset;

      const glassGrad = ctx.createLinearGradient(currentX, bounds.top, currentX + panelW, bounds.bottom);
      glassGrad.addColorStop(0, "rgba(220, 245, 255, 0.55)");
      glassGrad.addColorStop(0.3, "rgba(160, 215, 235, 0.35)");
      glassGrad.addColorStop(0.8, "rgba(100, 170, 195, 0.45)");

      ctx.fillStyle = glassGrad;
      ctx.fillRect(currentX, bounds.top, panelW, doorH);

      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      ctx.moveTo(currentX + panelW * 0.1, bounds.top);
      ctx.lineTo(currentX + panelW * 0.45, bounds.top);
      ctx.lineTo(currentX + panelW * 0.15, bounds.bottom);
      ctx.lineTo(currentX, bounds.bottom);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#2b3034";
      ctx.lineWidth = 5;
      ctx.strokeRect(currentX, bounds.top, panelW, doorH);

      ctx.fillStyle = "#111416";
      const rubberX = direction === -1 ? currentX + panelW - 4 : currentX;
      ctx.fillRect(rubberX, bounds.top, 4, doorH);

      const handleX = direction === -1 ? currentX + panelW - 14 : currentX + 10;
      const handleY = bounds.top + doorH * 0.45;
      const handleH = doorH * 0.18;

      ctx.fillStyle = "#a8b0b8";
      ctx.fillRect(handleX, handleY, 4, handleH);
      ctx.strokeStyle = "#4a5259";
      ctx.lineWidth = 1;
      ctx.strokeRect(handleX, handleY, 4, handleH);

      ctx.restore();
    };

    drawGlassPanel(bounds.left, -1);
    drawGlassPanel(bounds.left + panelW, 1);

    ctx.restore();
  }

  renderInteriorFrame(ctx, width, height) {
    const isLondonBus = this.game.bus?.busType?.startsWith("busl");
    const assetName = isLondonBus ? "interiorl" : "interior";

    const interiorImg =
      this.getAsset(assetName) ||
      this.getAsset("interior") ||
      this.getAsset("busInterior");

    if (interiorImg && (interiorImg.complete || interiorImg.naturalWidth > 0)) {
      const natW = interiorImg.naturalWidth;
      const natH = interiorImg.naturalHeight;

      const scale = height / natH;
      const drawW = natW * scale;
      const drawH = height;
      const drawX = width - drawW;

      ctx.drawImage(interiorImg, drawX, 0, drawW, drawH);
    }
  }

  renderLeftHandrails(ctx, width, height) {
    ctx.save();

    const drawRail = (x, y, w, h) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(x + 3, y, w, h);

      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, "#ca8a04");
      grad.addColorStop(0.3, "#fef08a");
      grad.addColorStop(0.6, "#eab308");
      grad.addColorStop(1, "#a16207");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, w / 2);
      ctx.fill();

      ctx.fillStyle = "#334155";
      ctx.fillRect(x - 3, y + 50, w + 6, 10);
      ctx.fillRect(x - 3, y + h - 60, w + 6, 10);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(x - 1, y + 53, w + 2, 4);
      ctx.fillRect(x - 1, y + h - 57, w + 2, 4);
    };

    drawRail(width * 0.18, 0, 12, height);
    drawRail(width * 0.38, 0, 12, height);

    ctx.restore();
  }

  renderCardValidator(ctx, bounds) {
    const x = bounds.left + 16;
    const y = bounds.top + (bounds.bottom - bounds.top) * 0.44;

    ctx.save();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(x, y, 28, 50, 6);
    ctx.fill();

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#020617";
    ctx.fillRect(x + 4, y + 6, 20, 14);

    let ledColor = "#eab308";
    if (this.cardValidated) {
      ledColor = "#22c55e";
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 12 * this.cardValidationGlow;
    }

    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(x + 14, y + 34, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderPassenger(ctx, width, height, bounds) {
    if (!this.passenger) return;

    const startX = bounds.left + (bounds.right - bounds.left) * 0.58;
    const validadorX = bounds.left + (bounds.right - bounds.left) * 0.48;
    const interiorX = bounds.left + (bounds.right - bounds.left) * 0.35;

    const startY = height * 1.02;
    const endY   = height * 1.13;

    const baseHeight = height * 0.48;

    let currentX = startX;
    let currentGroundY = startY;
    let isWalking = false;
    let alpha = 1;

    switch (this.animState) {
      case "WAITING_DOOR":
        currentX = startX;
        currentGroundY = startY;
        isWalking = false;
        break;

      case "WALKING_TO_VALIDATOR": {
        const p = Math.min(1, (this.time - 0.8) / 1.0);
        currentX = startX + (validadorX - startX) * p;
        currentGroundY = startY + (endY - startY) * (p * 0.5);
        isWalking = p < 1;
        break;
      }

      case "AUDIO_AND_VALIDATING":
        // SE QUEDA 100% CONGELADO frente al validador mientras habla y suena la tarjeta
        currentX = validadorX;
        currentGroundY = startY + (endY - startY) * 0.5;
        isWalking = false;
        break;

      case "WALKING_INSIDE": {
        const p = this.ease(this.exitProgress);
        currentX = validadorX + (interiorX - validadorX) * p;
        currentGroundY = (startY + (endY - startY) * 0.5) + (endY - (startY + (endY - startY) * 0.5)) * p;
        isWalking = true;
        alpha = 1 - p;
        break;
      }
    }

    const stepBob = isWalking ? Math.abs(Math.sin(this.time * 12)) * (height * 0.012) : 0;

    const scaleFactor = 1.0 + (((currentGroundY - startY) / (endY - startY)) * 0.35);
    const pHeight = baseHeight * scaleFactor;
    const currentY = currentGroundY - stepBob;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.beginPath();
    ctx.ellipse(
      currentX, 
      currentGroundY - 2, 
      (baseHeight * 0.15) * scaleFactor, 
      (baseHeight * 0.038) * scaleFactor, 
      0, 0, Math.PI * 2
    );
    ctx.fill();

    // Imagen del personaje
    const passengerImgs = this.game.assets?.passengerImgs || {};
    const img = passengerImgs[this.passenger.destination] || this.getAsset("passenger");

    if (img && img.complete && img.naturalWidth > 0) {
      const pWidth = pHeight * (img.naturalWidth / img.naturalHeight);
      ctx.drawImage(img, currentX - pWidth / 2, currentY - pHeight, pWidth, pHeight);
    } else {
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(currentX, currentY - pHeight * 0.8, pHeight * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1e40af";
      ctx.fillRect(currentX - pHeight * 0.1, currentY - pHeight * 0.68, pHeight * 0.2, pHeight * 0.68);
    }

    ctx.restore();
  }
}