"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectsMapFrame } from "@/components/ui/ProjectsMap";
import { projectPoints } from "@/content/project-points";

/**
 * The projects map in the intro's last panel. The panel's slide is marked
 * data-awake by the intro's motion (HomeMotion) a little before it wipes
 * into the frame, or at once when the intro stands still, and only then
 * does the map load: the hero and the first paragraphs never pay for it.
 */
export function IntroMap() {
  const box = useRef<HTMLDivElement>(null);
  const [awake, setAwake] = useState(false);

  useEffect(() => {
    const slide = box.current?.closest<HTMLElement>("[data-frame-slide]");
    if (!slide) return setAwake(true);
    const check = () => slide.hasAttribute("data-awake") && (setAwake(true), true);
    if (check()) return;
    const mo = new MutationObserver(() => check() && mo.disconnect());
    mo.observe(slide, { attributes: true, attributeFilter: ["data-awake"] });
    return () => mo.disconnect();
  }, []);

  return (
    <div ref={box} className="projects-map intro-map">
      <ProjectsMapFrame points={projectPoints} wake={awake} className="intro-map__frame" />
    </div>
  );
}
