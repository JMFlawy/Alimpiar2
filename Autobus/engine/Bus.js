// ==========================================
// 1. SISTEMA DE PARABRISAS (Cargas por mancha de suelo)
// ==========================================
export class WindshieldSystem {
    constructor() {
        this.floorPuddlesCount = 0;
        this.splatters = [];

        this.wiperAngle = 0;
        this.isWiping = false;
        this.wiperDirection = 1;
        this.wiperSpeed = 7.0;

        this.soundWiper = new Audio("sounds/limpia.mp3");
        this.soundWiper.loop = true;
        this.soundWiper.volume = 0.4;

        this.soundMud = new Audio("sounds/barro.mp3");
        this.soundMud.volume = 0.6;
    }

    addMudSplatter() {
        this.floorPuddlesCount++;
        this.splatters.push({
            puddleId: Date.now() + Math.random(),
            drops: Array.from({ length: 8 }, () => ({
                rx: 0.15 + Math.random() * 0.70,
                ry: 0.20 + Math.random() * 0.60,
                radius: 3 + Math.random() * 5
            }))
        });

        this.soundMud.currentTime = 0;
        this.soundMud.play().catch(() => {});
    }

    triggerWiper() {
        if (!this.isWiping) {
            this.isWiping = true;
            this.wiperDirection = 1;

            if (this.floorPuddlesCount > 0) {
                this.floorPuddlesCount--;
                this.splatters.pop();
            }

            this.soundWiper.currentTime = 0;
            this.soundWiper.play().catch(() => {});
        }
    }

    update(dt, isSpacePressed) {
        if (isSpacePressed && !this.isWiping) {
            this.triggerWiper();
        }

        if (this.isWiping) {
            const minAngle = 0;
            const maxAngle = Math.PI * 0.55;

            this.wiperAngle += this.wiperDirection * this.wiperSpeed * dt;

            if (this.wiperAngle >= maxAngle) {
                this.wiperAngle = maxAngle;
                this.wiperDirection = -1;
            } else if (this.wiperAngle <= minAngle) {
                this.wiperAngle = minAngle;
                this.wiperDirection = 1;

                if (isSpacePressed && this.floorPuddlesCount > 0) {
                    this.floorPuddlesCount--;
                    this.splatters.pop();
                } else {
                    this.isWiping = false;
                    this.wiperAngle = 0;
                    this.soundWiper.pause();
                }
            }
        } else {
            this.wiperAngle = 0;
            if (!this.soundWiper.paused) {
                this.soundWiper.pause();
            }
        }
    }

    renderOnWindow(ctx, busX, renderY, busW, busH, customRect = null) {
        const rect = customRect || { xRatio: 0.805, yRatio: 0.15, widthRatio: 0.155, heightRatio: 0.38 };
        
        const winX = busX + busW * rect.xRatio;
        const winY = renderY + busH * rect.yRatio;
        const winW = busW * rect.widthRatio;
        const winH = busH * rect.heightRatio;

        ctx.save();
        ctx.beginPath();
        ctx.rect(winX, winY, winW, winH);
        ctx.clip();

        this.splatters.forEach(group => {
            group.drops.forEach(drop => {
                const sx = winX + drop.rx * winW;
                const sy = winY + drop.ry * winH;

                ctx.save();
                ctx.fillStyle = "#5c3a21";
                ctx.beginPath();
                ctx.arc(sx, sy, drop.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#382111";
                ctx.beginPath();
                ctx.arc(sx - 1, sy - 1, drop.radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        });

        if (this.isWiping || this.wiperAngle > 0) {
            const pivotX = winX + winW * 0.88;
            const pivotY = winY + winH * 0.95;
            const armLength = winH * 0.85;

            ctx.save();
            ctx.translate(pivotX, pivotY);
            ctx.rotate(-this.wiperAngle);

            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -armLength);
            ctx.stroke();

            ctx.strokeStyle = "#0f172a";
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.moveTo(0, -armLength * 0.35);
            ctx.lineTo(0, -armLength);
            ctx.stroke();

            ctx.restore();
        }

        ctx.restore();
    }
}

// ==========================================
// 2. CLASE AUTOBÚS
// ==========================================
export default class Bus {
    constructor(busType = "bus1") {
        this.x = 120;
        this.y = 0;
        this.currentLane = 1;
        this.targetY = 0;

        this.speed = 0;
        this.maxSpeed = 2.0;
        this.maxReverseSpeed = -1.5;

        this.passengers = [];
        this.maxPassengers = 6;

        this.windshield = new WindshieldSystem();

        this.soundLlegada = new Audio("sounds/llegada.mp3");
        this.soundLlegada.volume = 0.7;

        this.busImage1 = new Image();
        this.busImage2 = new Image();
        this.busUpImage = new Image();
        this.busDownImage = new Image();

        this.retrovisorImg = new Image();

        this.scale = 1.0;
        this.setBusType(busType);

        this.passengerImages = {
            "Supermercado": new Image(),
            "Centro comercial": new Image(),
            "Gimnasio": new Image(),
            "Parque": new Image(),
            "Aeropuerto": new Image(),
            "Colegio": new Image()
        };

        this.passengerImages["Supermercado"].src = "assets/pasajeros1.png";
        this.passengerImages["Centro comercial"].src = "assets/pasajeros2.png";
        this.passengerImages["Gimnasio"].src = "assets/pasajeros3.png";
        this.passengerImages["Parque"].src = "assets/pasajeros4.png";
        this.passengerImages["Aeropuerto"].src = "assets/pasajeros5.png";
        this.passengerImages["Colegio"].src = "assets/pasajeros6.png";

        this.faceImages = {
            1: new Image(),
            2: new Image(),
            3: new Image(),
            4: new Image(),
            5: new Image(),
            6: new Image()
        };
        this.faceImages[1].src = "assets/caras1.png";
        this.faceImages[2].src = "assets/caras2.png";
        this.faceImages[3].src = "assets/caras3.png";
        this.faceImages[4].src = "assets/caras4.png";
        this.faceImages[5].src = "assets/caras5.png";
        this.faceImages[6].src = "assets/caras6.png";

        this.normalSpriteTimer = 0;
        this.useSecondSprite = false;

        this.verticalState = "none";
        this.verticalTimer = 0;
        this.verticalDuration = 2.2;

        this.wheelAngle = 0;

        this.ledScrollOffset = 0;
        this.currentDestinationText = "";
    }

    playDropOffSound() {
        if (this.soundLlegada) {
            this.soundLlegada.currentTime = 0;
            this.soundLlegada.play().catch(() => {});
        }
    }

    dropOffPassenger(index) {
        if (index >= 0 && index < this.passengers.length) {
            const removed = this.passengers.splice(index, 1);
            this.playDropOffSound();
            return removed[0];
        }
        return null;
    }

    dropOffPassengersByDestination(destination) {
        const initialCount = this.passengers.length;
        this.passengers = this.passengers.filter(p => p.destination !== destination);
        if (this.passengers.length < initialCount) {
            this.playDropOffSound();
        }
    }

    updateScale(canvasWidth, canvasHeight, laneSpacing) {
        if (!canvasWidth || !canvasHeight || !laneSpacing) return;
        this.lastCanvasW = canvasWidth;
        this.lastCanvasH = canvasHeight;
        this.lastLaneSpacing = laneSpacing;

        const scale = Math.min(laneSpacing / 130, canvasWidth / 950);
        this.scale = scale;

        this.width = this.baseWidth * scale;
        this.height = this.baseHeight * scale;
        this.offsetY = this.baseOffsetY * scale;
        this.wheels.radius = this.baseWheelRadius * scale;
        this.x = Math.max(20, 120 * scale);
    }

    setBusType(busType) {
        this.busType = busType || "bus1";
        const baseName = this.busType.replace(/\d+$/, "");

        this.busImage1.src = `assets/${baseName}1.png`;
        this.busImage2.src = `assets/${baseName}2.png`;
        this.busUpImage.src = `assets/${baseName}arriba.png`;
        this.busDownImage.src = `assets/${baseName}abajo.png`;

        let retrovisorFile = "retrovisor.png";
        if (this.busType.startsWith("busv")) {
            retrovisorFile = "retrovisorv.png";
        } else if (this.busType.startsWith("busa")) {
            retrovisorFile = "retrovisora.png";
        } else if (this.busType.startsWith("busr")) {
            retrovisorFile = "retrovisorr.png";
        } else if (this.busType.startsWith("busl")) {
            retrovisorFile = "retrovisorl.png";
        }

        this.retrovisorImg.src = `assets/${retrovisorFile}`;
        this.retrovisorImg.onerror = () => {
            if (this.retrovisorImg.src.endsWith(".png")) {
                const name = retrovisorFile.replace(".png", "");
                this.retrovisorImg.src = `assets/${name}.jpg`;
            }
        };

        if (this.busType.startsWith("busl")) {
            this.baseWidth = 490;
            this.baseHeight = 280;
            this.baseOffsetY = -205;
            this.baseWheelRadius = 33;

            this.wheels = {
                frontXRatio: 0.77,
                rearXRatio: 0.315,
                yRatio: 0.85,
                radius: 33
            };

            this.windows = [
                { x: 0.080, y: 0.440, width: 0.100, height: 0.210 },
                { x: 0.200, y: 0.440, width: 0.100, height: 0.210 },
                { x: 0.320, y: 0.440, width: 0.100, height: 0.210 },
                { x: 0.440, y: 0.440, width: 0.100, height: 0.210 },
                { x: 0.560, y: 0.440, width: 0.100, height: 0.210 },
                { x: 0.750, y: 0.440, width: 0.100, height: 0.210 }
            ];

            this.windshieldRect = {
                xRatio: 0.765,
                yRatio: 0.420,
                widthRatio: 0.130,
                heightRatio: 0.210
            };

            this.ledPanelRect = {
                xRatio: 0.842,
                yRatio: 0.292,
                widthRatio: 0.089,
                heightRatio: 0.082,
                rotation: 0.045,
                offsetX: 1,
                offsetY: 1
            };

        } else {
            this.baseWidth = 450;
            this.baseHeight = 200;
            this.baseOffsetY = -120;
            this.baseWheelRadius = 30;

            this.wheels = {
                frontXRatio: 0.67,
                rearXRatio: 0.23,
                yRatio: 0.85,
                radius: 30
            };

            this.windows = [
                { x: 0.037, y: 0.175, width: 0.125, height: 0.39 },
                { x: 0.168, y: 0.175, width: 0.125, height: 0.39 },
                { x: 0.292, y: 0.175, width: 0.125, height: 0.39 },
                { x: 0.416, y: 0.175, width: 0.125, height: 0.39 },
                { x: 0.545, y: 0.175, width: 0.125, height: 0.39 },
                { x: 0.764, y: 0.175, width: 0.105, height: 0.34 }
            ];

            this.windshieldRect = {
                xRatio: 0.805,
                yRatio: 0.150,
                widthRatio: 0.155,
                heightRatio: 0.380
            };

            this.ledPanelRect = {
                xRatio: 0.830,
                yRatio: 0.076,
                widthRatio: 0.110,
                heightRatio: 0.080,
                rotation: 0.055,
                offsetX: 2,
                offsetY: 1
            };
        }

        if (this.lastCanvasW) {
            this.updateScale(this.lastCanvasW, this.lastCanvasH, this.lastLaneSpacing);
        } else {
            this.width = this.baseWidth;
            this.height = this.baseHeight;
            this.offsetY = this.baseOffsetY;
        }
    }

    triggerDirection(dir) {
        if (dir === "up" || dir === "down") {
            this.verticalState = dir;
            this.verticalTimer = this.verticalDuration;
        }
    }

    setDestinationText(text) {
        if (text !== undefined && text !== this.currentDestinationText) {
            this.currentDestinationText = text ? text.toUpperCase() : "";
        }
    }

    update(dt, keys, blockedForward, blockedReverse) {
        const spacePressed = keys && (keys.space || keys[" "] || keys.Space);
        this.windshield.update(dt, spacePressed);

        this.normalSpriteTimer += dt;
        if (this.normalSpriteTimer >= 3.0) {
            this.normalSpriteTimer %= 3.0;
            this.useSecondSprite = !this.useSecondSprite;
        }

        if (this.verticalTimer > 0) {
            this.verticalTimer -= dt;
            if (this.verticalTimer <= 0) {
                this.verticalState = "none";
            }
        }

        if (keys.gas) {
            if (this.speed < 0) {
                this.speed += 0.2;
            } else if (!blockedForward) {
                this.speed = Math.min(this.speed + 0.10, this.maxSpeed);
            } else {
                this.speed = 0;
            }
        } else if (keys.reverse) {
            if (this.speed > 0) {
                this.speed -= 0.2;
            } else if (!blockedReverse) {
                this.speed = Math.max(this.speed - 0.06, this.maxReverseSpeed);
            } else {
                this.speed = 0;
            }
        } else {
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - 0.05);
            } else if (this.speed < 0) {
                this.speed = Math.min(0, this.speed + 0.05);
            }
        }

        if (blockedForward && this.speed > 0) this.speed = 0;
        if (blockedReverse && this.speed < 0) this.speed = 0;

        // Movimiento vertical suave e independiente de la tasa de refresco (FPS)
        const lerpFactor = 1 - Math.pow(0.9, dt * 120);
        this.y += (this.targetY - this.y) * lerpFactor;
        if (Math.abs(this.targetY - this.y) < 0.1) {
            this.y = this.targetY;
        }

        this.wheelAngle += this.speed * 0.18;
        this.ledScrollOffset += dt * 40;
    }

    renderLEDDisplay(ctx, busX, renderY, busW, busH) {
        const rect = this.ledPanelRect;
        const panelX = busX + busW * rect.xRatio + (rect.offsetX || 0);
        const panelY = renderY + busH * rect.yRatio + (rect.offsetY || 0);
        const panelW = busW * rect.widthRatio;
        const panelH = busH * rect.heightRatio;

        ctx.save();

        if (rect.rotation) {
            ctx.translate(panelX + panelW / 2, panelY + panelH / 2);
            ctx.rotate(rect.rotation);
            ctx.translate(-(panelX + panelW / 2), -(panelY + panelH / 2));
        }

        // Fondo del cartel
        ctx.fillStyle = "#050505";
        ctx.fillRect(panelX, panelY, panelW, panelH);

        // Recorte para que no se dibuje fuera del panel
        ctx.beginPath();
        ctx.rect(panelX + 1, panelY + 1, panelW - 2, panelH - 2);
        ctx.clip();

        const fontSize = Math.max(7, Math.floor(panelH * 0.62));
        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        ctx.fillStyle = "#ff9900";
        ctx.shadowColor = "#ff8800";
        ctx.shadowBlur = 4;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const text = this.passengers.length > 0 
            ? `PRÓXIMA: ${this.passengers[0].destination.toUpperCase()}`
            : (this.currentDestinationText || "LÍNEA 3");

        if (text) {
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width || 80;

            const totalDistance = panelW + textWidth;
            const currentOffset = this.ledScrollOffset % totalDistance;

            const drawX = panelX + panelW - currentOffset;

            ctx.fillText(text, drawX, panelY + panelH / 2);
        }

        ctx.restore();
    }

    renderPassengersOnWindows(ctx, busX, renderY, busW, busH) {
        const windows = this.windows;

        const isLondonBus = this.busType.startsWith("busl");
        const scale = this.scale || 1.0;
        const cropLeft = (isLondonBus ? 0 : 3) * scale;
        const cropTop = (isLondonBus ? 0 : 5) * scale;
        const cropRight = (isLondonBus ? 0 : 3) * scale;
        const cropBottom = (isLondonBus ? 0 : 4) * scale;

        windows.forEach((windowData, index) => {
            const winX = busX + busW * windowData.x;
            const winY = renderY + busH * windowData.y;
            const winW = busW * windowData.width;
            const winH = busH * windowData.height;

            const clipX = winX + cropLeft;
            const clipY = winY + cropTop;
            const clipW = Math.max(0, winW - cropLeft - cropRight);
            const clipH = Math.max(0, winH - cropTop - cropBottom);

            const passenger = this.passengers[index];

            if (passenger) {
                const passengerImg = this.passengerImages[passenger.destination];

                ctx.save();
                ctx.beginPath();
                ctx.rect(clipX, clipY, clipW, clipH);
                ctx.clip();

                if (
                    passengerImg &&
                    passengerImg.complete &&
                    passengerImg.naturalWidth > 0
                ) {
                    const imageAspect = passengerImg.naturalWidth / passengerImg.naturalHeight;
                    
                    let passengerScale = 1.28;
                    if (isLondonBus) {
                        passengerScale = 1.68;
                    }

                    const passengerH = winH * passengerScale;
                    const passengerW = passengerH * imageAspect;
                    const passengerX = winX + (winW - passengerW) / 2;
                    
                    const offsetY = (isLondonBus ? 0 : 14) * scale;
                    const passengerY = winY + winH * 0.02 + offsetY;

                    ctx.globalAlpha = 0.95;
                    ctx.drawImage(
                        passengerImg,
                        passengerX,
                        passengerY,
                        passengerW,
                        passengerH
                    );
                } else {
                    ctx.fillStyle = "#f1c40f";
                    ctx.beginPath();
                    ctx.arc(
                        winX + winW / 2,
                        winY + winH * 0.30,
                        Math.min(winW, winH) * 0.19,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();

                    ctx.fillStyle = "#3498db";
                    ctx.fillRect(
                        winX + winW * 0.20,
                        winY + winH * 0.42,
                        winW * 0.60,
                        winH * 0.58
                    );
                }
                ctx.restore();
            }
        });
    }

    drawRoundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
            ctx.roundRect(x, y, w, h, r);
        } else {
            let radii = typeof r === "number" ? [r, r, r, r] : r;
            const [tl, tr, br, bl] = radii;
            ctx.moveTo(x + tl, y);
            ctx.lineTo(x + w - tr, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
            ctx.lineTo(x + w, y + h - br);
            ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
            ctx.lineTo(x + bl, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
            ctx.lineTo(x, y + tl);
            ctx.quadraticCurveTo(x, y, x + tl, y);
            ctx.closePath();
        }
    }

    renderRearviewMirror(ctx, canvasWidth, canvasHeight) {
        const mirrorW = 290;
        const mirrorH = 95;
        const mirrorX = (canvasWidth - mirrorW) / 2;
        const mirrorY = 14;

        ctx.save();

        const mountGrad = ctx.createLinearGradient(canvasWidth / 2 - 8, 0, canvasWidth / 2 + 8, 0);
        mountGrad.addColorStop(0, "#0f172a");
        mountGrad.addColorStop(0.5, "#475569");
        mountGrad.addColorStop(1, "#020617");
        ctx.fillStyle = mountGrad;
        ctx.fillRect(canvasWidth / 2 - 6, 0, 12, mirrorY + 8);

        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.arc(canvasWidth / 2, mirrorY + 8, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 5;

        const bezelGrad = ctx.createLinearGradient(mirrorX, mirrorY, mirrorX, mirrorY + mirrorH);
        bezelGrad.addColorStop(0, "#334155");
        bezelGrad.addColorStop(0.3, "#1e293b");
        bezelGrad.addColorStop(1, "#0f172a");

        this.drawRoundRectPath(ctx, mirrorX, mirrorY, mirrorW, mirrorH, [16, 16, 12, 12]);
        ctx.fillStyle = bezelGrad;
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2;
        this.drawRoundRectPath(ctx, mirrorX + 2, mirrorY + 2, mirrorW - 4, mirrorH - 4, [14, 14, 10, 10]);
        ctx.stroke();

        const glassX = mirrorX + 6;
        const glassY = mirrorY + 6;
        const glassW = mirrorW - 12;
        const glassH = mirrorH - 12;

        ctx.save();
        this.drawRoundRectPath(ctx, glassX, glassY, glassW, glassH, [10, 10, 8, 8]);
        ctx.clip();

        if (this.retrovisorImg.complete && this.retrovisorImg.naturalWidth > 0) {
            ctx.drawImage(this.retrovisorImg, glassX, glassY, glassW, glassH);
        } else {
            const bgGrad = ctx.createLinearGradient(glassX, glassY, glassX, glassY + glassH);
            bgGrad.addColorStop(0, "#2a3a4a");
            bgGrad.addColorStop(1, "#111923");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(glassX, glassY, glassW, glassH);
        }

        const onboard = this.passengers || [];
        const passCount = onboard.length;

        if (passCount > 0) {
            const availW = glassW - 16;
            const availH = glassH - 8;
            const slotW = availW / passCount;

            onboard.forEach((p, idx) => {
                const pId = p.id || ({
                    "Supermercado": 1,
                    "Centro comercial": 2,
                    "Gimnasio": 3,
                    "Parque": 4,
                    "Aeropuerto": 5,
                    "Colegio": 6
                }[p.destination] || (idx + 1));

                const faceImg = this.faceImages[pId];

                if (faceImg && faceImg.complete && faceImg.naturalWidth > 0) {
                    const aspect = faceImg.naturalWidth / faceImg.naturalHeight;
                    let targetH = availH * 0.88;
                    let targetW = targetH * aspect;

                    if (targetW > slotW * 0.92) {
                        targetW = slotW * 0.92;
                        targetH = targetW / aspect;
                    }

                    const slotCenterX = glassX + 8 + (idx + 0.5) * slotW;
                    const drawX = slotCenterX - targetW / 2;
                    const drawY = glassY + glassH - targetH;

                    ctx.drawImage(faceImg, drawX, drawY, targetW, targetH);
                }
            });
        }

        const sheenGrad = ctx.createLinearGradient(glassX, glassY, glassX + glassW, glassY + glassH);
        sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.22)");
        sheenGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.04)");
        sheenGrad.addColorStop(0.55, "rgba(255, 255, 255, 0.0)");
        sheenGrad.addColorStop(1, "rgba(0, 0, 0, 0.25)");
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(glassX, glassY, glassW, glassH);

        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 2.5;
        this.drawRoundRectPath(ctx, glassX, glassY, glassW, glassH, [10, 10, 8, 8]);
        ctx.stroke();

        ctx.restore();

        const tabW = 16;
        const tabH = 7;
        const tabX = (canvasWidth - tabW) / 2;
        const tabY = mirrorY + mirrorH;
        ctx.fillStyle = "#0f172a";
        this.drawRoundRectPath(ctx, tabX, tabY, tabW, tabH, [0, 0, 3, 3]);
        ctx.fill();

        ctx.restore();
    }

    renderHUD(ctx, width, height) {
        this.renderRearviewMirror(ctx, width, height);
    }

    render(ctx) {
        const scale = this.scale || 1.0;
        const bounceY = Math.sin(performance.now() * 0.008) * (Math.abs(this.speed) * 0.10);
        const topLaneOffset = (this.currentLane === 0) ? (-15 * scale) : 0;
        const renderY = this.y + this.offsetY + bounceY + topLaneOffset;

        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width * 0.5,
            renderY + this.height * 0.95,
            this.width * 0.48,
            Math.max(3, 12 * scale),
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        let currentImage;
        const diffY = this.targetY - this.y;

        if ((this.verticalState === "up" && this.verticalTimer > 0) || diffY < -2) {
            currentImage = this.busUpImage;
        } else if ((this.verticalState === "down" && this.verticalTimer > 0) || diffY > 2) {
            currentImage = this.busDownImage;
        } else {
            currentImage = this.useSecondSprite ? this.busImage2 : this.busImage1;
        }

        if (currentImage && currentImage.complete && currentImage.naturalWidth > 0) {
            ctx.drawImage(currentImage, this.x, renderY, this.width, this.height);
        } else {
            const fallbackImg = this.busImage1;
            if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
                ctx.drawImage(fallbackImg, this.x, renderY, this.width, this.height);
            } else {
                ctx.fillStyle = "#f1c40f";
                ctx.fillRect(this.x, renderY, this.width, this.height);
            }
        }

        this.renderLEDDisplay(ctx, this.x, renderY, this.width, this.height);
        this.renderPassengersOnWindows(ctx, this.x, renderY, this.width, this.height);
        this.windshield.renderOnWindow(ctx, this.x, renderY, this.width, this.height, this.windshieldRect);

        const wheelY = renderY + this.height * this.wheels.yRatio;
        const radius = this.wheels.radius;
        const wheelCenters = [
            this.x + this.width * this.wheels.rearXRatio,
            this.x + this.width * this.wheels.frontXRatio
        ];

        const isLondonBus = this.busType.startsWith("busl");

        wheelCenters.forEach(wx => {
            ctx.save();
            ctx.translate(wx, wheelY);

            if (isLondonBus) {
                ctx.scale(0.92, 1.08);
            }

            const tireGrad = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius);
            tireGrad.addColorStop(0, "#1a1a1a");
            tireGrad.addColorStop(0.7, "#2c2c2c");
            tireGrad.addColorStop(1, "#090909");

            ctx.fillStyle = tireGrad;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#000";
            ctx.lineWidth = Math.max(0.8, 1.5 * scale);
            ctx.stroke();

            ctx.rotate(this.wheelAngle);

            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
            ctx.fill();

            const rimColor1 = isLondonBus ? "#e53935" : "#ecf0f1";
            const rimColor2 = isLondonBus ? "#b71c1c" : "#95a5a6";
            
            const rimGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
            rimGrad.addColorStop(0, rimColor1);
            rimGrad.addColorStop(1, rimColor2);

            ctx.strokeStyle = rimGrad;
            ctx.lineWidth = radius * 0.15;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
            ctx.stroke();

            ctx.lineWidth = radius * 0.12;
            ctx.lineCap = "round";

            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos((i * Math.PI) / 3) * radius * 0.65,
                    Math.sin((i * Math.PI) / 3) * radius * 0.65
                );
                ctx.stroke();
            }

            ctx.fillStyle = isLondonBus ? "#f1c40f" : "#7f8c8d";
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(-radius * 0.05, -radius * 0.05, radius * 0.08, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#000";
            ctx.lineWidth = Math.max(0.5, 1 * scale);
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        });
    }
}
