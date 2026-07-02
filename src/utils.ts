import propertiesData from './data/Properties.json';

const typedPropertiesData = propertiesData as Record<string, {
  multiplicity?: string;
}>;

const canonicalUnits = new Set(["px", "deg", "s", "hz", "dppx", "number", "fr"]);

export const listValuedProperties = new Set<string>();
for (const [prop, details] of Object.entries(typedPropertiesData)) {
  if (details.multiplicity === 'list' || details.multiplicity === 'coordinating-list') {
    listValuedProperties.add(prop);
  }
}
listValuedProperties.add('text-shadow');


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
  const propLower = property.toLowerCase();
  if (propLower === 'all') return true;
  if (!isSupportedProperty(propLower)) return false;
  const dummy = getDummyStyle();
  dummy.cssText = '';
  dummy.setProperty(propLower, 'inherit');
  return dummy.length > 1;
}




