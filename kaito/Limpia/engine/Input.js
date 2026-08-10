export default class Input {

    static keys = {};

    static init() {

        window.addEventListener("keydown", e => {

            Input.keys[e.code] = true;

        });

        window.addEventListener("keyup", e => {

            Input.keys[e.code] = false;

        });
    }

    static down(key) {

        return !!Input.keys[key];

    }

    // NUEVO: limpiar todas las teclas pulsadas
    static reset() {

        for (const code in Input.keys) {
            Input.keys[code] = false;
        }
    }
}