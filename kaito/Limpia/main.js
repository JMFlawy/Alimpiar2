import Game from "./engine/Game.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Música
const music = new Audio("assets/audio/musica1.mp3");
music.loop = true;
music.volume = 0.6;

// Tamaño lógico del juego
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 450;

let game = null;

// Ajuste del canvas
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  const scale = Math.min(
    vw / GAME_WIDTH,
    vh / GAME_HEIGHT
  );

  const displayWidth = Math.floor(GAME_WIDTH * scale);
  const displayHeight = Math.floor(GAME_HEIGHT * scale);

  canvas.width = Math.floor(displayWidth * dpr);
  canvas.height = Math.floor(displayHeight * dpr);

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  ctx.setTransform(
    dpr * scale,
    0,
    0,
    dpr * scale,
    0,
    0
  );
}

// Inicialización
function init() {

  resizeCanvas();

  game = new Game(
    canvas,
    ctx,
    GAME_WIDTH,
    GAME_HEIGHT
  );

  game.start();

const tryPlayMusic = () => {

    if (!music.paused) return;

    music.play().catch(err => console.log(err));

};

window.addEventListener("pointerdown", tryPlayMusic, { passive: true });
window.addEventListener("keydown", tryPlayMusic);
}
window.addEventListener("resize", resizeCanvas);

init();
