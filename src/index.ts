import { CSSStyleValue, CSSKeywordValue, CSSVariableReferenceValue, CSSUnparsedValue, CSSImageValue } from './css-style-value';
import { CSSNumericValue, CSSUnitValue, CSSMathValue, CSSMathSum, CSSMathProduct, CSSMathNegate, CSSMathInvert, CSSMathMin, CSSMathMax, CSSMathClamp, CSSNumericArray } from './css-numeric-value';
import { CSSTransformValue, CSSTransformComponent, CSSTranslate, CSSRotate, CSSScale, CSSSkew, CSSSkewX, CSSSkewY, CSSPerspective, CSSMatrixComponent } from './css-transform-value';
import { CSSColorValue, CSSRGB, CSSHSL, CSSHWB, CSSLab, CSSLCH, CSSOKLab, CSSOKLCH, CSSColor } from './css-color-value';
import { StylePropertyMapReadOnly, StylePropertyMap } from './style-property-map';
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

  // Helper to make all prototype members (getters, setters, methods) enumerable
  const makePrototypeMembersEnumerable = (proto: any) => {
    if (!proto) return;
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        desc.enumerable = true;
        Object.defineProperty(proto, key, desc);
      }
    }
  };

  // Helper to make all static members enumerable
  const makeStaticMembersEnumerable = (cls: any) => {
    if (!cls) return;
    for (const key of Object.getOwnPropertyNames(cls)) {
      if (key === 'prototype' || key === 'name' || key === 'length') continue;
      const desc = Object.getOwnPropertyDescriptor(cls, key);
      if (desc) {
        desc.enumerable = true;
        Object.defineProperty(cls, key, desc);
      }
    }
  };

  const expectedLengths: Record<string, number> = {
    CSSStyleValue: 0,
    StylePropertyMapReadOnly: 0,
    StylePropertyMap: 0,
    CSSNumericArray: 0,
    CSSTranslate: 2,
    CSSRotate: 1,
    CSSScale: 2,
    CSSMatrixComponent: 1,
    CSSImageValue: 0,
    CSSColorValue: 0,
    CSSMathValue: 0,
    CSSTransformComponent: 0,
    CSSVariableReferenceValue: 1,
    CSSRGB: 3,
    CSSHSL: 3,
    CSSHWB: 3,
    CSSLab: 3,
    CSSLCH: 3,
    CSSOKLab: 3,
    CSSOKLCH: 3,
    CSSColor: 2,
  };

  const copyStaticMethodsToSubclasses = (cls: any) => {
    const parent = Object.getPrototypeOf(cls);
    if (!parent || parent === Function.prototype || parent === Object.prototype) return;
    copyStaticMethodsToSubclasses(parent);

    for (const key of Object.getOwnPropertyNames(parent)) {
      if (key === 'prototype' || key === 'name' || key === 'length') continue;
      if (!Object.prototype.hasOwnProperty.call(cls, key)) {
        const desc = Object.getOwnPropertyDescriptor(parent, key);
        if (desc) {
          Object.defineProperty(cls, key, desc);
        }
      }
    }
  };

  // Force overwrite all classes using Object.defineProperty to bypass read-only native properties
  for (const [name, cls] of Object.entries(classes)) {
    try {
      Object.defineProperty(g, name, {
        value: cls,
        writable: true,
        configurable: true,
        enumerable: false // WebIDL interface objects are non-enumerable on global
      });
    } catch (e) {
      g[name] = cls;
    }
    if (cls && cls.name !== name) {
      Object.defineProperty(cls, 'name', { value: name, configurable: true });
    }
    if (cls) {
      const len = expectedLengths[name];
      if (len !== undefined) {
        Object.defineProperty(cls, 'length', { value: len, configurable: true });
      }
      copyStaticMethodsToSubclasses(cls);
      makeStaticMembersEnumerable(cls);
      if (cls.prototype) {
        // Add Symbol.toStringTag for correct Object.prototype.toString.call() output
        Object.defineProperty(cls.prototype, Symbol.toStringTag, {
          value: name,
          configurable: true,
          writable: false,
          enumerable: false
        });
        makePrototypeMembersEnumerable(cls.prototype);
      }
    }
  }

  // Patch the CSS namespace
  if (!g.CSS) {
    g.CSS = {};
  } else {
    // Check if it is extensible
    let extensible = true;
    try {
      (g.CSS as any).__test = 1;
      if ((g.CSS as any).__test !== 1) {
        extensible = false;
      } else {
        delete (g.CSS as any).__test;
      }
    } catch (e) {
      extensible = false;
    }

    if (!extensible) {
      const originalCSS = g.CSS;
      const newCSS = Object.create(Object.prototype);
      for (const key of Object.getOwnPropertyNames(originalCSS)) {
        const desc = Object.getOwnPropertyDescriptor(originalCSS, key)!;
        Object.defineProperty(newCSS, key, desc);
      }
      for (const sym of Object.getOwnPropertySymbols(originalCSS)) {
        const desc = Object.getOwnPropertyDescriptor(originalCSS, sym)!;
        Object.defineProperty(newCSS, sym, desc);
      }
      g.CSS = newCSS;
    }
  }

  for (const name of Object.keys(cssFactories)) {
    if (!g.CSS[name]) {
      g.CSS[name] = cssFactories[name];
    }
  }

  // Patch Element.prototype.computedStyleMap
  if (!Element.prototype.computedStyleMap) {
    Element.prototype.computedStyleMap = function computedStyleMap(this: Element) {
      if (!(this instanceof Element)) {
        throw new TypeError("Value of 'this' is not an Element");
      }
      return new StylePropertyMapReadOnly(this, window.getComputedStyle(this), Symbol.for('css-typed-om-polyfill-private-token'));
    } as any;
  }

  // Patch ElementCSSInlineStyle mixin (HTMLElement, SVGElement, MathMLElement)
  const patchAttributeStyleMap = (proto: any, brandCheck: (obj: any) => boolean) => {
    if (proto) {
      const temp = {
        get attributeStyleMap(): any {
          const self = this as any;
          if (!brandCheck(self)) {
            throw new TypeError("Value of 'this' is not of correct type");
          }
          let map = self.__attributeStyleMap;
          if (!map) {
            map = new StylePropertyMap(self.style, Symbol.for('css-typed-om-polyfill-private-token'));
            self.__attributeStyleMap = map;
          }
          return map;
        }
      };
      Object.defineProperty(proto, 'attributeStyleMap', Object.getOwnPropertyDescriptor(temp, 'attributeStyleMap')!);
    }
  };

  const patchStyleMap = (proto: any, brandCheck: (obj: any) => boolean) => {
    if (proto) {
      const temp = {
        get styleMap(): any {
          const self = this as any;
          if (!brandCheck(self)) {
            throw new TypeError("Value of 'this' is not of correct type");
          }
          let map = self.__styleMap;
          if (!map) {
            map = new StylePropertyMap(self.style, Symbol.for('css-typed-om-polyfill-private-token'));
            self.__styleMap = map;
          }
          return map;
        }
      };
      Object.defineProperty(proto, 'styleMap', Object.getOwnPropertyDescriptor(temp, 'styleMap')!);
    }
  };

  if (typeof HTMLElement !== 'undefined') {
    patchAttributeStyleMap(HTMLElement.prototype, (obj) => obj instanceof HTMLElement);
    patchStyleMap(HTMLElement.prototype, (obj) => obj instanceof HTMLElement);
  }
  if (typeof SVGElement !== 'undefined') {
    patchAttributeStyleMap(SVGElement.prototype, (obj) => obj instanceof SVGElement);
    patchStyleMap(SVGElement.prototype, (obj) => obj instanceof SVGElement);
  }
  if (typeof MathMLElement !== 'undefined') {
    patchAttributeStyleMap(MathMLElement.prototype, (obj) => obj instanceof MathMLElement);
    patchStyleMap(MathMLElement.prototype, (obj) => obj instanceof MathMLElement);
  }

  // Patch CSSStyleRule.prototype.styleMap
  if (typeof CSSStyleRule !== 'undefined') {
    const temp = {
      get styleMap(): any {
        if (!(this instanceof CSSStyleRule)) {
          throw new TypeError("Value of 'this' is not a CSSStyleRule");
        }
        let map = (this as any).__styleMap;
        if (!map) {
          map = new StylePropertyMap((this as any).style, Symbol.for('css-typed-om-polyfill-private-token'));
          (this as any).__styleMap = map;
        }
        return map;
      }
    };
    Object.defineProperty(CSSStyleRule.prototype, 'styleMap', Object.getOwnPropertyDescriptor(temp, 'styleMap')!);
  }

  // Patch value-iterable interfaces to use Array.prototype methods (required by WebIDL)
  const patchValueIterable = (proto: any) => {
    if (!proto) return;
    const methods = ['keys', 'values', 'entries', 'forEach'];
    for (const method of methods) {
      Object.defineProperty(proto, method, {
        value: (Array.prototype as any)[method],
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    Object.defineProperty(proto, Symbol.iterator, {
      value: Array.prototype[Symbol.iterator],
      writable: true,
      configurable: true,
      enumerable: false
    });
  };

  patchValueIterable(CSSUnparsedValue.prototype);
  patchValueIterable(CSSNumericArray.prototype);
  patchValueIterable(CSSTransformValue.prototype);

  // StylePropertyMapReadOnly methods are already made enumerable by makePrototypeMembersEnumerable
}
