// src/entities/Trash.js

const TRASH_SPRITES = {
  amarillo: {
    file: "assets/basura/amarillo9.png",
    cols: 7   // solo 7 objetos dentro de la tira
  },
  azul: {
    file: "assets/basura/azul6.png",
    cols: 6
  },
  marron: {
    file: "assets/basura/marron6.png",
    cols: 6
  },
  restos: {
    file: "assets/basura/restos9.png",
    cols: 9
  },
  verde: {
    file: "assets/basura/verde6.png",
    cols: 6
  }
};

export default class Trash {
  constructor(x, y, type, category = "restos") {
    this.x = x;
    this.y = y;

    this.type = type;
    this.category = category;

    this.collected = false;

    // Tamaño en pantalla
    this.width = 40;
    this.height = 40;

    this.cfg = TRASH_SPRITES[this.category] || TRASH_SPRITES["restos"];

    this.image = new Image();
    this.image.src = this.cfg.file;

    // Índice de sprite dentro de la fila (0 .. cols-1)
    this.spriteIndex = Math.floor(Math.random() * this.cfg.cols);
  }

  draw(ctx, cameraX) {
    if (this.collected) return;

    const screenX = this.x - cameraX;
    const screenY = this.y;

    // Fallback si la imagen aún no ha cargado
    if (!this.image.complete || this.image.naturalWidth === 0) {
      ctx.fillStyle = "#ff6666";
      ctx.fillRect(screenX, screenY, this.width, this.height);
      return;
    }

    const fullW = this.image.naturalWidth;
    const fullH = this.image.naturalHeight;
    const cols = this.cfg.cols;

    // Dividimos la tira en bloques iguales
    const spriteW = fullW / cols;
    const spriteH = fullH;

    const sx = this.spriteIndex * spriteW;
    const sy = 0;

    // Dibujamos el sprite recortado y reescalado
    ctx.drawImage(
      this.image,
      sx,
      sy,
      spriteW,
      spriteH,
      screenX,
      screenY,
      this.width,
      this.height
    );
  }
}