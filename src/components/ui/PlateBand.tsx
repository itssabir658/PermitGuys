import { coverWidth, type Plate as PlateData } from "@/content/imagery";
import { Container } from "./Container";
import { Plate } from "./Plate";

/**
 * A wide picture band set directly under the page header of an index page
 * (services, how it works, about, service areas, guides), so the first
 * screen carries a picture as the homepage does. It unveils with the
 * header and drifts slowly with the scroll; its caption carries the plate's
 * note, client rendering or rendered study. Not for projects, contact or
 * the privacy policy.
 *
 * The band is 3:2 on phones, 16:9 from md and 21:9 from lg, and the drift
 * draws the picture at 110%, so a picture wider than the band is fetched
 * as wide as it is drawn at the band's height.
 */
export function PlateBand({ plate }: { plate: PlateData }) {
  return (
    <Container className="pb-6 lg:pb-8">
      <Plate
        plate={plate}
        reveal={false}
        priority
        drift="slow"
        sizes={`(min-width: 1024px) ${coverWidth(plate, 21 / 9, "100vw", 1.1)}, (min-width: 768px) ${coverWidth(plate, 16 / 9, "100vw", 1.1)}, ${coverWidth(plate, 3 / 2, "100vw", 1.1)}`}
        aspect="aspect-[3/2] md:aspect-[16/9] lg:aspect-[21/9]"
        frameClassName="motion-unveil motion-unveil--band"
      />
    </Container>
  );
}
