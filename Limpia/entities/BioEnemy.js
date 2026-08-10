import AssetManager from "../engine/AssetManager.js";

export class BioEnemy {

    constructor(x, y) {

        this.x = x;
        this.y = 440; // mismo suelo base que el player

        this.width = 80;
        this.height = 120;

        this.vx = 0;
        this.vy = 0;

        this.speed = 2;
        this.gravity = 0.6;

        this.onGround = false;

        this.flip = false;

        this.state = "idle";
        this.frame = 0;
        this.frameTimer = 0;

        this.life = 100;
        this.maxLife = 100;
        this.dead = false;
        this.remove = false;

        this.attackCooldown = 0;
        this.attackDuration = 0;
        this.isAttacking = false;

        this.animations = {
            idle:   { image: "bioIdle",   frames: 4, fps: 8,  scale: 1 },
            walk:   { image: "bioWalk",   frames: 6, fps: 10, scale: 1 },
            attack: { image: "bioAttack", frames: 6, fps: 12, scale: 1 },
            hurt:   { image: "bioHurt",   frames: 3, fps: 10, scale: 1 },
            die:    { image: "bioDie",    frames: 6, fps: 10, scale: 1 }
        };

        this.attackFrames = [
            { sx: 0,   sw: 180 },
            { sx: 190, sw: 185 },
            { sx: 380, sw: 190 },
            { sx: 580, sw: 210 },
            { sx: 800, sw: 210 },
            { sx: 1020, sw: 140 }
        ];

        this.hitbox = {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        };
    }

    setState(newState) {

        if (this.state === newState) return;

        this.state = newState;
        this.frame = 0;
        this.frameTimer = 0;

        if (newState === "attack") {
            this.isAttacking = true;
            this.attackDuration = 0;
        }

        if (newState === "hurt") {
            this.isAttacking = false;
        }

        if (newState === "die") {
            this.isAttacking = false;
            this.dead = true;
        }
    }

    update(deltaTime, player) {

        if (this.remove) return;

        if (this.dead) {
            this.updateAnimation(deltaTime);
            if (this.state !== "die") {
                this.setState("die");
            }
            if (this.frame >= this.animations.die.frames - 1) {
                this.remove = true;
            }
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        this.updateAI(deltaTime, player);
        this.applyPhysics();
        this.updateHitbox();
        this.updateAnimation(deltaTime);
    }

    updateAI(deltaTime, player) {

        if (!player) {
            this.vx = 0;
            if (this.state !== "idle") {
                this.setState("idle");
            }
            return;
        }

        const dx = player.x - this.x;
        const distance = Math.abs(dx);

        this.flip = dx < 0;

        if (this.isAttacking) {
            this.attackDuration += deltaTime;
            if (this.attackDuration > 0.5) {
                this.isAttacking = false;
            }
            return;
        }

        const attackRange = 120;
        const stopDistance = 60;
        const walkRange = 300;

        if (distance < attackRange && this.attackCooldown <= 0) {

            if (distance > stopDistance) {
                this.vx = dx > 0 ? this.speed : -this.speed;
                if (this.state !== "walk") {
                    this.setState("walk");
                }
            } else {
                this.vx = 0;
                if (this.state !== "attack") {
                    this.setState("attack");
                }
            }

            this.attackCooldown = 1.2;

        } else if (distance < walkRange && distance > stopDistance) {

            this.vx = dx > 0 ? this.speed : -this.speed;

            if (this.state !== "walk") {
                this.setState("walk");
            }

        } else {

            this.vx = 0;

            if (this.state !== "idle") {
                this.setState("idle");
            }
        }
    }

    applyPhysics() {

        this.vy += this.gravity;

        this.x += this.vx;
        this.y += this.vy;

        const GROUND_Y = 440;

        if (this.y >= GROUND_Y) {

            this.y = GROUND_Y;
            this.vy = 0;
            this.onGround = true;

        } else {

            this.onGround = false;
        }
    }

    updateHitbox() {

        this.hitbox.x = this.x;
        this.hitbox.y = this.y;
        this.hitbox.w = this.width;
        this.hitbox.h = this.height;
    }

    updateAnimation(deltaTime) {

        const anim = this.animations[this.state];

        if (!anim) return;

        const fps = anim.fps || 10;
        const frameInterval = 1 / fps;

        this.frameTimer += deltaTime;

        if (this.frameTimer >= frameInterval) {

            this.frameTimer -= frameInterval;
            this.frame++;

            if (this.state === "attack") {

                if (this.frame >= this.attackFrames.length) {
                    this.frame = 0;
                    this.isAttacking = false;
                    this.setState("idle");
                }

            } else if (this.state === "hurt") {

                if (this.frame >= anim.frames) {
                    this.frame = anim.frames - 1;
                }

            } else if (this.state === "die") {

                if (this.frame >= anim.frames) {
                    this.frame = anim.frames - 1;
                }

            } else {

                if (this.frame >= anim.frames) {
                    this.frame = 0;
                }
            }
        }
    }

    damage(amount) {

        if (this.dead || this.remove) return;

        this.life -= amount;

        if (this.life <= 0) {
            this.life = 0;
            this.setState("die");
        } else {
            this.setState("hurt");
        }
    }

    draw(ctx) {

        if (this.remove) return;

        const anim = this.animations[this.state];
        const img = AssetManager.get(anim.image);

        if (!img) return;

        let sx;
        let sw;

        if (this.state === "attack") {

            const frame = this.attackFrames[
                Math.min(this.frame, this.attackFrames.length - 1)
            ];

            sx = frame.sx;
            sw = frame.sw;

        } else {

            sw = img.width / anim.frames;
            sx = this.frame * sw;
        }

        const sh = img.height;

        const w = this.width * anim.scale;
        const h = this.height * anim.scale;

        const drawY = this.y - 16;

        ctx.save();

        if (this.flip) {

            ctx.translate(this.x + w, drawY);
            ctx.scale(-1, 1);

            ctx.drawImage(
                img,
                sx,
                0,
                sw,
                sh,
                0,
                0,
                w,
                h
            );

        } else {

            ctx.drawImage(
                img,
                sx,
                0,
                sw,
                sh,
                this.x,
                drawY,
                w,
                h
            );
        }

        ctx.restore();

        if (!this.dead) {

            ctx.fillStyle = "#222";
            ctx.fillRect(this.x, drawY - 12, this.width, 6);

            ctx.fillStyle = "#ff4040";
            ctx.fillRect(
                this.x,
                drawY - 12,
                this.width * (this.life / this.maxLife),
                6
            );
        }
    }
}