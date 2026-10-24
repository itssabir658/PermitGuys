import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROJECT_NOTE, STUDY_NOTE, clientProjects, coverWidth, coverWidthByHeight, heroLayers, plateForService, plateNote, plates, projectOf, type Plate } from "@/content/imagery";
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

/** Width, height and whether it has an alpha channel, from an extended WebP's header (VP8X). */
function webpInfo(src: string) {
  const buf = readFileSync(join(process.cwd(), "public", src));
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") throw new Error(`${src}: not a WebP`);
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk !== "VP8X") throw new Error(`${src}: unexpected ${chunk} chunk`);
  return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1, alpha: (buf[20] & 0x10) !== 0 };
}

describe("imagery", () => {
  it("every picture is on disk at the size it declares, tall crops included", () => {
    for (const p of all) {
      expect(jpegSize(p.src), p.src).toEqual({ width: p.width, height: p.height });
      if (p.tall) expect(jpegSize(p.tall.src), p.tall.src).toEqual({ width: p.tall.width, height: p.tall.height });
    }
  });

  it("cuts the hero's planes from its picture at the picture's own size, for each crop", () => {
    const { terrace } = plates;
    const { width, height } = terrace;
    const tall = { width: terrace.tall!.width, height: terrace.tall!.height };
    expect(jpegSize(heroLayers.far.src), heroLayers.far.src).toEqual({ width, height });
    expect(jpegSize(heroLayers.far.tall), heroLayers.far.tall).toEqual(tall);
    // The near plane is transparent around what it cuts out, and its smaller copies keep the picture's proportions (Hero.tsx lists them by these widths).
    expect(webpInfo(heroLayers.near.src)).toEqual({ width, height, alpha: true });
    expect(webpInfo(heroLayers.near.threeQuarter)).toEqual({ width: width * 0.75, height: Math.round(height * 0.75), alpha: true });
    expect(webpInfo(heroLayers.near.half)).toEqual({ width: width / 2, height: height / 2, alpha: true });
    expect(webpInfo(heroLayers.near.tall)).toEqual({ ...tall, alpha: true });
    for (const path of [...Object.values(heroLayers.far), ...Object.values(heroLayers.near)]) expect(path).not.toMatch(/\d/);
  });

  it("shows one or two views of each client project, and every client rendering in exactly one project", () => {
    expect(new Set(clientProjects.map((p) => p.id)).size).toBe(clientProjects.length);
    for (const project of clientProjects) {
      expect(project.views.length, project.id).toBeGreaterThanOrEqual(1);
      expect(project.views.length, project.id).toBeLessThanOrEqual(2);
      for (const view of project.views) expect(view.kind, project.id).toBe("project");
    }
    for (const plate of renderings) {
      expect(clientProjects.filter((p) => p.views.includes(plate)), plate.src).toHaveLength(1);
      expect(projectOf(plate)).toBeDefined();
    }
  });

  it("never carries an address: no numbers in a client project's anchor, title, captions, alt text or file names", () => {
    for (const project of clientProjects) {
      expect(project.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(project.title).not.toMatch(/\d/);
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
