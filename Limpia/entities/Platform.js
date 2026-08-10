import AssetManager from "../engine/AssetManager.js";

export default class Platform {

    constructor(x, y, width, height) {

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    draw(ctx) {

        const img = AssetManager.get("platform");

        if (!img) {
            ctx.fillStyle = "#654321";
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }
}