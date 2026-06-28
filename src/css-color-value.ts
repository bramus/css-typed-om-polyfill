import { CSSStyleValue, CSSKeywordValue } from './css-style-value';
import { CSSNumericValue, toNumericValue, type CSSNumberish, CSSUnitValue } from './css-numeric-value';

export type CSSColorRGBComp = CSSNumericValue | CSSKeywordValue;
export type CSSColorPercent = CSSNumericValue | CSSKeywordValue;
export type CSSColorNumber = CSSNumericValue | CSSKeywordValue;
export type CSSColorAngle = CSSNumericValue | CSSKeywordValue;

let colorParser: ((cssText: string) => any) | null = null;

export function registerColorParser(cp: (cssText: string) => any) {
  colorParser = cp;
}

// https://drafts.css-houdini.org/css-typed-om-1/#csscolorvalue
export abstract class CSSColorValue extends CSSStyleValue {
  static parse(cssText: string): CSSColorValue | CSSStyleValue {
    if (!colorParser) {
      throw new Error('Color parser not registered. Make sure to import the index entry point.');
    }
    return colorParser(cssText);
  }
}

function toColorComponent(val: CSSNumberish | CSSKeywordValue | string): CSSColorPercent {
  if (typeof val === 'string') {
    return new CSSKeywordValue(val);
  }
  if (val instanceof CSSKeywordValue) {
    return val;
  }
  return toNumericValue(val);
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssrgb
export class CSSRGB extends CSSColorValue {
  public r: CSSColorRGBComp;
  public g: CSSColorRGBComp;
  public b: CSSColorRGBComp;
  public alpha: CSSColorPercent;

  constructor(
    r: CSSNumberish | CSSKeywordValue | string,
    g: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.r = toColorComponent(r);
    this.g = toColorComponent(g);
    this.b = toColorComponent(b);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `color(srgb ${this.r.toString()} ${this.g.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}

// https://drafts.css-houdini.org/css-typed-om-1/#csshsl
export class CSSHSL extends CSSColorValue {
  public h: CSSColorAngle;
  public s: CSSColorPercent;
  public l: CSSColorPercent;
  public alpha: CSSColorPercent;

  constructor(
    h: CSSNumberish | CSSKeywordValue | string,
    s: CSSNumberish | CSSKeywordValue | string,
    l: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.h = toColorComponent(h);
    this.s = toColorComponent(s);
    this.l = toColorComponent(l);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `hsl(${this.h.toString()} ${this.s.toString()} ${this.l.toString()} / ${this.alpha.toString()})`;
  }
}

// https://drafts.css-houdini.org/css-typed-om-1/#csshwb
export class CSSHWB extends CSSColorValue {
  public h: CSSNumericValue;
  public w: CSSColorPercent;
  public b: CSSColorPercent;
  public alpha: CSSColorPercent;

  constructor(
    h: CSSNumericValue,
    w: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.h = h;
    this.w = toColorComponent(w);
    this.b = toColorComponent(b);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `hwb(${this.h.toString()} ${this.w.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}

// https://drafts.css-houdini.org/css-typed-om-1/#csslab
export class CSSLab extends CSSColorValue {
  public l: CSSColorPercent;
  public a: CSSColorNumber;
  public b: CSSColorNumber;
  public alpha: CSSColorPercent;

  constructor(
    l: CSSNumberish | CSSKeywordValue | string,
    a: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.l = toColorComponent(l);
    this.a = toColorComponent(a);
    this.b = toColorComponent(b);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `lab(${this.l.toString()} ${this.a.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}

// https://drafts.css-houdini.org/css-typed-om-1/#csslch
export class CSSLCH extends CSSColorValue {
  public l: CSSColorPercent;
  public c: CSSColorPercent;
  public h: CSSColorAngle;
  public alpha: CSSColorPercent;

  constructor(
    l: CSSNumberish | CSSKeywordValue | string,
    c: CSSNumberish | CSSKeywordValue | string,
    h: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.l = toColorComponent(l);
    this.c = toColorComponent(c);
    this.h = toColorComponent(h);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `lch(${this.l.toString()} ${this.c.toString()} ${this.h.toString()} / ${this.alpha.toString()})`;
  }
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssoklab
export class CSSOKLab extends CSSColorValue {
  public l: CSSColorPercent;
  public a: CSSColorNumber;
  public b: CSSColorNumber;
  public alpha: CSSColorPercent;

  constructor(
    l: CSSNumberish | CSSKeywordValue | string,
    a: CSSNumberish | CSSKeywordValue | string,
    b: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.l = toColorComponent(l);
    this.a = toColorComponent(a);
    this.b = toColorComponent(b);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `oklab(${this.l.toString()} ${this.a.toString()} ${this.b.toString()} / ${this.alpha.toString()})`;
  }
}

// https://drafts.css-houdini.org/css-typed-om-1/#cssoklch
export class CSSOKLCH extends CSSColorValue {
  public l: CSSColorPercent;
  public c: CSSColorPercent;
  public h: CSSColorAngle;
  public alpha: CSSColorPercent;

  constructor(
    l: CSSNumberish | CSSKeywordValue | string,
    c: CSSNumberish | CSSKeywordValue | string,
    h: CSSNumberish | CSSKeywordValue | string,
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.l = toColorComponent(l);
    this.c = toColorComponent(c);
    this.h = toColorComponent(h);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    return `oklch(${this.l.toString()} ${this.c.toString()} ${this.h.toString()} / ${this.alpha.toString()})`;
  }
}

// https://drafts.css-houdini.org/css-typed-om-1/#csscolor
export class CSSColor extends CSSColorValue {
  public colorSpace: CSSKeywordValue;
  public channels: CSSColorPercent[];
  public alpha: CSSNumericValue | CSSKeywordValue;

  constructor(
    colorSpace: CSSKeywordValue | string,
    channels: (CSSNumberish | CSSKeywordValue | string)[],
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.colorSpace = typeof colorSpace === 'string' ? new CSSKeywordValue(colorSpace) : colorSpace;
    this.channels = channels.map(toColorComponent);
    this.alpha = toColorComponent(alpha);
  }

  toString(): string {
    const channelStr = this.channels.map(ch => ch.toString()).join(' ');
    return `color(${this.colorSpace.toString()} ${channelStr} / ${this.alpha.toString()})`;
  }
}
