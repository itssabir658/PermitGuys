import type { MapStat } from "@/components/ui/ProjectsMap";
import { projectPoints } from "./project-points";
import { municipalities } from "./recognition";
import { site } from "./site";

/**
 * The projects map's panel: the permits issued (the business's figure),
 * then what the site itself can show: the projects on the map, rounded
 * down to a round number; the municipalities named in the intro; and the
 * Google rating as the profile shows it.
 */
export function projectsMapStats(): MapStat[] {
  const stats: MapStat[] = [];
  if (site.projectsMap) stats.push({ value: site.projectsMap.permits, label: "Permits issued" });
  const mapped = Math.floor(projectPoints.length / 50) * 50;
  if (mapped >= 50) stats.push({ value: `${mapped}+`, label: "Client projects on the map" });
  stats.push({ value: String(municipalities.length), label: "Municipalities we work with" });
  if (site.reviews) stats.push({ value: `${site.reviews.rating.toFixed(1)} ★`, label: `Google rating, ${site.reviews.count} reviews` });
  return stats;
}
