export default class GameTraffic {
  static updateCarAI(game, car) {
    if (car.isChangingLane) {
      const dtFactor = game.dtFactor || 1;
      car.laneProgress += 0.025 * dtFactor;

      if (car.laneProgress >= 1.0) {
        car.laneProgress = 1.0;
        car.y = car.targetY;
        car.isChangingLane = false;
      } else {
        const t = car.laneProgress;
        const smoothFactor = t * t * (3 - 2 * t);
        car.y = car.startY + (car.targetY - car.startY) * smoothFactor;
      }
    }

    const carFront = car.x + car.width;
    let obstacleAhead = null;
    let minDistance = 300;

    game.obstacles.forEach(obs => {
      if (Math.abs(obs.y - car.y) < 35 && obs.x > carFront) {
        const dist = obs.x - carFront;
        if (dist < minDistance) {
          minDistance = dist;
          obstacleAhead = { x: obs.x, speed: 0, isRedLight: false };
        }
      }
    });

    game.trafficLights.forEach(tl => {
      if (tl.state === "RED" && tl.x > car.x) {
        const dist = tl.x - carFront;
        if (dist < minDistance && dist > -20) {
          minDistance = dist;
          obstacleAhead = { x: tl.x, speed: 0, isRedLight: true };
        }
      }
    });

    if (Math.abs(game.bus.y - car.y) < 35 && game.bus.x > carFront) {
      const dist = game.bus.x - carFront;
      if (dist < minDistance) {
        minDistance = dist;
        obstacleAhead = { x: game.bus.x, speed: Math.max(0, game.bus.speed), isRedLight: false };
      }
    }

    game.trafficCars.forEach(other => {
      if (other !== car && Math.abs(other.y - car.y) < 35 && other.x > carFront) {
        const dist = other.x - carFront;
        if (dist < minDistance) {
          minDistance = dist;
          obstacleAhead = { x: other.x, speed: Math.max(0, other.speed), isRedLight: false };
        }
      }
    });

    if (car.isChangingLane) return;

    if (obstacleAhead && minDistance < 180) {
      let chosenLane = null;

      if (!obstacleAhead.isRedLight) {
        let possibleLanes = [];
        if (car.currentLane > 0) possibleLanes.push(car.currentLane - 1);
        if (car.currentLane < game.lanes.length - 1) possibleLanes.push(car.currentLane + 1);

        for (let l of possibleLanes) {
          let laneY = game.lanes[l];
          let laneClear = true;

          if (Math.abs(game.bus.y - laneY) < 35 && (car.x + car.width > game.bus.x - 30 && car.x < game.bus.x + game.bus.width + 30)) {
            laneClear = false;
          }

          game.obstacles.forEach(o => { 
            if (Math.abs(o.y - laneY) < 35 && (car.x + car.width > o.x - 30 && car.x < o.x + o.width + 30)) {
              laneClear = false; 
            }
          });

          game.trafficCars.forEach(o => { 
            if (o !== car) {
              const carY = o.targetY !== undefined ? o.targetY : o.y;
              if (Math.abs(carY - laneY) < 35 && (car.x + car.width > o.x - 50 && car.x < o.x + o.width + 50)) {
                laneClear = false; 
              }
            }
          });

          if (laneClear) {
            chosenLane = l;
            break;
          }
        }
      }

      if (chosenLane !== null) {
        car.currentLane = chosenLane;
        car.startY = car.y;
        car.targetY = game.lanes[chosenLane];
        car.laneProgress = 0.0;
        car.isChangingLane = true;
      } else {
        if (minDistance <= 15) {
          car.speed = 0;
        } else {
          car.speed = Math.max(obstacleAhead.speed, car.speed - 0.15);
        }
      }
    } else {
      if (car.speed < car.maxSpeed) {
        car.speed = Math.min(car.speed + 0.08, car.maxSpeed);
      }
    }
  }

  static spawnBusStop(game) {
    const candidateX = game.width + 160;
    const tooCloseToTL = game.trafficLights.some(tl => Math.abs(tl.x - candidateX) < 700);
    if (tooCloseToTL) return; 

    game.distanceSinceLastStop = 0;
    game.nextStopTargetDistance = game.getNewStopDistance();

    const availablePassengers = game.passengersPool.filter(p => p.state === "AVAILABLE");
    const busDestinations = [...new Set(game.bus.passengers.map(p => p.destination))];

    const pendingTotal = game.passengersPool.filter(p => p.state !== "DELIVERED").length;
    if (pendingTotal === 0) return;

    let shouldDropoff = false;
    if (busDestinations.length > 0 && availablePassengers.length > 0) {
      shouldDropoff = Math.random() < 0.5; 
    } else if (busDestinations.length > 0) {
      shouldDropoff = true;
    } else if (availablePassengers.length > 0) {
      shouldDropoff = false;
    } else {
      return; 
    }

    if (shouldDropoff) {
      let validDests = busDestinations.filter(d => d !== game.lastDestination);

      const targetName = validDests.length > 0 
        ? validDests[Math.floor(Math.random() * validDests.length)]
        : busDestinations[Math.floor(Math.random() * busDestinations.length)];

      game.lastDestination = targetName;

      game.busStops.push({
        x: candidateX,
        type: "DROPOFF",
        name: targetName,
        droppedPassengers: [],
        width: 130,
        processed: false
      });

      if (game.soundParada) {
        game.soundParada.currentTime = 0;
        game.soundParada.play().catch(() => {});
      }
    } else {
      const passengersToSpawn = game.getAvailablePassengers(1);

      if (passengersToSpawn.length > 0) {
        game.busStops.push({
          x: candidateX,
          type: "PICKUP",
          passengers: passengersToSpawn,
          width: 300,
          processed: false
        });
      }
    }
  }

  static generateTrafficOrObstacle(game) {
    const activeCars = game.trafficCars.length;
    const spawnX = game.width + 100;
    const scale = (game.bus && game.bus.scale) ? game.bus.scale : 1;

    const isLaneClearForSpawn = (laneIdx, minMargin = 380) => {
      const laneY = game.lanes[laneIdx];
      const carConflict = game.trafficCars.some(c => Math.abs(c.y - laneY) < 30 && Math.abs(c.x - spawnX) < minMargin);
      const obsConflict = game.obstacles.some(o => Math.abs(o.y - laneY) < 30 && Math.abs(o.x - spawnX) < minMargin);
      const tlConflict = game.trafficLights.some(tl => Math.abs(tl.x - spawnX) < 400);

      let stopConflict = false;
      if (laneIdx === 0) {
        stopConflict = game.busStops.some(bs => (spawnX >= (bs.x - 180) && spawnX <= (bs.x + bs.width + 180)));
      }

      return !carConflict && !obsConflict && !tlConflict && !stopConflict;
    };

    if (activeCars < 2) {
      const rand = Math.random();

      if (activeCars === 0 || rand < 0.65) {
        const freeLanes = [0, 1, 2].filter(l => isLaneClearForSpawn(l));

        if (freeLanes.length > 0) {
          const laneIdx = freeLanes[Math.floor(Math.random() * freeLanes.length)];
          const targetSpeed = 0.8 + Math.random() * 0.8;

          const activeSrcs = game.trafficCars.map(c => c.img && c.img.src).filter(Boolean);
          const availableImages = game.assets.carImages.filter(img => !activeSrcs.includes(img.src));

          if (availableImages.length > 0) {
            const randomImg = availableImages[Math.floor(Math.random() * availableImages.length)];
            const isCochet = randomImg.src && randomImg.src.includes("cochet");

            const carW = (isCochet ? 240 : 180) * scale;
            const carH = (isCochet ? 110 : 100) * scale;

            const initialY = game.lanes[laneIdx];

            game.trafficCars.push({
              x: spawnX,
              y: initialY,
              startY: initialY,
              targetY: initialY,
              currentLane: laneIdx,
              width: carW,
              height: carH,
              speed: targetSpeed,
              maxSpeed: targetSpeed,
              img: randomImg,
              isCochet: isCochet,
              isChangingLane: false,
              laneProgress: 1.0
            });
            return;
          }
        }
      }
    }

    const rand = Math.random();
    if (rand < 0.30) {
      const lastTL = game.trafficLights[game.trafficLights.length - 1];
      const tooCloseToBusStop = game.busStops.some(bs => spawnX >= (bs.x - 150) && spawnX <= (bs.x + 700));

      if (!tooCloseToBusStop && (!lastTL || (spawnX - lastTL.x > 850))) {
        game.trafficLights.push({
          x: spawnX,
          state: "RED",
          timer: 0
        });
      }
    } else if (rand < 0.55) {
      const spawnXPos = game.width + 120;
      const minDistanceBetweenCones = 400;
      const tooCloseToOtherObstacle = game.obstacles.some(o => Math.abs(o.x - spawnXPos) < minDistanceBetweenCones);
      const isStopInZone = game.busStops.some(bs => spawnXPos >= (bs.x - 100) && spawnXPos <= (bs.x + bs.width + 100));

      if (!tooCloseToOtherObstacle && !isStopInZone) {
        const freeLanes = [0, 1, 2].filter(l => isLaneClearForSpawn(l, 300));

        if (freeLanes.length > 0) {
          const laneIdx = freeLanes[Math.floor(Math.random() * freeLanes.length)];

          let offsetY = 0;
          if (laneIdx === 0) {
            offsetY = 10;
          }
          if (laneIdx === 2) {
            offsetY = 25;
          }

          game.obstacles.push({ 
            x: spawnXPos, 
            y: game.lanes[laneIdx] + offsetY * scale, 
            width: 32 * scale, 
            height: 36 * scale,
            laneIdx: laneIdx,
            offsetY: offsetY * scale
          });
        }
      }
    } else if (rand < 0.85) {
      const spawnXPos = game.width + 120;
      const freeLanes = [0, 1, 2].filter(l => isLaneClearForSpawn(l, 300));

      if (freeLanes.length > 0) {
        const laneIdx = freeLanes[Math.floor(Math.random() * freeLanes.length)];
        game.puddles.push({
          x: spawnXPos,
          y: game.lanes[laneIdx],
          width: 110 * scale,
          height: 40 * scale,
          splashed: false,
          laneIdx: laneIdx
        });
      }
    }
  }

  static renderCar(ctx, car) {
    const renderY = car.y - car.height * 0.5;

    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(car.x + car.width * 0.5, car.y + (car.height * 0.28), car.width * 0.42, Math.max(2, car.height * 0.1), 0, 0, Math.PI * 2);
    ctx.fill();

    if (car.img && car.img.complete && car.img.naturalWidth > 0) {
      ctx.drawImage(car.img, car.x, renderY, car.width, car.height);
    } else {
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(car.x, renderY, car.width, car.height);
    }

    if (car.isCochet) {
      const config = {
        rearWheelXRatio: 0.145,  
        frontWheelXRatio: 0.692, 
        wheelYRatio: 0.765,      
        radiusRatio: 0.189,      
        spokeCount: 10           
      };

      const wheelRadius = car.height * config.radiusRatio;
      const wheelY = renderY + (car.height * config.wheelYRatio);
      const rearX = car.x + (car.width * config.rearWheelXRatio);
      const frontX = car.x + (car.width * config.frontWheelXRatio);

      const angle = (car.x * 0.08) % (Math.PI * 2);

      const drawWheel = (wx, wy) => {
        ctx.save();
        ctx.translate(wx, wy);

        ctx.fillStyle = "#1c1d21";
        ctx.beginPath();
        ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#111215";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const rimRadius = wheelRadius * 0.72;
        ctx.fillStyle = "#33373b";
        ctx.beginPath();
        ctx.arc(0, 0, rimRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(angle);

        ctx.fillStyle = "#5d636b";
        ctx.strokeStyle = "#25282b";
        ctx.lineWidth = 1;

        for (let i = 0; i < config.spokeCount; i++) {
          const spokeAngle = (i * (2 * Math.PI)) / config.spokeCount;
          ctx.save();
          ctx.rotate(spokeAngle);

          ctx.beginPath();
          ctx.moveTo(rimRadius * 0.2, 0);
          ctx.lineTo(rimRadius, -rimRadius * 0.18);
          ctx.lineTo(rimRadius, rimRadius * 0.12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }

        ctx.fillStyle = "#1e2124";
        ctx.beginPath();
        ctx.arc(0, 0, rimRadius * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#484f56";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      };

      drawWheel(rearX, wheelY);
      drawWheel(frontX, wheelY);
    }
  }
}
