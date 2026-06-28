import { registerNumericClasses } from './css-numeric-value/css-numeric-value';
import { CSSUnitValue } from './css-numeric-value/css-unit-value';
import { CSSMathSum } from './css-numeric-value/css-math-sum';
import { CSSMathProduct } from './css-numeric-value/css-math-product';
import { CSSMathNegate } from './css-numeric-value/css-math-negate';
import { CSSMathInvert } from './css-numeric-value/css-math-invert';
import { CSSMathMin } from './css-numeric-value/css-math-min';
import { CSSMathMax } from './css-numeric-value/css-math-max';

registerNumericClasses({
  UnitValue: CSSUnitValue,
  MathSum: CSSMathSum,
  MathProduct: CSSMathProduct,
  MathNegate: CSSMathNegate,
  MathInvert: CSSMathInvert,
  MathMin: CSSMathMin,
  MathMax: CSSMathMax,
});

export * from './css-numeric-value/css-numeric-value';
export * from './css-numeric-value/css-unit-value';
export * from './css-numeric-value/css-math-value';
export * from './css-numeric-value/css-numeric-array';
export * from './css-numeric-value/css-math-sum';
export * from './css-numeric-value/css-math-product';
export * from './css-numeric-value/css-math-negate';
export * from './css-numeric-value/css-math-invert';
export * from './css-numeric-value/css-math-min';
export * from './css-numeric-value/css-math-max';
export * from './css-numeric-value/css-math-clamp';
