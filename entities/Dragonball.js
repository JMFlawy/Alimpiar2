import AssetManager from "../engine/AssetManager.js";

export default class DragonBall {

    constructor(x, y, index = 0) {

        this.x = x;
        this.y = y;

        this.size = 24;
        this.index = index;
        this.collected = false;
    }

    getHitbox() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        };
    }

    collect(player) {

        if (this.collected) return;

        this.collected = true;

        if (player && typeof player.addDragonBall === "function") {
            player.addDragonBall();
        }
    }

    draw(ctx) {

        if (this.collected) return;

        const img = AssetManager.get("dragonball");
        if (!img) return;

        const columns = 7;
        const frameWidth = img.width / columns;
        const frameHeight = img.height;

        const sx = this.index * frameWidth;
        const sy = 0;
        const sw = frameWidth;
        const sh = frameHeight;

        const aspect = sw / sh;
        const drawWidth = this.size;
        const drawHeight = this.size / aspect;

        const dx = this.x - drawWidth / 2;
        const dy = this.y - drawHeight / 2;

        ctx.drawImage(
            img,
            sx, sy, sw, sh,
            dx, dy,
            drawWidth, drawHeight
        );
    }
}