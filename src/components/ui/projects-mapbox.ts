import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

/*
 * The Mapbox map behind ProjectsMap, loaded only once its frame nears the
 * screen. Mapbox Standard in its monochrome daylight theme: pale streets,
 * soft shadows and the city's buildings in 3D, no shops or transit to
 * compete. The projects sit on it as the site's own marks: where they are
 * close together they gather into an ink circle with their number in
 * ivory, which opens up on a click; one alone is a red point ringed in
 * white. As the frame comes into view the camera rises from straight
 * above the lake into a tilted view of the GTA, and the marks fade up;
 * with reduced motion it is simply there. Scrolling the page never moves
 * the map: it zooms with Ctrl or ⌘ and the wheel, or two fingers on a
 * phone (cooperativeGestures), and never closer than a neighbourhood
 * (maxZoom), as the points are blurred to about 500m anyway.
 */

const INK = "#171716";
const IVORY = "#f4f1eb";
const RED = "#ee352f";
const FONT = ["DIN Pro Medium", "Arial Unicode MS Regular"];
/** The GTA, from Burlington to Oshawa and up to Newmarket. */
const GTA: [[number, number], [number, number]] = [
  [-79.95, 43.3],
  [-78.85, 44.0],
];
/**
 * The municipalities the firm works with (recognition.ts), named on the map
 * in the site's own type in place of Mapbox's place names, which would sit
 * over the circles: the circles are drawn over these instead. Aurora, next
 * to Newmarket, is left to the intro's list.
 */
const PLACES: [string, number, number][] = [
  ["Toronto", -79.385, 43.655],
  ["Mississauga", -79.64, 43.59],
  ["Oakville", -79.69, 43.45],
  ["Brampton", -79.76, 43.73],
  ["Markham", -79.33, 43.88],
  ["Newmarket", -79.46, 44.05],
  ["Oshawa", -78.86, 43.9],
  ["Burlington", -79.8, 43.33],
  ["Hamilton", -79.87, 43.25],
];
/** The settled view: tilted, turned a little, so the lake lies along the bottom (less tilted on phones, where the frame is taller than wide). */
const BEARING = -16;

/** Mounts the map in `el`; returns a function that removes it. */
export function mountProjectsMapbox(el: HTMLElement, token: string, points: [number, number][], onReady: () => void) {
  mapboxgl.accessToken = token;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Wide, the trust panel sits over the map's left side (globals.css), so the GTA is framed to its right.
  const wide = el.clientWidth >= 1024;
  const narrow = el.clientWidth < 640;
  const pitch = narrow ? 30 : 48;
  const padding = wide ? { top: 40, bottom: 40, left: 360, right: 40 } : 16;
  const map = new mapboxgl.Map({
    container: el,
    style: "mapbox://styles/mapbox/standard",
    config: {
      basemap: {
        theme: "monochrome",
        lightPreset: "day",
        showPointOfInterestLabels: false,
        showTransitLabels: false,
        showPlaceLabels: false,
        showRoadLabels: false,
        showPedestrianRoads: false,
        show3dObjects: true,
      },
    },
    bounds: GTA,
    fitBoundsOptions: { padding },
    minZoom: 5,
    maxZoom: 12.5,
    cooperativeGestures: true,
    pitchWithRotate: false,
    touchPitch: false,
    attributionControl: true,
    logoPosition: "bottom-right",
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

  const data = {
    type: "FeatureCollection" as const,
    features: points.map(([lon, lat]) => ({ type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: [lon, lat] } })),
  };

  let frame = 0;
  map.on("style.load", () => {
    map.addSource("projects", { type: "geojson", data, cluster: true, clusterRadius: narrow ? 34 : 44, clusterMaxZoom: 11 });
    map.addSource("places", {
      type: "geojson",
      data: { type: "FeatureCollection", features: PLACES.map(([name, lon, lat]) => ({ type: "Feature", properties: { name }, geometry: { type: "Point", coordinates: [lon, lat] } })) },
    });
    map.addLayer({
      id: "places",
      type: "symbol",
      source: "places",
      slot: "top",
      layout: {
        "text-field": ["upcase", ["get", "name"]],
        "text-font": FONT,
        "text-size": 11,
        "text-letter-spacing": 0.18,
        "text-anchor": "top",
        "text-offset": [0, 2.5],
        "text-allow-overlap": true,
        // On a phone the circles fill the frame, so the names would only be covered.
        visibility: narrow ? "none" : "visible",
      },
      paint: { "text-color": "#5e5952", "text-halo-color": "#f8f6f2", "text-halo-width": 1.5, "text-emissive-strength": 1 },
    });
    // Standard lights its layers; marks of the site's own colours glow at their own strength (emissive), so daylight never greys them.
    map.addLayer({
      id: "projects-groups",
      type: "circle",
      source: "projects",
      slot: "top",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": INK,
        "circle-radius": narrow ? ["step", ["get", "point_count"], 11, 10, 14, 40, 18, 100, 22] : ["step", ["get", "point_count"], 13, 10, 17, 40, 22, 100, 28],
        "circle-stroke-color": IVORY,
        "circle-stroke-width": 2,
        "circle-emissive-strength": 1,
        "circle-pitch-alignment": "viewport",
        "circle-opacity": 0,
        "circle-stroke-opacity": 0,
      },
    });
    map.addLayer({
      id: "projects-group-counts",
      type: "symbol",
      source: "projects",
      slot: "top",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": FONT,
        "text-size": ["step", ["get", "point_count"], 11, 10, 12, 100, 14],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: { "text-color": IVORY, "text-emissive-strength": 1, "text-opacity": 0 },
    });
    map.addLayer({
      id: "projects-one",
      type: "circle",
      source: "projects",
      slot: "top",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": RED,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 4, 12, 6.5],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-emissive-strength": 1,
        "circle-pitch-alignment": "viewport",
        "circle-opacity": 0,
        "circle-stroke-opacity": 0,
      },
    });
  });

  // A group opens up where it was clicked.
  map.on("click", "projects-groups", (e) => {
    const f = e.features?.[0];
    const id = f?.properties?.cluster_id;
    const src = map.getSource("projects") as mapboxgl.GeoJSONSource | undefined;
    if (!f || id == null || !src) return;
    src.getClusterExpansionZoom(id, (err, zoom) => {
      if (err || zoom == null) return;
      map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: Math.min(zoom + 0.2, 12.5), duration: still ? 0 : 900 });
    });
  });
  map.on("mouseenter", "projects-groups", () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", "projects-groups", () => (map.getCanvas().style.cursor = ""));

  // The entrance, once the map has drawn: the camera rises into the tilted view over 3.2s, the marks fade up over its second half.
  map.once("load", () => {
    onReady();
    const show = (t: number) => {
      for (const id of ["projects-groups", "projects-one"]) {
        map.setPaintProperty(id, "circle-opacity", t);
        map.setPaintProperty(id, "circle-stroke-opacity", t);
      }
      map.setPaintProperty("projects-group-counts", "text-opacity", t);
    };
    // Framed for the tilt, so the whole GTA is in view once the camera has settled.
    const cam = map.cameraForBounds(GTA, { padding, pitch, bearing: BEARING });
    const center = (cam?.center as mapboxgl.LngLatLike | undefined) ?? map.getCenter();
    const zoom = cam?.zoom ?? map.getZoom();
    if (still) {
      map.jumpTo({ center, zoom, pitch, bearing: BEARING });
      return show(1);
    }
    map.flyTo({ center, zoom, pitch, bearing: BEARING, duration: 3200, curve: 1.1, easing: (x) => 1 - (1 - x) ** 3 });
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0 - 1400) / 1200));
      show(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  });

  return () => {
    cancelAnimationFrame(frame);
    map.remove();
  };
}
