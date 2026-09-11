export default class GameAssets {
  constructor() {
    // Cartel "falta.png" cargado desde la carpeta assets
    this.faltaImg = new Image();
    this.faltaImg.src = "assets/falta.png";

    // Vista interior del autobús
    this.interiorImg = new Image();
    this.interiorImg.src = "assets/interior.png";
    this.interiorlImg = new Image();
    this.interiorlImg.src = "assets/interiorl.png";

    // 5 Destinos/Paradas en total
    this.stopNames = ["Supermercado", "Centro comercial", "Gimnasio", "Parque", "Aeropuerto"];
    
    this.passengerRenderConfig = {
      1: { offsetX: 0, offsetY: -70, width: 120, height: 160 },
      2: { offsetX: 0, offsetY: -70, width: 100, height: 160 },
      3: { offsetX: 0, offsetY: -70, width: 120, height: 160 },
      4: { offsetX: 0, offsetY: 5, width: 75, height: 85 },
      5: { offsetX: 0, offsetY: -70, width: 110, height: 160 }
    };

    this.passengerImgs = {
      "Supermercado": new Image(),
      "Centro comercial": new Image(),
      "Gimnasio": new Image(),
      "Parque": new Image(),
      "Aeropuerto": new Image()
    };
    this.passengerImgs["Supermercado"].src = "assets/pasajeros1.png";
    this.passengerImgs["Centro comercial"].src = "assets/pasajeros2.png";
    this.passengerImgs["Gimnasio"].src = "assets/pasajeros3.png";
    this.passengerImgs["Parque"].src = "assets/pasajeros4.png";
    this.passengerImgs["Aeropuerto"].src = "assets/pasajeros5.png";

    this.carSources = [
      "assets/coche1.png",
      "assets/coche2.png",
      "assets/coche3.png",
      "assets/coche4.png",
      "assets/cochet.png"
    ];
    this.carImages = this.carSources.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });

    this.trafficLightImg = new Image();
    this.trafficLightImg.src = "assets/semaforos.png";

    this.busStopImg = new Image();
    this.busStopImg.src = "assets/parada.png";

    this.coneImg = new Image();
    this.coneImg.src = "assets/cono.png";

    this.puddleImg = new Image();
    this.puddleImg.src = "assets/barro.png";

    this.farolaImg = new Image();
    this.farolaImg.src = "assets/farola.png";

    this.papeleraImg = new Image();
    this.papeleraImg.src = "assets/papelera.png";

    this.bushImg = new Image();
    this.bushImg.src = "assets/arbusto.png";

    this.destinationImgs = {
      "Gimnasio": new Image(),
      "Parque": new Image(),
      "Centro comercial": new Image(),
      "Supermercado": new Image(),
      "Aeropuerto": new Image()
    };
    this.destinationImgs["Gimnasio"].src = "assets/gimnasio.png";
    this.destinationImgs["Parque"].src = "assets/parque.png";
    this.destinationImgs["Centro comercial"].src = "assets/comercial.png";
    this.destinationImgs["Supermercado"].src = "assets/supermercado.png";
    this.destinationImgs["Aeropuerto"].src = "assets/aeropuerto.png";

    this.destinationConfigs = {
      "Gimnasio": { width: 430, height: 390, offsetY: 0 },
      "Parque": { width: 425, height: 285, offsetY: 7 },
      "Centro comercial": { width: 520, height: 400, offsetY: 0 },
      "Supermercado": { width: 410, height: 320, offsetY: 5 },
      "Aeropuerto": { width: 500, height: 380, offsetY: -6 }
    };

    this.roadImg = new Image();
    this.roadImg.src = "assets/carretera1.png";

    this.bgImg = new Image();
    this.bgImg.src = "assets/fondo2.png";

    this.buildingSources = [
      "assets/edificios1.png",
      "assets/edificios2.png",
      "assets/edificios3.png"
    ];
    this.buildingImgs = this.buildingSources.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });

    this.buildingConfigs = [
      { heightScale: 1.0, widthScale: 1.0 },
      { heightScale: 1.25, widthScale: 0.9 },
      { heightScale: 0.85, widthScale: 1.1 }
    ];

    this.buildings = this.buildingImgs;
    this.images = this.buildingImgs;
  }
}