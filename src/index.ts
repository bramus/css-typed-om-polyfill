import { CSSStyleValue, CSSKeywordValue, CSSVariableReferenceValue, CSSUnparsedValue, CSSImageValue } from './css-style-value';
import { CSSNumericValue, CSSUnitValue, CSSMathValue, CSSMathSum, CSSMathProduct, CSSMathNegate, CSSMathInvert, CSSMathMin, CSSMathMax, CSSMathClamp, CSSNumericArray } from './css-numeric-value';
import { CSSTransformValue, CSSTransformComponent, CSSTranslate, CSSRotate, CSSScale, CSSSkew, CSSSkewX, CSSSkewY, CSSPerspective, CSSMatrixComponent } from './css-transform-value';
import { CSSColorValue, CSSRGB, CSSHSL, CSSHWB, CSSLab, CSSLCH, CSSOKLab, CSSOKLCH, CSSColor } from './css-color-value';
import { StylePropertyMapReadOnly, StylePropertyMap, CSSComputedStylePropertyMap, CSSInlineStylePropertyMap } from './style-property-map';
import './parser/css-value-parser';

// Export everything for module usage
export {
  CSSStyleValue,
  CSSKeywordValue,
  CSSVariableReferenceValue,
  CSSUnparsedValue,
  CSSImageValue,
  CSSNumericValue,
  CSSUnitValue,
  CSSMathValue,
  CSSMathSum,
  CSSMathProduct,
  CSSMathNegate,
  CSSMathInvert,
  CSSMathMin,
  CSSMathMax,
  CSSMathClamp,
  CSSNumericArray,
  CSSTransformValue,
  CSSTransformComponent,
  CSSTranslate,
  CSSRotate,
  CSSScale,
  CSSSkew,
  CSSSkewX,
  CSSSkewY,
  CSSPerspective,
  CSSMatrixComponent,
  CSSColorValue,
  CSSRGB,
  CSSHSL,
  CSSHWB,
  CSSLab,
  CSSLCH,
  CSSOKLab,
  CSSOKLCH,
  CSSColor,
  StylePropertyMapReadOnly,
  StylePropertyMap
};

// Setup the CSS factory functions
const units = [
  "number", "percent",
  // Lengths
  "em", "rem", "ex", "rex", "cap", "rcap", "ch", "rch", "ic", "ric", "lh", "rlh",
  "vw", "vh", "vi", "vb", "vmin", "vmax",
  "svw", "svh", "svi", "svb", "svmin", "svmax",
  "lvw", "lvh", "lvi", "lvb", "lvmin", "lvmax",
  "dvw", "dvh", "dvi", "dvb", "dvmin", "dvmax",
  "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax",
  "cm", "mm", "Q", "in", "pt", "pc", "px",
  // Angles
  "deg", "grad", "rad", "turn",
  // Times
  "s", "ms",
  // Frequencies
  "Hz", "kHz",
  // Resolutions
  "dpi", "dpcm", "dppx",
  // Flex
  "fr"
];

const cssFactories: Record<string, (val: number) => CSSUnitValue> = {};
for (const unit of units) {
  cssFactories[unit] = (val: number) => new CSSUnitValue(val, unit);
}

// Automatically install the polyfill on the global scope if in a browser environment
if (typeof window !== 'undefined') {
  const g = window as any;

  // Install classes on window if not present
  const classes: Record<string, any> = {
    CSSStyleValue,
    CSSKeywordValue,
    CSSVariableReferenceValue,
    CSSUnparsedValue,
    CSSImageValue,
    CSSNumericValue,
    CSSUnitValue,
    CSSMathValue,
    CSSMathSum,
    CSSMathProduct,
    CSSMathNegate,
    CSSMathInvert,
    CSSMathMin,
    CSSMathMax,
    CSSMathClamp,
    CSSNumericArray,
    CSSTransformValue,
    CSSTransformComponent,
    CSSTranslate,
    CSSRotate,
    CSSScale,
    CSSSkew,
    CSSSkewX,
    CSSSkewY,
    CSSPerspective,
    CSSMatrixComponent,
    CSSColorValue,
    CSSRGB,
    CSSHSL,
    CSSHWB,
    CSSLab,
    CSSLCH,
    CSSOKLab,
    CSSOKLCH,
    CSSColor,
    StylePropertyMapReadOnly,
    StylePropertyMap
  };

  for (const name of Object.keys(classes)) {
    if (!g[name]) {
      g[name] = classes[name];
    }
  }

  // Patch the CSS namespace
  if (!g.CSS) {
    g.CSS = {};
  }
  for (const name of Object.keys(cssFactories)) {
    if (!g.CSS[name]) {
      g.CSS[name] = cssFactories[name];
    }
  }

  // Patch Element.prototype.computedStyleMap
  if (!Element.prototype.computedStyleMap) {
    Element.prototype.computedStyleMap = function(this: Element) {
      return new CSSComputedStylePropertyMap(window.getComputedStyle(this));
    } as any;
  }

  // Patch Element.prototype.attributeStyleMap
  if (!Object.prototype.hasOwnProperty.call(Element.prototype, 'attributeStyleMap')) {
    Object.defineProperty(Element.prototype, 'attributeStyleMap', {
      get(this: HTMLElement) {
        // We use a weak map or private property to cache the map
        let map = (this as any).__attributeStyleMap;
        if (!map) {
          map = new CSSInlineStylePropertyMap(this.style);
          (this as any).__attributeStyleMap = map;
        }
        return map;
      },
      configurable: true,
      enumerable: true
    });
  }

  // Patch CSSStyleRule.prototype.styleMap
  if (typeof CSSStyleRule !== 'undefined' && !Object.prototype.hasOwnProperty.call(CSSStyleRule.prototype, 'styleMap')) {
    Object.defineProperty(CSSStyleRule.prototype, 'styleMap', {
      get(this: CSSStyleRule) {
        let map = (this as any).__styleMap;
        if (!map) {
          map = new CSSInlineStylePropertyMap(this.style);
          (this as any).__styleMap = map;
        }
        return map;
      },
      configurable: true,
      enumerable: true
    });
  }
}
