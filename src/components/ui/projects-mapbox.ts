import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

/*
 * The Mapbox map behind ProjectsMap, loaded only once its frame nears the
 * screen. Mapbox's dark style redrawn in the site's palette (ink land,
 * deeper water, roads and labels in faint ivory and stone) with every
 * project as a dot in the logo's red over a soft red glow. When the frame
 * comes into view the camera settles from over the lake onto the GTA while
 * the dots come up in a scattered order; with reduced motion they are
 * simply there. Scrolling the page never moves the map: it zooms with
 * Ctrl or ⌘ and the wheel, or two fingers on a phone (cooperativeGestures),
 * and never closer than a neighbourhood (maxZoom), as the points are blurred
 * to about 500m anyway.
 */

const INK = "#171716";
const WATER = "#0d0d0c";
const RED = "#ee352f";
/** The GTA, from Burlington to Oshawa and up to Newmarket. */
const GTA: [[number, number], [number, number]] = [
  [-80.05, 43.28],
  [-78.75, 44.12],
];

function restyle(map: mapboxgl.Map) {
  for (const layer of map.getStyle()?.layers ?? []) {
    const id = layer.id;
    try {
      if (layer.type === "background") map.setPaintProperty(id, "background-color", INK);
      else if (layer.type === "fill" && /water/.test(id)) map.setPaintProperty(id, "fill-color", WATER);
      else if (layer.type === "fill") {
        map.setPaintProperty(id, "fill-color", INK);
        map.setPaintProperty(id, "fill-opacity", 0.6);
      }
      else if (layer.type === "line" && /water/.test(id)) map.setPaintProperty(id, "line-color", WATER);
      // The border across the lake would read as a line through the map: country lines go, provincial ones stay faint.
      else if (layer.type === "line" && /admin-0/.test(id)) map.setLayoutProperty(id, "visibility", "none");
      else if (layer.type === "line" && /admin|boundary/.test(id)) map.setPaintProperty(id, "line-color", "rgba(244,241,235,0.1)");
      else if (layer.type === "line") map.setPaintProperty(id, "line-color", "rgba(244,241,235,0.075)");
      else if (layer.type === "symbol") {
        if (/poi|transit|road-number|shield|airport/.test(id)) map.setLayoutProperty(id, "visibility", "none");
        else {
          map.setPaintProperty(id, "text-color", /settlement-major|place-city/.test(id) ? "#cfc7ba" : "#8f877b");
          map.setPaintProperty(id, "text-halo-color", INK);
        }
      }
    } catch {
      // A layer without that property keeps its own.
    }
  }
}

/** Mounts the map in `el`; returns a function that removes it. */
export function mountProjectsMapbox(el: HTMLElement, token: string, points: [number, number][], onReady: () => void) {
  mapboxgl.accessToken = token;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const map = new mapboxgl.Map({
    container: el,
    style: "mapbox://styles/mapbox/dark-v11",
    bounds: GTA,
    fitBoundsOptions: { padding: 24 },
    minZoom: 4.5,
    maxZoom: 12.5,
    cooperativeGestures: true,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    attributionControl: true,
    logoPosition: "bottom-right",
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

  // Each point carries its own moment in the entrance, 0–1, so the dots come up scattered rather than in a sweep.
  const data = {
    type: "FeatureCollection" as const,
    features: points.map(([lon, lat], i) => ({ type: "Feature" as const, properties: { r: ((i * 0.6180339887) % 1) * 0.85 }, geometry: { type: "Point" as const, coordinates: [lon, lat] } })),
  };

  let frame = 0;
  map.on("style.load", () => {
    restyle(map);
    map.addSource("projects", { type: "geojson", data });
    // Under the place names, so a city's name always reads over its projects.
    const labels = map.getStyle()?.layers.find((l) => l.type === "symbol")?.id;
    map.addLayer({
      id: "projects-glow",
      type: "heatmap",
      source: "projects",
      maxzoom: 12,
      paint: {
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 6, 10, 9, 22, 12, 34],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 6, 0.6, 12, 1.2],
        "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(238,53,47,0)", 0.3, "rgba(238,53,47,0.18)", 0.7, "rgba(238,53,47,0.38)", 1, "rgba(255,120,96,0.55)"],
        "heatmap-opacity": 0,
      },
    }, labels);
    map.addLayer({
      id: "projects-dots",
      type: "circle",
      source: "projects",
      paint: {
        "circle-color": RED,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 1.6, 9, 2.8, 12, 4.5],
        "circle-stroke-color": INK,
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 6, 0.3, 12, 1],
        "circle-opacity": 0,
        "circle-stroke-opacity": 0,
      },
    }, labels);
  });

  // The entrance, once the map has drawn: the dots and their glow over 1.8s, the camera settling over 2.6s.
  map.once("load", () => {
    onReady();
    const show = (t: number) => {
      const opacity: mapboxgl.ExpressionSpecification = ["case", ["<", ["get", "r"], t], 1, 0];
      map.setPaintProperty("projects-dots", "circle-opacity", opacity);
      map.setPaintProperty("projects-dots", "circle-stroke-opacity", opacity);
      map.setPaintProperty("projects-glow", "heatmap-opacity", Math.min(1, t) * 0.9);
    };
    if (still) return show(1);
    const center = map.getCenter();
    const zoom = map.getZoom();
    map.jumpTo({ center: [center.lng + 0.25, center.lat - 0.35], zoom: zoom - 0.9 });
    map.easeTo({ center, zoom, duration: 2600, easing: (x) => 1 - (1 - x) ** 4 });
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 1800);
      show(t * 1.0001);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  });

  return () => {
    cancelAnimationFrame(frame);
    map.remove();
  };
}
