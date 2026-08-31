/**
 * Greedy word-wrap: packs words onto a line while they fit `maxWidth`
 * (per `measureWidth`), starts a new line otherwise. `measureWidth` is
 * injected rather than taking a CanvasRenderingContext2D directly so this
 * stays a pure, unit-testable function — ParticleLine.tsx passes
 * `(line) => ctx.measureText(line).width` at the real call site.
 *
 * No hyphenation, no justification: a single word longer than `maxWidth`
 * still gets its own line rather than being split mid-word.
 */
export function wrapText(text: string, maxWidth: number, measureWidth: (line: string) => number): string[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${currentLine} ${words[i]}`;
    if (measureWidth(candidate) <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  return lines;
}
