import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROJECT_NOTE, STUDY_NOTE, clientProjects, coverWidth, coverWidthByHeight, plateForService, plateNote, plates, projectOf, type Plate } from "@/content/imagery";
import { getServices } from "@/lib/content";

const all: Plate[] = Object.values(plates);
const renderings = all.filter((p) => p.kind === "project");

/** Width and height from a JPEG's frame header. */
function jpegSize(src: string) {
  const buf = readFileSync(join(process.cwd(), "public", src));
  for (let i = 2; i + 9 < buf.length; ) {
    if (buf[i] !== 0xff) throw new Error(`${src}: not a JPEG marker at ${i}`);
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error(`${src}: no frame header`);
}

describe("imagery", () => {
  it("every picture is on disk at the size it declares, tall crops included", () => {
    for (const p of all) {
      expect(jpegSize(p.src), p.src).toEqual({ width: p.width, height: p.height });
      if (p.tall) expect(jpegSize(p.tall.src), p.tall.src).toEqual({ width: p.tall.width, height: p.tall.height });
    }
  });

  it("shows one or two views of each client project, and every client rendering in exactly one project", () => {
    expect(new Set(clientProjects.map((p) => p.id)).size).toBe(clientProjects.length);
    for (const project of clientProjects) {
      expect(project.views.length, project.id).toBeGreaterThanOrEqual(1);
      expect(project.views.length, project.id).toBeLessThanOrEqual(2);
      for (const v of project.views) expect(v.plate.kind, project.id).toBe("project");
    }
    for (const plate of renderings) {
      expect(clientProjects.filter((p) => p.views.some((v) => v.plate === plate)), plate.src).toHaveLength(1);
      expect(projectOf(plate)).toBeDefined();
    }
  });

  it("never carries an address: no numbers in a client project's anchor, title, views, captions, alt text or file names", () => {
    for (const project of clientProjects) {
      expect(project.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      for (const text of [project.title, ...project.views.map((v) => v.view)]) expect(text).not.toMatch(/\d/);
    }
    for (const plate of renderings) {
      for (const text of [plate.caption, plate.alt, plate.src, plate.tall?.src ?? ""]) expect(text, plate.src).not.toMatch(/\d/);
      expect(plate.alt).toMatch(/^Rendering of /);
    }
  });

  it("captions each picture as what it is", () => {
    for (const p of all) expect(plateNote(p)).toBe(p.kind === "project" ? PROJECT_NOTE : STUDY_NOTE);
    expect(STUDY_NOTE).toMatch(/not a client project/);
  });

  it("has a picture for every service", () => {
    for (const s of getServices()) expect(all, s.slug).toContain(plateForService(s.slug));
  });

  it("asks for a picture as wide as it is drawn when it is wider than its frame", () => {
    const wide = { ...plates.stone, width: 4000, height: 2000 };
    expect(coverWidth(wide, 2, "50vw")).toBe("50vw");
    expect(coverWidth(wide, 1, "50vw")).toBe("calc(50vw * 2)");
    expect(coverWidth(wide, 1, "50vw", 1.1)).toBe("calc(50vw * 2.2)");
    expect(coverWidth({ ...wide, width: 1000 }, 1, "50vw")).toBe("50vw");
    expect(coverWidthByHeight(wide, "70vh")).toBe("calc(70vh * 2)");
  });
});
