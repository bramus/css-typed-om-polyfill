const canonicalUnits = new Set(["px", "deg", "s", "hz", "dppx", "number", "fr"]);

export const listValuedProperties = new Set([
  'background-attachment',
  'background-blend-mode',
  'background-clip',
  'background-image',
  'background-origin',
  'background-position',
  'background-repeat',
  'background-size',
  'box-shadow',
  'text-shadow',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'animation-direction',
  'animation-fill-mode',
  'animation-play-state',
  'font-family',
  'font-feature-settings',
  'font-variation-settings',
  'mask-clip',
  'mask-composite',
  'mask-image',
  'mask-mode',
  'mask-origin',
  'mask-position',
  'mask-repeat',
  'mask-size',
]);

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

let dummyStyle: CSSStyleDeclaration | null = null;
export function getDummyStyle(): CSSStyleDeclaration {
  if (!dummyStyle) {
    if (typeof document === 'undefined') {
      // Return a mock for non-browser environments if any
      return {
        cssText: '',
        length: 0,
        setProperty() {},
        getPropertyValue() { return ''; },
        removeProperty() {}
      } as any;
    }
    dummyStyle = document.createElement('div').style;
  }
  return dummyStyle;
}

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1]!.toUpperCase());
}

export function isSupportedProperty(property: string): boolean {
  if (property.startsWith('--')) return true;
  const dummy = getDummyStyle();
  const camel = kebabToCamel(property);
  const camelLower = camel.charAt(0).toLowerCase() + camel.slice(1);
  return camel in dummy || camelLower in dummy;
}

export function isShorthandProperty(property: string): boolean {
  if (property.startsWith('--')) return false;
  if (!isSupportedProperty(property)) return false;
  const dummy = getDummyStyle();
  dummy.cssText = '';
  dummy.setProperty(property, 'inherit');
  return dummy.length > 1;
}

export function splitCommated(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i]!;
    if (char === '(') depth++;
    else if (char === ')') depth--;
    
    if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current) {
    result.push(current.trim());
  }
  return result;
}

export function serializeComputedBackground(style: CSSStyleDeclaration): string {
  const images = splitCommated(style.getPropertyValue('background-image') || 'none');
  const positions = splitCommated(style.getPropertyValue('background-position') || '0% 0%');
  const sizes = splitCommated(style.getPropertyValue('background-size') || 'auto');
  const repeats = splitCommated(style.getPropertyValue('background-repeat') || 'repeat');
  const attachments = splitCommated(style.getPropertyValue('background-attachment') || 'scroll');
  const origins = splitCommated(style.getPropertyValue('background-origin') || 'padding-box');
  const clips = splitCommated(style.getPropertyValue('background-clip') || 'border-box');
  const color = style.getPropertyValue('background-color') || 'transparent';

  const layers: string[] = [];
  const numLayers = images.length;

  for (let i = 0; i < numLayers; i++) {
    const parts: string[] = [];
    
    if (i === numLayers - 1) {
      parts.push(color);
    }

    parts.push(images[i] || 'none');
    parts.push(repeats[i] || 'repeat');
    parts.push(attachments[i] || 'scroll');
    
    const pos = positions[i] || '0% 0%';
    const size = sizes[i] || 'auto';
    parts.push(`${pos} / ${size}`);

    const origin = origins[i] || 'padding-box';
    const clip = clips[i] || 'border-box';
    if (origin === clip) {
      parts.push(origin);
    } else {
      parts.push(`${origin} ${clip}`);
    }

    layers.push(parts.join(' '));
  }

  return layers.join(', ');
}
