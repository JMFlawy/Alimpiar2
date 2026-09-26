import GameTraffic from './GameTraffic.js';

export default class GameRenderer {
  static render(game) {
    // Durante la subida, la vista lateral queda sustituida por la vista interior.
    if (game.boardingAnimation && game.boardingAnimation.active) {
      game.boardingAnimation.render(game.ctx, game.width, game.height);
      return;
    }

    this.renderSideView(game);

    this.renderPendingHUD(game);
    this.renderStopRequestedSign(game);

    if (game.bus.renderHUD) {
      game.bus.renderHUD(game.ctx, game.width, game.height);
    }

    // Menú de Pausa
    if (game.isPaused) {
      this.renderPauseMenu(game);
    }
  }

  static isNextStopRequested(game) {
    if (!game.bus.passengers || game.bus.passengers.length === 0) return false;

    const upcomingStops = game.busStops
      .filter(stop => stop.type === "DROPOFF" && !stop.processed && (stop.x + (stop.width || 130)) >= game.bus.x)
      .sort((a, b) => a.x - b.x);

    if (upcomingStops.length === 0) return false;

    const nextStop = upcomingStops[0];
    return game.bus.passengers.some(p => p.destination === nextStop.name);
  }

  static renderStopRequestedSign(game) {
    const isRequested = this.isNextStopRequested(game);

    const boxW = 320;
    const boxH = 58;
    const boxX = game.width - boxW - 20;
    const boxY = 16;
    const radius = 10;

    game.ctx.save();

    const outerGrad = game.ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
    outerGrad.addColorStop(0, "#4b5563");
    outerGrad.addColorStop(0.5, "#1f2937");
    outerGrad.addColorStop(1, "#111827");

    game.ctx.fillStyle = outerGrad;
    game.ctx.beginPath();
    game.ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    game.ctx.fill();

    game.ctx.strokeStyle = isRequested ? "#ff4d4d" : "#374151";
    game.ctx.lineWidth = 3;
    game.ctx.stroke();

    const pad = 5;
    const innerX = boxX + pad;
    const innerY = boxY + pad;
    const innerW = boxW - (pad * 2);
    const innerH = boxH - (pad * 2);

    game.ctx.fillStyle = "#0a0202";
    game.ctx.beginPath();
    game.ctx.roundRect(innerX, innerY, innerW, innerH, radius - 2);
    game.ctx.fill();

    game.ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    game.ctx.lineWidth = 1.5;
    game.ctx.stroke();

    game.ctx.font = "bold 15px 'Courier New', monospace, sans-serif";
    game.ctx.textAlign = "center";
    game.ctx.textBaseline = "middle";

    if (isRequested) {
      game.ctx.fillStyle = "#ff1a1a";
      game.ctx.shadowColor = "#ff0000";
      game.ctx.shadowBlur = 12;
    } else {
      game.ctx.fillStyle = "#3a0d0d";
      game.ctx.shadowBlur = 0;
    }

    game.ctx.fillText("PARADA SOLICITADA", innerX + innerW / 2, innerY + innerH / 2);

    game.ctx.restore();
  }

  static renderPauseMenu(game) {
    game.ctx.save();

    game.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    game.ctx.fillRect(0, 0, game.width, game.height);

    const menuW = 320;
    const menuH = 220;
    const menuX = (game.width - menuW) / 2;
    const menuY = (game.height - menuH) / 2;

    game.ctx.fillStyle = "#1e293b";
    game.ctx.beginPath();
    game.ctx.roundRect(menuX, menuY, menuW, menuH, 12);
    game.ctx.fill();

    game.ctx.strokeStyle = "#38bdf8";
    game.ctx.lineWidth = 2;
    game.ctx.stroke();

    game.ctx.fillStyle = "#ffffff";
    game.ctx.font = "bold 22px sans-serif";
    game.ctx.textAlign = "center";
    game.ctx.fillText("⏸️ JUEGO PAUSADO", game.width / 2, menuY + 45);

    const btnW = 220;
    const btnH = 42;
    const btnX = (game.width - btnW) / 2;

    const btn1Y = menuY + 85;
    game.pauseButtons = {
      resume: { x: btnX, y: btn1Y, w: btnW, h: btnH },
      menu: { 
        x: btnX, 
        y: btn1Y + 55, 
        w: btnW, 
        h: btnH,
        action: () => {
          if (game.audioManager) {
            game.audioManager.stopAll();
          }
          window.location.href = "../index.html";
        }
      }
    };

    game.ctx.fillStyle = "#0284c7";
    game.ctx.beginPath();
    game.ctx.roundRect(btnX, btn1Y, btnW, btnH, 8);
    game.ctx.fill();

    game.ctx.fillStyle = "#ffffff";
    game.ctx.font = "bold 15px sans-serif";
    game.ctx.fillText("▶️ Reanudar (Esc)", game.width / 2, btn1Y + 26);

    const btn2Y = btn1Y + 55;
    game.ctx.fillStyle = "#e11d48";
    game.ctx.beginPath();
    game.ctx.roundRect(btnX, btn2Y, btnW, btnH, 8);
    game.ctx.fill();

    game.ctx.fillStyle = "#ffffff";
    game.ctx.fillText("🏠 Ir al Menú", game.width / 2, btn2Y + 26);

    game.ctx.restore();
  }

  static renderPendingHUD(game) {
    const pendingCount = game.passengersPool.filter(p => p.state !== "DELIVERED").length;

    const startX = 68;
    const startY = 10;

    const faltaW = 300;
    const faltaH = 70;

    const numBoxW = 50;
    const numBoxH = 50;
    const numBoxGap = 10;
    const fontSize = 26;

    game.ctx.save();

    const faltaX = startX;
    const faltaY = startY;

    if (game.assets.faltaImg && game.assets.faltaImg.complete && game.assets.faltaImg.naturalWidth > 0) {
      game.ctx.drawImage(game.assets.faltaImg, faltaX, faltaY, faltaW, faltaH);
    } else {
      game.ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      game.ctx.beginPath();
      game.ctx.roundRect(faltaX, faltaY, faltaW, faltaH, 8);
      game.ctx.fill();
      game.ctx.fillStyle = "#ffffff";
      game.ctx.font = "bold 12px sans-serif";
      game.ctx.textAlign = "center";
      game.ctx.textBaseline = "middle";
      game.ctx.fillText("FALTA", faltaX + faltaW / 2, faltaY + faltaH / 2);
    }

    const numBoxX = faltaX + faltaW + numBoxGap;
    const numBoxY = faltaY + (faltaH - numBoxH) / 2;

    game.ctx.shadowColor = pendingCount === 0 ? "rgba(46, 204, 113, 0.6)" : "rgba(241, 196, 15, 0.6)";
    game.ctx.shadowBlur = 10;

    game.ctx.fillStyle = "#000000";
    game.ctx.beginPath();
    game.ctx.roundRect(numBoxX, numBoxY, numBoxW, numBoxH, 10);
    game.ctx.fill();

    game.ctx.shadowBlur = 0;
    game.ctx.strokeStyle = pendingCount === 0 ? "#2ecc71" : "#f1c40f";
    game.ctx.lineWidth = 3;
    game.ctx.stroke();

    game.ctx.fillStyle = "#ffffff";
    game.ctx.font = `bold ${fontSize}px sans-serif`;
    game.ctx.textAlign = "center";
    game.ctx.textBaseline = "middle";
    game.ctx.fillText(pendingCount.toString(), numBoxX + numBoxW / 2, numBoxY + numBoxH / 2);

    game.ctx.restore();
  }

  static renderClouds(game) {
    game.clouds.forEach(c => {
      game.ctx.save();
      game.ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
      game.ctx.beginPath();
      const r = 24 * c.scale;
      game.ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      game.ctx.arc(c.x + r * 0.7, c.y - r * 0.4, r * 0.85, 0, Math.PI * 2);
      game.ctx.arc(c.x + r * 1.5, c.y, r * 0.75, 0, Math.PI * 2);
      game.ctx.arc(c.x - r * 0.7, c.y + r * 0.1, r * 0.7, 0, Math.PI * 2);
      game.ctx.fill();
      game.ctx.restore();
    });
  }

  static renderParticles(game) {
    game.particles.forEach(p => {
      const alpha = p.alpha * (1 - p.life / p.maxLife);
      game.ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
      game.ctx.beginPath();
      game.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      game.ctx.fill();
    });
  }

  static renderSideView(game) {
    const roadTop = game.roadTop !== undefined ? game.roadTop : game.height * 0.55;

    if (game.assets.bgImg.complete && game.assets.bgImg.naturalWidth > 0) {
      game.ctx.drawImage(game.assets.bgImg, 0, 0, game.width, roadTop);
    } else {
      game.ctx.fillStyle = "#1e272e";
      game.ctx.fillRect(0, 0, game.width, roadTop);
    }

    this.renderClouds(game);

    game.buildings.forEach(b => {
      const img = game.assets.buildingImgs[b.imgIdx];
      if (img && img.complete && img.naturalWidth > 0) {
        const sw = img.naturalWidth / 4;
        const sh = img.naturalHeight;
        const aspect = sw / sh;
        const config = game.assets.buildingConfigs[b.imgIdx] || { heightScale: 1.0, widthScale: 1.0 };

        const h = (sh * 0.65) * b.scale * config.heightScale;
        const w = (h * aspect) * config.widthScale;

        b.width = w;
        b.height = h;

        game.ctx.drawImage(img, b.subIdx * sw, 0, sw, sh, b.x, roadTop - h, w, h);
      } else {
        game.ctx.fillStyle = "#34495e";
        game.ctx.fillRect(b.x, roadTop - b.height, b.width, b.height);
      }
    });

    const roadHeight = game.height - roadTop;
    if (game.assets.roadImg.complete && game.assets.roadImg.naturalWidth > 0) {
      const tileW = (game.assets.roadImg.naturalWidth / game.assets.roadImg.naturalHeight) * roadHeight;
      let startX = -(game.scrollOffset % tileW);
      if (startX > 0) startX -= tileW;

      // Se redondea X (Math.floor) y se da un pequeño solapamiento (+1.5px) para eliminar la raya vertical de corte entre baldosas
      for (let x = startX; x < game.width + tileW; x += tileW) {
        game.ctx.drawImage(game.assets.roadImg, Math.floor(x), roadTop, tileW + 1.5, roadHeight);
      }
    } else {
      game.ctx.fillStyle = "#2c3e50";
      game.ctx.fillRect(0, roadTop, game.width, roadHeight);
    }

    game.puddles.forEach(puddle => {
      if (puddle.x < -150 || puddle.x > game.width + 150) return;
      game.ctx.save();

      const puddleYWithOffset = puddle.y + game.BARRO_OFFSET_Y;

      if (game.assets.puddleImg.complete && game.assets.puddleImg.naturalWidth > 0) {
        game.ctx.globalAlpha = puddle.splashed ? 0.4 : 1.0;
        game.ctx.drawImage(game.assets.puddleImg, puddle.x, puddleYWithOffset - (puddle.height / 2), puddle.width, puddle.height);
        game.ctx.globalAlpha = 1.0;
      } else {
        game.ctx.fillStyle = puddle.splashed ? "rgba(92, 58, 33, 0.35)" : "#5c3a21";
        game.ctx.beginPath();
        game.ctx.ellipse(puddle.x + puddle.width * 0.5, puddleYWithOffset, puddle.width * 0.5, puddle.height * 0.4, 0, 0, Math.PI * 2);
        game.ctx.fill();

        if (!puddle.splashed) {
          game.ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          game.ctx.beginPath();
          game.ctx.ellipse(puddle.x + puddle.width * 0.4, puddleYWithOffset - 3, puddle.width * 0.22, puddle.height * 0.18, -0.2, 0, Math.PI * 2);
          game.ctx.fill();
        }
      }
      game.ctx.restore();
    });

    game.streetProps.forEach(p => {
      if (p.x < -100 || p.x > game.width + 100) return;

      const isOverlapWithStop = game.busStops.some(s => p.x >= (s.x - 30) && p.x <= (s.x + 650));
      if ((p.type === "farola" || p.type === "papelera") && isOverlapWithStop) return;

      if (p.type === "farola") {
        if (game.assets.farolaImg.complete && game.assets.farolaImg.naturalWidth > 0) {
          game.ctx.drawImage(game.assets.farolaImg, p.x, roadTop - p.height + 12, p.width, p.height);
        }
      } else if (p.type === "papelera") {
        if (game.assets.papeleraImg.complete && game.assets.papeleraImg.naturalWidth > 0) {
          game.ctx.drawImage(game.assets.papeleraImg, p.x, roadTop - p.height + 23, p.width, p.height);
        }
      } else if (p.type === "arbusto") {
        if (game.assets.bushImg.complete && game.assets.bushImg.naturalWidth > 0) {
          game.ctx.save();
          game.ctx.filter = `hue-rotate(${p.hueShift}deg) brightness(${p.brightness}%)`;
          game.ctx.drawImage(game.assets.bushImg, p.x, roadTop - p.height + 14, p.width, p.height);
          game.ctx.restore();
        }
      }
    });

    game.trafficLights.forEach(tl => {
      if (tl.x < -100 || tl.x > game.width + 100) return;

      const renderW = 75;
      const renderH = 205;
      const lightY = roadTop - renderH + 40;

      let frameIdx = tl.state === "RED" ? 0 : (tl.state === "YELLOW" ? 1 : 2);

      if (game.assets.trafficLightImg.complete && game.assets.trafficLightImg.naturalWidth !== 0) {
        const spriteW = game.assets.trafficLightImg.naturalWidth / 3;
        game.ctx.drawImage(
          game.assets.trafficLightImg,
          frameIdx * spriteW,
          0,
          spriteW,
          game.assets.trafficLightImg.naturalHeight,
          tl.x,
          lightY,
          renderW,
          renderH
        );

        game.ctx.save();
        let glowColor = "rgba(239, 68, 68, 0.45)";
        let lightCenterY = lightY + 18;

        if (tl.state === "YELLOW") {
          glowColor = "rgba(245, 158, 11, 0.45)";
          lightCenterY = lightY + 45;
        } else if (tl.state === "GREEN") {
          glowColor = "rgba(34, 197, 94, 0.45)";
          lightCenterY = lightY + 70;
        }

        const lightCenterX = tl.x + 37.5;
        const glowRadius = 42;

        const gradient = game.ctx.createRadialGradient(
          lightCenterX, lightCenterY, 4,
          lightCenterX, lightCenterY, glowRadius
        );
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        game.ctx.fillStyle = gradient;
        game.ctx.beginPath();
        game.ctx.arc(lightCenterX, lightCenterY, glowRadius, 0, Math.PI * 2);
        game.ctx.fill();
        game.ctx.restore();
      }
    });

    this.renderParticles(game);

    // ==========================================
    // RENDERIZADO Y MOVIMIENTO SUAVE Y NATURAL
    // ==========================================
    game.busStops.forEach(stop => {
      if (stop.x < -1200 || stop.x > game.width + 600) return;

      const stopW = 300;
      const stopH = 200;

      if (stop.name && game.assets.destinationImgs[stop.name]) {
        const destImg = game.assets.destinationImgs[stop.name];
        const destConfig = game.assets.destinationConfigs[stop.name] || { width: 320, height: 320, offsetY: 0 };

        const destW = destConfig.width;
        const destH = destConfig.height;
        const destX = stop.x + stopW;
        const destY = roadTop - destH + 18 + destConfig.offsetY;

        if (destImg.complete && destImg.naturalWidth > 0) {
          game.ctx.drawImage(destImg, destX, destY, destW, destH);
        }
      }

      if (game.assets.busStopImg.complete && game.assets.busStopImg.naturalWidth > 0) {
        game.ctx.drawImage(game.assets.busStopImg, stop.x, roadTop - stopH + 18, stopW, stopH);
      }

      if (stop.type === "PICKUP" && !stop.processed) {
        // CONDICIONES ESTRICTAS
        const isAtStop = game.isBusInStopZone(stop);
        const isBusStopped = Math.abs(game.bus.speed) <= 0.01;
        const canWalkTowardsBus = isAtStop && isBusStopped;

        stop.passengers.forEach((p, idx) => {
          if (p.walkOffset === undefined) {
            p.walkOffset = 0;
          }

          const baseStartX = stop.x + 35 + (idx * 55);
          
          // Posición objetivo a la izquierda de la puerta (-50 px)
          const doorTargetX = game.bus.x + (game.bus.width * 0.82) - 50 - (idx * 18);
          const currentPositionX = baseStartX + p.walkOffset;

          let isWalkingThisFrame = false;

          if (canWalkTowardsBus) {
            const distanceLeft = Math.abs(doorTargetX - currentPositionX);
            
            if (distanceLeft > 0.5) {
              isWalkingThisFrame = true;
              if (currentPositionX < doorTargetX) {
                p.walkOffset += Math.min(1.2, doorTargetX - currentPositionX);
              } else if (currentPositionX > doorTargetX) {
                p.walkOffset -= Math.min(1.2, currentPositionX - doorTargetX);
              }
            }
          }

          // Balanceo al caminar extremadamente suave (máximo 1.5px de elevación)
          let stepBobY = 0;
          if (isWalkingThisFrame) {
            stepBobY = -Math.abs(Math.sin(p.walkOffset * 0.08) * 1.5);
          }

          const finalRenderX = baseStartX + p.walkOffset;
          const pImg = game.assets.passengerImgs[p.destination];

          if (pImg && pImg.complete && pImg.naturalWidth > 0) {
            const passengerConfig = game.assets.passengerRenderConfig[p.id] || {
              offsetX: 0,
              offsetY: 0,
              width: 60,
              height: 70
            };

            game.ctx.drawImage(
              pImg,
              finalRenderX + passengerConfig.offsetX,
              roadTop - 62 + passengerConfig.offsetY + stepBobY,
              passengerConfig.width,
              passengerConfig.height
            );
          }
        });
      }

      if (stop.type === "DROPOFF" && stop.droppedPassengers && stop.droppedPassengers.length > 0) {
        stop.droppedPassengers.forEach((p, idx) => {
          const pImg = game.assets.passengerImgs[p.destination] || game.assets.passengerImgs[stop.name];
          const pX = stop.x + 35 + (idx * 55);

          if (pImg && pImg.complete && pImg.naturalWidth > 0) {
            const passengerConfig = game.assets.passengerRenderConfig[p.id] || {
              offsetX: 0,
              offsetY: 0,
              width: 60,
              height: 70
            };

            game.ctx.drawImage(
              pImg,
              pX + passengerConfig.offsetX,
              roadTop - 62 + passengerConfig.offsetY,
              passengerConfig.width,
              passengerConfig.height
            );
          }
        });
      }
    });

    game.obstacles.forEach(obs => {
      if (obs.x < -50 || obs.x > game.width + 50) return;
      if (game.assets.coneImg.complete && game.assets.coneImg.naturalWidth > 0) {
        game.ctx.drawImage(game.assets.coneImg, obs.x, obs.y - obs.height / 2, obs.width, obs.height);
      }
    });

    const renderables = [
      ...game.trafficCars.map(car => ({ type: 'car', y: car.y, data: car })),
      { type: 'bus', y: game.bus.y, data: game.bus }
    ];

    renderables.sort((a, b) => a.y - b.y);

    renderables.forEach(item => {
      if (item.type === 'car') {
        const car = item.data;
        if (car.x >= -200 && car.x <= game.width + 200) {
          GameTraffic.renderCar(game.ctx, car);
        }
      } else if (item.type === 'bus') {
        game.bus.render(game.ctx);
      }
    });
  }
}
