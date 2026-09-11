import Game from "./engine/Game.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;

// Ajuste dinámico de resolución interna para pantallas retina / móviles
function resizeCanvas() {
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Inicializar el juego
const game = new Game(canvas, ctx, GAME_WIDTH, GAME_HEIGHT);
game.start();