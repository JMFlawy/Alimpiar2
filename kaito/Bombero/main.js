import Game from "./engine/Game.js";

window.addEventListener("load", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    // Escalado según los píxeles reales de la pantalla (Retina / 4K / Mobile DPI)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }

  resizeCanvas();

  const game = new Game(canvas, ctx);

  window.addEventListener("resize", () => {
    resizeCanvas();
    game.resize(canvas.width, canvas.height);
  });

  game.start();
});