import { CSSNumericValue } from './css-numeric-value';

// https://drafts.css-houdini.org/css-typed-om-1/#cssmathvalue
export abstract class CSSMathValue extends CSSNumericValue {
  abstract get operator(): string;
}
