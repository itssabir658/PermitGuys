import Image from "next/image";
import { site } from "@/content/site";

/**
 * The PermitGuys logo as supplied: red "permit", charcoal "guys". On dark
 * grounds "guys" switches to white (permitguys-logo-on-dark.png).
 */
export function Logo({ onDark, className, priority }: { onDark?: boolean; className?: string; priority?: boolean }) {
  return (
    <Image
      src={onDark ? "/brand/permitguys-logo-on-dark.png" : "/brand/permitguys-logo.png"}
      alt={site.name}
      width={327}
      height={61}
      unoptimized
      priority={priority}
      className={className ?? "h-6 w-auto"}
    />
  );
}
