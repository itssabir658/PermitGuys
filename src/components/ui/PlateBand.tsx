import type { Plate as PlateData } from "@/content/imagery";
import { Container } from "./Container";
import { Plate } from "./Plate";

/**
 * A wide study band set directly under the page header of an index page
 * (services, how it works, about, service areas, guides), so the first
 * screen carries a picture as the homepage does. It unveils with the
 * header and drifts slowly with the scroll; its caption keeps the study
 * note, so it is never read as a client project. Not for projects,
 * contact or the privacy policy.
 */
export function PlateBand({ plate, fig = "01" }: { plate: PlateData; fig?: string }) {
  return (
    <Container className="pb-6 lg:pb-8">
      <Plate
        plate={plate}
        fig={fig}
        reveal={false}
        priority
        drift="slow"
        sizes="100vw"
        aspect="aspect-[3/2] md:aspect-[16/9] lg:aspect-[21/9]"
        frameClassName="motion-unveil motion-unveil--band"
      />
    </Container>
  );
}
