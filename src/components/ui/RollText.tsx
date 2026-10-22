import { Fragment } from "react";

/**
 * Roll link label (docs/MOTION.md, "Roll links"): two stacked copies of the
 * text, split into characters. On hover the top copy rolls up and out while
 * the bottom one rolls in, 0.02s apart per character; leaving reverses it
 * from wherever it has got to. Driven by RollLinks in MotionRoot. The text
 * is read once, from the visually hidden copy.
 *
 * Each word rolls in its own mask, so a long label can wrap in a narrow
 * column; the character stagger still runs across the whole label.
 */
export function RollText({ children }: { children: string }) {
  const words = children.split(" ");
  return (
    <span data-roll="" className="roll">
      <span className="sr-only">{children}</span>
      {words.map((word, w) => (
        <Fragment key={w}>
          {w > 0 ? " " : null}
          <span aria-hidden="true" className="roll__word">
            <span className="roll__row" data-roll-top="">
              {[...word].map((c, i) => (
                <span key={i} className="roll__c">
                  {c}
                </span>
              ))}
            </span>
            <span className="roll__row roll__row--bottom" data-roll-bottom="">
              {[...word].map((c, i) => (
                <span key={i} className="roll__c">
                  {c}
                </span>
              ))}
            </span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}
