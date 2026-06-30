import {
  Token,
  tokenizeString,
  IdentToken,
  FunctionToken,
  NumberToken,
  PercentageToken,
  DimensionToken,
  CommaToken,
  WhitespaceToken,
  RightParenthesisToken,
  LeftParenthesisToken,
  DelimToken,
  UrlToken,
  StringToken,
  HashToken,
  AtKeywordToken
} from './tokenizer';
import { CSSStyleValue, CSSKeywordValue, CSSUnparsedValue, CSSVariableReferenceValue, type CSSUnparsedSegment, CSSImageValue } from '../css-style-value';
import { CSSNumericValue, CSSUnitValue } from '../css-numeric-value';
import { isSupportedProperty, getDummyStyle, listValuedProperties } from '../utils';
import { parseCSSNumericValue } from './css-numeric-parser';
import {
  CSSTransformValue,
  CSSTransformComponent,
  CSSTranslate,
  CSSRotate,
  CSSScale,
  CSSSkew,
  CSSSkewX,
  CSSSkewY,
  CSSPerspective,
  CSSMatrixComponent
} from '../css-transform-value';
import {
  CSSColorValue,
  CSSRGB,
  CSSHSL,
  CSSHWB,
  CSSLab,
  CSSLCH,
  CSSOKLab,
  CSSOKLCH,
  CSSColor
} from '../css-color-value';

const colorNames: Record<string, [number, number, number, number?]> = {
  transparent: [0, 0, 0, 0] as any,
  black: [0, 0, 0],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  white: [255, 255, 255],
  maroon: [128, 0, 0],
  red: [255, 0, 0],
  purple: [128, 0, 128],
  fuchsia: [255, 0, 255],
  green: [0, 128, 0],
  lime: [0, 255, 0],
  olive: [128, 128, 0],
  yellow: [255, 255, 0],
  navy: [0, 0, 128],
  blue: [0, 0, 255],
  teal: [0, 128, 128],
  aqua: [0, 255, 255],
  orange: [255, 165, 0]
};

export function parseCSSValue(property: string, cssText: string, forceColorValue: boolean = false): CSSStyleValue {
  const trimmed = cssText.trim();
  
  const propLower = property.toLowerCase();
  if (!isSupportedProperty(propLower)) {
    throw new TypeError(`Unsupported property: ${property}`);
  }

  if (trimmed === '') {
    throw new TypeError('Empty CSS text');
  }

  if (propLower.startsWith('--')) {
    const tokens = tokenizeString(trimmed);
    return parseUnparsedValue(tokens);
  }

  // Validate value for standard properties (if it doesn't contain var())
  if (!trimmed.toLowerCase().includes('var(')) {
    const dummy = getDummyStyle();
    dummy.cssText = '';
    try {
      dummy.setProperty(property, trimmed);
      if (dummy.getPropertyValue(property) === '') {
        throw new TypeError(`Invalid value for property ${property}: ${cssText}`);
      }
    } catch (e) {
      throw new TypeError(`Invalid value for property ${property}: ${cssText}`);
    }
  }

  // 1. Try to parse as a numeric value
  try {
    return parseCSSNumericValue(trimmed);
  } catch (e) {}

  // 2. Tokenize and parse other values
  const tokens = tokenizeString(trimmed);
  if (tokens.length === 0) {
    throw new TypeError('Invalid CSS value');
  }

  // Helper: check if it contains var()
  const hasVar = tokens.some((t: Token) => t instanceof FunctionToken && t.value.toLowerCase() === 'var');
  if (hasVar) {
    return parseUnparsedValue(tokens);
  }

  // 3. Try to parse as a transform value (if property is transform or if it looks like one)
  if (property.toLowerCase() === 'transform' || isTransformValue(tokens)) {
    try {
      return parseTransformValue(tokens);
    } catch (e) {}
  }

  // 4. Try to parse as a color value (only if forced)
  if (forceColorValue && isColorValue(tokens, trimmed)) {
    try {
      return parseColorValue(tokens, trimmed);
    } catch (e) {
      return new CSSStyleValue(trimmed, Symbol.for('css-typed-om-polyfill-private-token'));
    }
  }

  // Try to parse as an image value
  if (isImageValue(tokens, trimmed)) {
    return new CSSImageValue(trimmed, Symbol.for('css-typed-om-polyfill-private-token'));
  }

  // 5. Try to parse as keyword
  if (tokens.length === 1 && tokens[0] instanceof IdentToken) {
    const name = tokens[0].value.toLowerCase();
    if (colorNames[name]) {
      return new CSSStyleValue(trimmed, Symbol.for('css-typed-om-polyfill-private-token'));
    }
    return new CSSKeywordValue(tokens[0].value);
  }

  // 6. Fallback to CSSStyleValue (unsupported values)
  return new CSSStyleValue(trimmed, Symbol.for('css-typed-om-polyfill-private-token'));
}

function tokensToString(tokens: Token[]): string {
  return tokens.map(t => {
    if (t instanceof WhitespaceToken) return ' ';
    if (t instanceof DelimToken) return t.value;
    if (t instanceof IdentToken) return t.value;
    if (t instanceof FunctionToken) return `${t.value}(`;
    if (t instanceof NumberToken) return `${t.value}`;
    if (t instanceof PercentageToken) return `${t.value}%`;
    if (t instanceof DimensionToken) return `${t.value}${t.unit}`;
    if (t instanceof CommaToken) return ',';
    if (t instanceof LeftParenthesisToken) return '(';
    if (t instanceof RightParenthesisToken) return ')';
    if (t instanceof UrlToken) return `url(${t.value})`;
    if (t instanceof StringToken) return `"${t.value}"`;
    if (t instanceof HashToken) return `#${t.value}`;
    if (t instanceof AtKeywordToken) return `@${t.value}`;
    return '';
  }).join('').trim();
}

export function parseAllCSSValues(property: string, cssText: string, forceColorValue: boolean = false): CSSStyleValue[] {
  const trimmed = cssText.trim();
  
  const propLower = property.toLowerCase();
  if (!isSupportedProperty(propLower)) {
    throw new TypeError(`Unsupported property: ${property}`);
  }

  if (trimmed === '') {
    throw new TypeError('Empty CSS text');
  }

  if (!listValuedProperties.has(propLower)) {
    return [parseCSSValue(property, trimmed, forceColorValue)];
  }

  // Validate the whole list for standard properties (if it doesn't contain var())
  if (!trimmed.toLowerCase().includes('var(')) {
    const dummy = getDummyStyle();
    dummy.cssText = '';
    try {
      dummy.setProperty(property, trimmed);
      if (dummy.getPropertyValue(property) === '') {
        throw new TypeError(`Invalid value for property ${property}: ${cssText}`);
      }
    } catch (e) {
      throw new TypeError(`Invalid value for property ${property}: ${cssText}`);
    }
  }

  // Split by top-level commas
  const tokens = tokenizeString(trimmed);
  const parts: Token[][] = [];
  let currentPart: Token[] = [];
  let parenLevel = 0;

  for (const token of tokens) {
    if (token instanceof LeftParenthesisToken || token instanceof FunctionToken) {
      parenLevel++;
      currentPart.push(token);
    } else if (token instanceof RightParenthesisToken) {
      parenLevel--;
      currentPart.push(token);
    } else if (token instanceof CommaToken && parenLevel === 0) {
      parts.push(currentPart);
      currentPart = [];
    } else {
      currentPart.push(token);
    }
  }
  if (currentPart.length > 0) {
    parts.push(currentPart);
  }

  return parts.map(part => {
    const partText = tokensToString(part);
    return parseCSSValue(property, partText, forceColorValue);
  });
}

import { registerParsers } from '../css-style-value';
import { registerColorParser } from '../css-color-value';

registerParsers(parseCSSValue, parseAllCSSValues);
registerColorParser(parseColor);

export function parseColor(cssText: string): CSSColorValue | CSSStyleValue {
  const trimmed = cssText.trim();
  const tokens = tokenizeString(trimmed);
  return parseColorValue(tokens, trimmed);
}

function isTransformValue(tokens: Token[]): boolean {
  const transformFnNames = new Set([
    'translate', 'translate3d', 'translatex', 'translatey', 'translatez',
    'rotate', 'rotate3d', 'scale', 'scale3d', 'scalex', 'scaley', 'scalez',
    'skew', 'skewx', 'skewy', 'perspective', 'matrix', 'matrix3d'
  ]);
  return tokens.some(t => t instanceof FunctionToken && transformFnNames.has(t.value.toLowerCase()));
}

function isColorValue(tokens: Token[], cssText: string): boolean {
  if (cssText.startsWith('#')) return true;
  if (tokens.length === 1 && tokens[0] instanceof IdentToken && colorNames[tokens[0].value.toLowerCase()]) {
    return true;
  }
  const colorFnNames = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color']);
  return tokens.some(t => t instanceof FunctionToken && colorFnNames.has(t.value.toLowerCase()));
}

function isImageValue(tokens: Token[], cssText: string): boolean {
  if (tokens.some(t => t instanceof UrlToken)) {
    return true;
  }
  const imageFnNames = new Set([
    'url', 'linear-gradient', 'radial-gradient', 'conic-gradient',
    'repeating-linear-gradient', 'repeating-radial-gradient', 'repeating-conic-gradient',
    'image', 'element', 'cross-fade', 'image-set'
  ]);
  return tokens.some(t => t instanceof FunctionToken && imageFnNames.has(t.value.toLowerCase()));
}

function parseTransformValue(tokens: Token[]): CSSTransformValue {
  const components: CSSTransformComponent[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token instanceof WhitespaceToken) {
      i++;
      continue;
    }
    if (!(token instanceof FunctionToken)) {
      throw new SyntaxError('Expected transform function');
    }

    const name = token.value.toLowerCase();
    const args: Token[] = [];
    i++; // consume function token

    let parenLevel = 1;
    while (i < tokens.length && parenLevel > 0) {
      const argToken = tokens[i]!;
      if (argToken instanceof LeftParenthesisToken || argToken instanceof FunctionToken) {
        parenLevel++;
      } else if (argToken instanceof RightParenthesisToken) {
        parenLevel--;
      }
      if (parenLevel > 0) {
        args.push(argToken);
      }
      i++;
    }

    components.push(parseTransformComponent(name, args));
  }

  return new CSSTransformValue(components);
}

const reifyGeneric = (
  tokens: Token[] | undefined,
  fastPath: (t: Token) => CSSNumericValue | null
): CSSNumericValue => {
  if (!tokens || tokens.length === 0) throw new SyntaxError('Missing transform argument');
  if (tokens.length === 1) {
    const res = fastPath(tokens[0]!);
    if (res) return res;
  }
  const cssText = tokensToString(tokens);
  try {
    return parseCSSNumericValue(cssText);
  } catch (e) {
    throw new SyntaxError('Invalid transform argument');
  }
};

const reifyLengthPercent = (tokens: Token[] | undefined): CSSNumericValue =>
  reifyGeneric(tokens, (t) => {
    if (t instanceof NumberToken) {
      if (t.value === 0) return new CSSUnitValue(0, 'px');
      throw new TypeError('Expected length or percentage, got number');
    }
    if (t instanceof PercentageToken) return new CSSUnitValue(t.value, 'percent');
    if (t instanceof DimensionToken) return new CSSUnitValue(t.value, t.unit);
    return null;
  });

const reifyLength = (tokens: Token[] | undefined): CSSNumericValue =>
  reifyGeneric(tokens, (t) => {
    if (t instanceof NumberToken) {
      if (t.value === 0) return new CSSUnitValue(0, 'px');
      throw new TypeError('Expected length, got number');
    }
    if (t instanceof DimensionToken) return new CSSUnitValue(t.value, t.unit);
    return null;
  });

const reifyAngle = (tokens: Token[] | undefined): CSSNumericValue =>
  reifyGeneric(tokens, (t) => {
    if (t instanceof NumberToken) {
      if (t.value === 0) return new CSSUnitValue(0, 'deg');
      throw new TypeError('Expected angle, got number');
    }
    if (t instanceof DimensionToken) return new CSSUnitValue(t.value, t.unit);
    return null;
  });

const reifyNumber = (tokens: Token[] | undefined): CSSNumericValue =>
  reifyGeneric(tokens, (t) => {
    if (t instanceof NumberToken) return new CSSUnitValue(t.value, 'number');
    return null;
  });

function parseTransformComponent(name: string, argTokens: Token[]): CSSTransformComponent {
  // Split by top-level commas
  const args: Token[][] = [];
  let currentArg: Token[] = [];
  let parenLevel = 0;
  for (const token of argTokens) {
    if (token instanceof LeftParenthesisToken || token instanceof FunctionToken) {
      parenLevel++;
      currentArg.push(token);
    } else if (token instanceof RightParenthesisToken) {
      parenLevel--;
      currentArg.push(token);
    } else if (token instanceof CommaToken && parenLevel === 0) {
      args.push(currentArg);
      currentArg = [];
    } else {
      if (!(token instanceof WhitespaceToken && currentArg.length === 0)) {
        currentArg.push(token);
      }
    }
  }
  if (currentArg.length > 0) {
    args.push(currentArg);
  }

  switch (name) {
    case 'translate':
      return new CSSTranslate(reifyLengthPercent(args[0]), args[1] ? reifyLengthPercent(args[1]) : new CSSUnitValue(0, 'px'));
    case 'translate3d':
      return new CSSTranslate(reifyLengthPercent(args[0]), reifyLengthPercent(args[1]), reifyLength(args[2]));
    case 'translatex':
      return new CSSTranslate(reifyLengthPercent(args[0]), new CSSUnitValue(0, 'px'));
    case 'translatey':
      return new CSSTranslate(new CSSUnitValue(0, 'px'), reifyLengthPercent(args[0]));
    case 'translatez':
      return new CSSTranslate(new CSSUnitValue(0, 'px'), new CSSUnitValue(0, 'px'), reifyLength(args[0]));
    case 'rotate':
      return new CSSRotate(reifyAngle(args[0]));
    case 'rotate3d':
      return new CSSRotate(reifyNumber(args[0]), reifyNumber(args[1]), reifyNumber(args[2]), reifyAngle(args[3]));
    case 'rotatex':
      return new CSSRotate(1, 0, 0, reifyAngle(args[0]));
    case 'rotatey':
      return new CSSRotate(0, 1, 0, reifyAngle(args[0]));
    case 'rotatez':
      return new CSSRotate(0, 0, 1, reifyAngle(args[0]));
    case 'scale':
      return new CSSScale(reifyNumber(args[0]), args[1] ? reifyNumber(args[1]) : reifyNumber(args[0]));
    case 'scale3d':
      return new CSSScale(reifyNumber(args[0]), reifyNumber(args[1]), reifyNumber(args[2]));
    case 'scalex':
      return new CSSScale(reifyNumber(args[0]), 1);
    case 'scaley':
      return new CSSScale(1, reifyNumber(args[0]));
    case 'scalez':
      return new CSSScale(1, 1, reifyNumber(args[0]));
    case 'skew':
      return new CSSSkew(reifyAngle(args[0]), args[1] ? reifyAngle(args[1]) : new CSSUnitValue(0, 'deg'));
    case 'skewx':
      return new CSSSkewX(reifyAngle(args[0]));
    case 'skewy':
      return new CSSSkewY(reifyAngle(args[0]));
    case 'perspective':
      return new CSSPerspective(args[0] && args[0][0] instanceof IdentToken && args[0][0].value.toLowerCase() === 'none' ? new CSSKeywordValue('none') : reifyLength(args[0]));
    case 'matrix': {
      const vals = args.map(arg => {
        if (arg.length !== 1 || !(arg[0] instanceof NumberToken)) {
          throw new SyntaxError('Invalid matrix argument');
        }
        return arg[0].value;
      });
      return new CSSMatrixComponent(new DOMMatrix([vals[0]!, vals[1]!, vals[2]!, vals[3]!, vals[4]!, vals[5]!]));
    }
    case 'matrix3d': {
      const vals = args.map(arg => {
        if (arg.length !== 1 || !(arg[0] instanceof NumberToken)) {
          throw new SyntaxError('Invalid matrix argument');
        }
        return arg[0].value;
      });
      return new CSSMatrixComponent(new DOMMatrix(vals));
    }
    default:
      throw new SyntaxError(`Unknown transform function: ${name}`);
  }
}

const systemColors = new Set([
  'canvas', 'canvastext', 'linktext', 'visitedtext', 'activetext',
  'buttonface', 'buttontext', 'buttonborder', 'field', 'fieldtext',
  'highlight', 'highlighttext', 'selecteditem', 'selecteditemtext',
  'mark', 'marktext', 'graytext',
]);

function parseColorValue(tokens: Token[], cssText: string): CSSColorValue | CSSStyleValue {
  // 1. Hex color
  if (cssText.startsWith('#')) {
    const hex = cssText.slice(1);
    let r = 0, g = 0, b = 0, a = 1;
    if (hex.length === 3 || hex.length === 4) {
      r = parseInt(hex[0]! + hex[0]!, 16);
      g = parseInt(hex[1]! + hex[1]!, 16);
      b = parseInt(hex[2]! + hex[2]!, 16);
      if (hex.length === 4) a = parseInt(hex[3]! + hex[3]!, 16) / 255;
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
    } else {
      throw new DOMException('Invalid hex color', 'SyntaxError');
    }
    return new CSSRGB(new CSSUnitValue(r, 'number'), new CSSUnitValue(g, 'number'), new CSSUnitValue(b, 'number'), a);
  }

  // 2. Named color / System color
  if (tokens.length === 1 && tokens[0] instanceof IdentToken) {
    const name = tokens[0].value.toLowerCase();
    if (colorNames[name]) {
      const rgb = colorNames[name]!;
      const alpha = rgb[3] !== undefined ? rgb[3] : 1;
      return new CSSRGB(new CSSUnitValue(rgb[0], 'number'), new CSSUnitValue(rgb[1], 'number'), new CSSUnitValue(rgb[2], 'number'), alpha);
    }
    if (systemColors.has(name)) {
      return new CSSKeywordValue(name);
    }
  }

  // 3. Color function
  if (tokens[0] instanceof FunctionToken) {
    const name = tokens[0].value.toLowerCase();
    
    // Find matching parenthesis
    let parenLevel = 1;
    let j = 1;
    while (j < tokens.length && parenLevel > 0) {
      const t = tokens[j]!;
      if (t instanceof LeftParenthesisToken || t instanceof FunctionToken) {
        parenLevel++;
      } else if (t instanceof RightParenthesisToken) {
        parenLevel--;
      }
      j++;
    }
    if (parenLevel > 0) {
      throw new DOMException('Unmatched parenthesis', 'SyntaxError');
    }
    
    // Check for extra tokens
    for (let k = j; k < tokens.length; k++) {
      if (!(tokens[k] instanceof WhitespaceToken)) {
        throw new DOMException('Extra tokens after color function', 'SyntaxError');
      }
    }
    
    // Filter out commas, slashes, etc. from tokens inside the function
    const funcTokens = tokens.slice(1, j - 1);
    const args = funcTokens.filter(t => !(t instanceof WhitespaceToken || t instanceof CommaToken || (t instanceof DelimToken && t.value === '/')));

    const reifyArg = (t: Token | undefined): CSSNumericValue | CSSKeywordValue => {
      if (!t) throw new DOMException('Missing color argument', 'SyntaxError');
      if (t instanceof NumberToken) return new CSSUnitValue(t.value, 'number');
      if (t instanceof PercentageToken) return new CSSUnitValue(t.value, 'percent');
      if (t instanceof DimensionToken) return new CSSUnitValue(t.value, t.unit);
      if (t instanceof IdentToken) return new CSSKeywordValue(t.value);
      throw new DOMException('Invalid color argument', 'SyntaxError');
    };

    const reifyPercent = (t: Token | undefined, defaultVal?: number): any => {
      if (!t) {
        if (defaultVal !== undefined) return defaultVal;
        throw new DOMException('Missing argument', 'SyntaxError');
      }
      if (t instanceof NumberToken) return t.value;
      return reifyArg(t);
    };

    const reifyHSLHue = (t: Token | undefined): any => {
      if (!t) throw new DOMException('Missing hue', 'SyntaxError');
      if (t instanceof NumberToken) return t.value;
      return reifyArg(t);
    };

    const reifyHWBHue = (t: Token | undefined): CSSNumericValue => {
      if (!t) throw new DOMException('Missing hue', 'SyntaxError');
      if (t instanceof NumberToken) return new CSSUnitValue(t.value, 'deg');
      const r = reifyArg(t);
      if (!(r instanceof CSSNumericValue)) {
        throw new DOMException('Invalid hue', 'SyntaxError');
      }
      return r;
    };

    switch (name) {
      case 'rgb':
      case 'rgba':
        return new CSSRGB(reifyArg(args[0]), reifyArg(args[1]), reifyArg(args[2]), reifyPercent(args[3], 1));
      case 'hsl':
      case 'hsla':
        return new CSSHSL(reifyHSLHue(args[0]), reifyPercent(args[1]), reifyPercent(args[2]), reifyPercent(args[3], 1));
      case 'hwb':
        return new CSSHWB(reifyHWBHue(args[0]), reifyPercent(args[1]), reifyPercent(args[2]), reifyPercent(args[3], 1));
      case 'lab':
        return new CSSLab(reifyPercent(args[0]), reifyArg(args[1]), reifyArg(args[2]), reifyPercent(args[3], 1));
      case 'lch':
        return new CSSLCH(reifyPercent(args[0]), reifyPercent(args[1]), reifyHSLHue(args[2]), reifyPercent(args[3], 1));
      case 'oklab':
        return new CSSOKLab(reifyPercent(args[0]), reifyArg(args[1]), reifyArg(args[2]), reifyPercent(args[3], 1));
      case 'oklch':
        return new CSSOKLCH(reifyPercent(args[0]), reifyPercent(args[1]), reifyHSLHue(args[2]), reifyPercent(args[3], 1));
      case 'color': {
        const colorSpace = args[0] as IdentToken;
        const channels = args.slice(1, 4).map(reifyArg);
        const alpha = reifyPercent(args[4], 1);
        return new CSSColor(new CSSKeywordValue(colorSpace.value), channels, alpha);
      }
    }
  }

  throw new DOMException('Invalid color value', 'SyntaxError');
}

function parseUnparsedValue(tokens: Token[]): CSSUnparsedValue {
  const segments: CSSUnparsedSegment[] = [];
  let currentStr = '';

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token instanceof FunctionToken && token.value.toLowerCase() === 'var') {
      if (currentStr !== '') {
        segments.push(currentStr);
        currentStr = '';
      }
      // Parse var reference
      i++; // consume var
      const varArgs: Token[] = [];
      let parenLevel = 1;
      while (i < tokens.length && parenLevel > 0) {
        const t = tokens[i]!;
        if (t instanceof LeftParenthesisToken || t instanceof FunctionToken) {
          parenLevel++;
        } else if (t instanceof RightParenthesisToken) {
          parenLevel--;
        }
        if (parenLevel > 0) {
          varArgs.push(t);
        }
        i++;
      }

      // First arg is the variable name
      const cleanArgs = varArgs.filter(t => !(t instanceof WhitespaceToken || t instanceof CommaToken));
      const varNameToken = cleanArgs[0];
      if (!(varNameToken instanceof IdentToken) || !varNameToken.value.startsWith('--')) {
        throw new SyntaxError('var() first argument must be a custom property name');
      }

      let fallback: CSSUnparsedValue | null = null;
      // If there is a comma, the rest is the fallback
      const commaIndex = varArgs.findIndex(t => t instanceof CommaToken);
      if (commaIndex !== -1) {
        const fallbackTokens = varArgs.slice(commaIndex + 1);
        fallback = parseUnparsedValue(fallbackTokens);
      }

      segments.push(new CSSVariableReferenceValue(varNameToken.value, fallback));
    } else {
      // Append token representation to currentStr
      if (token instanceof WhitespaceToken) currentStr += ' ';
      else if (token instanceof DelimToken) currentStr += token.value;
      else if (token instanceof IdentToken) currentStr += token.value;
      else if (token instanceof FunctionToken) currentStr += `${token.value}(`;
      else if (token instanceof NumberToken) currentStr += `${token.value}`;
      else if (token instanceof PercentageToken) currentStr += `${token.value}%`;
      else if (token instanceof DimensionToken) currentStr += `${token.value}${token.unit}`;
      else if (token instanceof CommaToken) currentStr += ',';
      else if (token instanceof LeftParenthesisToken) currentStr += '(';
      else if (token instanceof RightParenthesisToken) currentStr += ')';
      i++;
    }
  }

  if (currentStr !== '') {
    segments.push(currentStr);
  }

  return new CSSUnparsedValue(segments);
}
