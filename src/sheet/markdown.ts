import snarkdown from "snarkdown";

/**
 * Markdown for a note. Deliberately small: emphasis, lists, links and inline
 * code, which is where a dice roll goes. The stylesheet renders `<code>` the
 * way the dice spans elsewhere on the sheet are rendered, so a backticked
 * `2d6` looks like every other roll without anyone writing a span.
 *
 * This does not sanitise, and does not need to. A note is the owner's own
 * prose, written on their own machine, served to their own browser; there is
 * no second author to defend against.
 */
const STARTS_A_BLOCK = /^\s*<(ul|ol|blockquote|h[1-6]|pre|table)\b/i;

export function markdown(source: string): string {
  return source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const html = snarkdown(block);
      return STARTS_A_BLOCK.test(html) ? html : `<p>${html}</p>`;
    })
    .join("");
}
