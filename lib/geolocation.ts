export type Coordinates = {
  lat: number;
  lng: number;
};

export const getCurrentLocation = (): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Este dispositivo não suporta localização."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        lat: Number(coords.latitude.toFixed(4)),
        lng: Number(coords.longitude.toFixed(4)),
      }),
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "Permita o acesso à localização nas definições do navegador."
          : error.code === error.TIMEOUT
            ? "A obtenção da localização demorou demasiado. Tente novamente."
            : "Não foi possível determinar a localização deste dispositivo.";
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

export const distanceKm = (from: Coordinates, to: Coordinates) => {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
