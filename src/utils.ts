const canonicalUnits = new Set(["px", "deg", "s", "hz", "dppx", "number", "fr"]);

export function isCanonical(unit: string): boolean {
  return canonicalUnits.has(unit.toLowerCase());
}

export function normalizeAxis(axis: string, computedStyle?: CSSStyleDeclaration): string {
  if (['x', 'y'].includes(axis)) return axis;

  if (!computedStyle) {
    throw new Error('To determine the normalized axis the computedStyle of the source is required.');
  }

  const horizontalWritingMode = computedStyle.writingMode === 'horizontal-tb';
  let normAxis = axis;
  if (axis === "block") {
    normAxis = horizontalWritingMode ? "y" : "x";
  } else if (axis === "inline") {
    normAxis = horizontalWritingMode ? "x" : "y";
  } else {
    throw new TypeError(`Invalid axis “${axis}”`);
  }

  return normAxis;
}

export function splitIntoComponentValues(input: string): string[] {
  const res: string[] = [];
  let i = 0;

  function consumeComponentValue(): string {
    let level = 0;
    const startIndex = i;
    while (i < input.length) {
      const nextChar = input.slice(i, i + 1);
      if (/\s/.test(nextChar) && level === 0) {
        break;
      } else if (nextChar === '(') {
        level += 1;
      } else if (nextChar === ')') {
        level -= 1;
        if (level === 0) {
          i++;
          break;
        }
      }
      i++;
    }
    return input.slice(startIndex, i);
  }

  function consumeWhitespace(): void {
    while (/\s/.test(input.slice(i, i + 1))) {
      i++;
    }
  }

  while (i < input.length) {
    const nextChar = input.slice(i, i + 1);
    if (/\s/.test(nextChar)) {
      consumeWhitespace();
    } else {
      res.push(consumeComponentValue());
    }
  }
  return res;
}
