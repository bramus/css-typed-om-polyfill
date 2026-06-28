import { CSSColorValue, toColorComponent, type CSSColorPercent } from './css-color-value';
import { type CSSNumberish, CSSNumericValue } from '../css-numeric-value';
import { CSSKeywordValue } from '../css-style-value';

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
