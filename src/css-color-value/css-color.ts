import { CSSColorValue, toColorComponent, type CSSColorPercent } from './css-color-value';
import { type CSSNumberish, CSSNumericValue } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

// https://drafts.css-houdini.org/css-typed-om-1/#csscolor
export class CSSColor extends CSSColorValue {
  private _colorSpace!: CSSKeywordValue;
  private _channels!: CSSColorPercent[];
  private _alpha!: CSSNumericValue | CSSKeywordValue;

  constructor(
    colorSpace: CSSKeywordValue | string,
    channels: (CSSNumberish | CSSKeywordValue | string)[],
    alpha: CSSNumberish | CSSKeywordValue | string = 1
  ) {
    super();
    this.colorSpace = typeof colorSpace === 'string' ? new CSSKeywordValue(colorSpace) : colorSpace;
    this._channels = channels.map(toColorComponent);
    this.alpha = toColorComponent(alpha);
  }

  get colorSpace(): CSSKeywordValue {
    if (!(this instanceof CSSColor)) {
      throw new TypeError("Value of 'this' is not a CSSColor");
    }
    return this._colorSpace;
  }

  set colorSpace(val: CSSKeywordValue) {
    if (!(this instanceof CSSColor)) {
      throw new TypeError("Value of 'this' is not a CSSColor");
    }
    if (!(val instanceof CSSKeywordValue)) {
      throw new TypeError('CSSColor.colorSpace must be a CSSKeywordValue');
    }
    this._colorSpace = val;
  }

  get channels(): CSSColorPercent[] {
    if (!(this instanceof CSSColor)) {
      throw new TypeError("Value of 'this' is not a CSSColor");
    }
    return this._channels;
  }

  set channels(val: CSSColorPercent[]) {
    if (!(this instanceof CSSColor)) {
      throw new TypeError("Value of 'this' is not a CSSColor");
    }
    if (!Array.isArray(val)) {
      throw new TypeError('CSSColor.channels must be an array');
    }
    this._channels = val.map(toColorComponent);
  }

  get alpha(): CSSNumericValue | CSSKeywordValue {
    if (!(this instanceof CSSColor)) {
      throw new TypeError("Value of 'this' is not a CSSColor");
    }
    return this._alpha;
  }

  set alpha(val: CSSNumericValue | CSSKeywordValue) {
    if (!(this instanceof CSSColor)) {
      throw new TypeError("Value of 'this' is not a CSSColor");
    }
    if (!(val instanceof CSSNumericValue) && !(val instanceof CSSKeywordValue)) {
      throw new TypeError('CSSColor.alpha must be a CSSNumericValue or CSSKeywordValue');
    }
    this._alpha = val;
  }

  toString(): string {
    const channelStr = this.channels.map(ch => ch.toString()).join(' ');
    return `color(${this.colorSpace.toString()} ${channelStr} / ${this.alpha.toString()})`;
  }
}
