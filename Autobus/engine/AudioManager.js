export default class AudioManager {
    constructor() {
        this.isUnlocked = false; // Estado para saber si el navegador permite audio

        this.sounds = {
            atras: new Audio("sounds/atras.mp3"),
            barro: new Audio("sounds/barro.mp3"),
            limpia: new Audio("sounds/limpia.mp3"),
            marcha: new Audio("sounds/marcha.mp3"),
            musica: new Audio("sounds/musica.mp3"),
            parada: new Audio("sounds/parada.mp3"),
            tarjeta: new Audio("sounds/tarjeta.mp3"),
            saludo1: new Audio("sounds/saludo1.mp3"),
            saludo2: new Audio("sounds/saludo2.mp3"),
            saludo3: new Audio("sounds/saludo3.mp3"),
            saludo4: new Audio("sounds/saludo4.mp3"),
            saludo5: new Audio("sounds/saludo5.mp3"),
            saludo6: new Audio("sounds/saludo6.mp3"),
            puertas1: new Audio("sounds/puertas1.mp3"),
            puertas2: new Audio("sounds/puertas2.mp3"),
            terminado: new Audio("sounds/terminado.wav")
        };

        // Configuración de bucles (loop)
        this.sounds.marcha.loop = true;
        this.sounds.musica.loop = true;
        this.sounds.atras.loop = true;

        // Ajuste de volúmenes por defecto
        this.sounds.marcha.volume = 0.5;
        this.sounds.musica.volume = 0.35;
        this.sounds.atras.volume = 0.6;
        this.sounds.barro.volume = 0.8;
        this.sounds.limpia.volume = 0.7;
        this.sounds.parada.volume = 0.8;
        this.sounds.puertas1.volume = 0.7;
        this.sounds.puertas2.volume = 0.7;
        this.sounds.terminado.volume = 0.8;

        // Escuchar la primera interacción del usuario para desbloquear el audio del navegador
        this._setupAutoplayUnlock();
    }

    /**
     * Listener automático para desarmar el bloqueo de autoplay del navegador.
     */
    _setupAutoplayUnlock() {
        const unlock = () => {
            this.unlockAudio();
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };

        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        window.addEventListener('touchstart', unlock);
    }

    /**
     * Intenta reproducir y pausar un audio brevemente para activar el contexto de sonido.
     */
    unlockAudio() {
        if (this.isUnlocked) return;

        // Usamos el sonido de música para desbloquear la sesión de audio
        const silentPromise = this.sounds.musica.play();
        if (silentPromise !== undefined) {
            silentPromise.then(() => {
                // Si la reproducción inicial funcionó, pausamos si aún no debe sonar
                // o dejamos la música encendida si ya empezó el juego
                this.isUnlocked = true;
            }).catch(() => {
                // Sigue bloqueado hasta el siguiente clic
            });
        }
    }

    /**
     * Reproduce un sonido de efecto desde el principio.
     */
    play(soundName) {
        const sound = this.sounds[soundName];
        if (!sound) return;

        sound.currentTime = 0;
        sound.play().catch(err => {
            console.warn(`No se pudo reproducir ${soundName}:`, err.message);
        });
    }

    /**
     * Inicia un sonido en bucle si no se está reproduciendo ya.
     */
    playLoop(soundName) {
        const sound = this.sounds[soundName];
        if (sound && sound.paused) {
            sound.play().catch(err => {
                console.warn(`No se pudo reproducir en bucle ${soundName}:`, err.message);
            });
        }
    }

    /**
     * Detiene la reproducción de un sonido y lo reinicia.
     */
    stop(soundName) {
        const sound = this.sounds[soundName];
        if (sound && !sound.paused) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    /**
     * Detiene TODOS los sonidos activos a la vez.
     */
    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }

    /**
     * Reduce el volumen de la música para la finalización del juego.
     */
    setSoftMusicVolume() {
        if (this.sounds.musica) {
            this.sounds.musica.volume = 0.15;
        }
    }

    /**
     * Reproduce el saludo del pasajero correspondiente y, justo al terminar,
     * reproduce el sonido de validación de la tarjeta (tarjeta.mp3).
     */
    playPassengerGreeting(passengerId, onComplete = null) {
        const greetingKey = `saludo${passengerId}`;
        const greetingAudio = this.sounds[greetingKey];

        if (!greetingAudio) {
            this.play("tarjeta");
            if (onComplete) onComplete();
            return;
        }

        const handleEnded = () => {
            greetingAudio.removeEventListener("ended", handleEnded);
            this.play("tarjeta");
            if (onComplete) onComplete();
        };

        greetingAudio.addEventListener("ended", handleEnded);
        greetingAudio.currentTime = 0;
        greetingAudio.play().catch(() => {
            this.play("tarjeta");
            if (onComplete) onComplete();
        });
    }
}