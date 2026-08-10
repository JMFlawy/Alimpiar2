export default class TruckSequence {
  constructor(game) {
    this.game = game;
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

    this.truckVideo.addEventListener("ended", () => {
      this.game.truckVideoPlaying = false;
      this.game.truckVideoFinished = true;
      this.game.yellowVisible = true;
      this.game.truckLeaving = true;
    });
  }

  start() {
    if (this.game.truckSequenceStarted) return;
    this.game.truckSequenceStarted = true;

    const yellowContainer = this.game.containers.find(c => c.type === "amarillo");
    this.game.truckTargetX = yellowContainer ? yellowContainer.x - 60 : this.game.cameraX + this.game.width / 2;
    this.game.truckX = this.game.cameraX + this.game.width + 300;
    this.game.truckY = this.game.groundY;
    this.game.truckLeaving = false;
    this.game.truckStopTime = null;
    this.game.yellowVisible = true;

    this.game.circulandoSound.currentTime = 0;
    this.game.circulandoSound.play().catch(() => {});
  }

  update() {
    if (!this.game.truckSequenceStarted) return;

    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const speed = isMobile ? 1.8 : 1.8;

    if (!this.game.truckVideoPlaying && Math.random() < 0.4) {
      const img = this.truckBaseImage;
      const truckW = (img && img.complete && img.naturalWidth > 0) ? img.naturalWidth * 0.8 : 360;
      this.game.effects.spawnTruckSmoke(this.game.truckX + truckW - 35, this.game.groundY - 15);
    }

    if (!this.game.truckLeaving && !this.game.truckVideoPlaying && !this.game.truckVideoFinished) {
      if (this.game.truckX > this.game.truckTargetX) {
        this.game.truckX -= speed;
        if (this.game.truckX <= this.game.truckTargetX) {
          this.game.truckX = this.game.truckTargetX;
          this.game.truckStopTime = performance.now();
        }
        return;
      }

      if (this.game.truckStopTime !== null) {
        if (performance.now() - this.game.truckStopTime < 1000) return;

        this.game.truckVideoPlaying = true;
        this.game.yellowVisible = false;

        try {
          this.game.basuratSound.pause();
          this.game.basuratSound.currentTime = 0;
        } catch (e) {}

        this.truckVideo.currentTime = 0;
        this.truckVideo.play().catch(() => {
          this.game.truckVideoPlaying = false;
          this.game.truckVideoFinished = true;
          this.game.yellowVisible = true;
          this.game.truckLeaving = true;
        });
        return;
      }
    }

    if (this.game.truckLeaving) {
      this.game.truckX -= speed;
      if (this.game.truckX < this.game.cameraX - 400) {
        this.game.truckSequenceStarted = false;
        this.game.sequenceFinished = true;
        this.game.fadeToBlack = true;
        this.game.fadeAlpha = 0;
        this.game.circulandoSound.pause();
      }
    }
  }

  draw(ctx) {
    if (!this.game.truckSequenceStarted || this.game.truckVideoPlaying) return;

    const screenX = this.game.truckX - this.game.cameraX;
    const screenY = this.game.truckY;
    const scale = 0.8;
    const img = this.game.truckLeaving ? this.truckFrames[this.truckFrames.length - 1] : this.truckBaseImage;

    if (img.complete && img.naturalWidth > 0) {
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, screenX, screenY - h + 25, w, h);
    }
  }

  drawVideo(ctx, width, height) {
    if (this.game.truckVideoPlaying && this.truckVideo && this.truckVideo.readyState >= 2) {
      ctx.drawImage(this.truckVideo, 0, 0, width, height);
      return true;
    }
    return false;
  }
}
