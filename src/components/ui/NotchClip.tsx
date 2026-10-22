/**
 * The notched sheet outline used to frame pictures on the homepage: a
 * drawing sheet with clipped corners and a title-block notch in its lower
 * edge. Referenced from CSS as clip-path: url(#notch-clip) (.notch-clip).
 */
export function NotchClipDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <clipPath id="notch-clip" clipPathUnits="objectBoundingBox">
          <polygon points="0.03 0, 0.97 0, 1 0.024, 1 0.976, 0.97 1, 0.64 1, 0.62 0.982, 0.38 0.982, 0.36 1, 0.03 1, 0 0.976, 0 0.024" />
        </clipPath>
      </defs>
    </svg>
  );
}
