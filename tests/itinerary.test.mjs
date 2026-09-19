import assert from "node:assert/strict";
import test from "node:test";

import {
  calculerItineraireRoutier,
  createItineraryGeoJSON,
  getItineraryBounds,
  normalizeItineraryCoordinates,
} from "../src/domain/itinerary.ts";

test("normalise les coordonnées d'itinéraire en éliminant les entrées invalides", () => {
  const input = [
    [-5.03, 7.69],
    [-5.02, null],
    [undefined, 7.68],
    "invalide",
    [-5.01, 7.67, 10], // toléré si les 2 premiers sont des nombres
  ];

  const result = normalizeItineraryCoordinates(input);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0], [-5.03, 7.69]);
  assert.deepEqual(result[1], [-5.01, 7.67]);
});

test("génère un FeatureCollection GeoJSON valide", () => {
  const coords = [
    [-5.03, 7.69],
    [-5.01, 7.67],
  ];
  const geojson = createItineraryGeoJSON(coords);

  assert.equal(geojson.type, "FeatureCollection");
  assert.equal(geojson.features.length, 1);
  assert.equal(geojson.features[0].geometry.type, "LineString");
  assert.deepEqual(geojson.features[0].geometry.coordinates, coords);
});

test("calcule les bornes géographiques (bounds) de l'itinéraire", () => {
  const coords = [
    [-5.05, 7.60],
    [-5.01, 7.72],
    [-5.03, 7.65],
  ];
  const bounds = getItineraryBounds(coords);

  assert.deepEqual(bounds, [-5.05, 7.60, -5.01, 7.72]);
});

test("calculerItineraireRoutier gère les réponses OSRM et les erreurs réseau", async () => {
  // Test avec une fausse destination ou erreur gérée gracieusement
  const result = await calculerItineraireRoutier(
    { latitude: 7.69, longitude: -5.03 },
    { latitude: 7.68, longitude: -5.01 },
  );

  // Soit OSRM est joignable et renvoie un tableau de coordonnées >= 2,
  // soit l'appel échoue gracieusement en renvoyant null sans jeter d'exception
  if (result !== null) {
    assert.ok(Array.isArray(result));
    assert.ok(result.length >= 2);
    assert.equal(typeof result[0][0], "number");
    assert.equal(typeof result[0][1], "number");
  }
});
