export default class HUD {

    constructor(player) {

        this.player = player;

    }

    draw(ctx, canvas) {

        // Fondo HUD

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(15, 15, 360, 125);

        //-------------------------
        // VIDA
        //-------------------------

        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText("VIDA", 30, 42);

        ctx.fillStyle = "#222";
        ctx.fillRect(100, 25, 240, 22);

        ctx.fillStyle = "#2ecc71";
        ctx.fillRect(
            100,
            25,
            240 * (this.player.life / this.player.maxLife),
            22
        );

        //-------------------------
        // KI
        //-------------------------

        ctx.fillStyle = "white";
        ctx.fillText("KI", 30, 75);

        ctx.fillStyle = "#222";
        ctx.fillRect(100, 58, 240, 18);

        ctx.fillStyle = "#00bfff";
        ctx.fillRect(
            100,
            58,
            240 * (this.player.ki / this.player.maxKi),
            18
        );

        //-------------------------
        // INFORMACIÓN
        //-------------------------

        ctx.fillStyle = "white";
        ctx.font = "18px Arial";

        ctx.fillText(
            "Puntos : " + this.player.score,
            30,
            105
        );

        ctx.fillText(
            "Nivel : " + this.player.level,
            200,
            105
        );

    }

}