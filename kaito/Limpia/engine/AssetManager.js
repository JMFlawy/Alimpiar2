export default class AssetManager {

    static images = {};

    static loadImage(name, src) {

        return new Promise((resolve, reject) => {

            const img = new Image();

            img.onload = () => {
                this.images[name] = img;
                resolve();
            };

            img.onerror = () => {
                console.error("No se pudo cargar:", src);
                reject(src);
            };

            img.src = src;

        });

    }

    static get(name) {

        return this.images[name];

    }

    static async loadAssets() {

        await Promise.all([

            // HERO
            this.loadImage("idle","./assets/hero/idle.png"),
            this.loadImage("walk","./assets/hero/walk.png"),
            this.loadImage("jump","./assets/hero/jump.png"),
            this.loadImage("punch","./assets/hero/punch.png"),
            this.loadImage("kick","./assets/hero/kick.png"),
            this.loadImage("ki","./assets/hero/ki.png"),

            // BIO
            this.loadImage("bioIdle","./assets/enemies/bio/idle.png"),
            this.loadImage("bioWalk","./assets/enemies/bio/walk.png"),
            this.loadImage("bioAttack","./assets/enemies/bio/attack.png"),
            this.loadImage("bioHurt","./assets/enemies/bio/hurt.png"),
            this.loadImage("bioDie","./assets/enemies/bio/die.png"),

            // BACKGROUNDS
            this.loadImage("background1","./assets/backgrounds/level1.jpg"),
            this.loadImage("background2","./assets/backgrounds/2.jpg"),
            this.loadImage("background3","./assets/backgrounds/3.jpg"),
            this.loadImage("background4","./assets/backgrounds/4.jpg"),
            this.loadImage("background5","./assets/backgrounds/5.jpg"),

 		// PLATFORMS
       		 this.loadImage("platform","./assets/platform/platform.png"),

		// DRAGON BALLS
       		 this.loadImage("dragonball","./assets/balls/dragonball.jpg"),

            // EFFECTS
            this.loadImage("explosion","./assets/effects/explosion.png"),
            this.loadImage("kiBlast","./assets/effects/ki_blast.png")

        ]);

    }

}