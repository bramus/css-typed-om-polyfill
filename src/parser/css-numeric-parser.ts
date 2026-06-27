import {
  Token,
  CommaToken,
  DelimToken,
  DimensionToken,
  FunctionToken,
  IdentToken,
  LeftCurlyBracketToken,
  LeftParenthesisToken,
  LeftSquareBracketToken,
  NumberToken,
  PercentageToken,
  RightCurlyBracketToken,
  RightParenthesisToken,
  RightSquareBracketToken,
  tokenizeString,
  WhitespaceToken
} from './tokenizer';
import {
  CSSNumericValue,
  CSSUnitValue,
  CSSMathSum,
  CSSMathProduct,
  CSSMathNegate,
  CSSMathInvert,
  CSSMathMin,
  CSSMathMax,
  CSSMathClamp
} from '../css-numeric-value';
import { simplifyCalculation } from './simplify-calculation';

type UnitMap = Record<string, number>;
type SumValueItem = [number, UnitMap];
type SumValue = SumValueItem[];

const baseTypes = ["percent", "length", "angle", "time", "frequency", "resolution", "flex"];

interface UnitGroup {
  units: Set<string>;
  compatible?: boolean;
  canonicalUnit?: string;
  ratios?: Record<string, number>;
}

const unitGroups = {
  fontRelativeLengths: {
    units: new Set(["em", "rem", "ex", "rex", "cap", "rcap", "ch", "rch", "ic", "ric", "lh", "rlh"])
  },
  viewportRelativeLengths: {
    units: new Set(
      ["vw", "lvw", "svw", "dvw", "vh", "lvh", "svh", "dvh", "vi", "lvi", "svi", "dvi", "vb", "lvb", "svb", "dvb",
        "vmin", "lvmin", "svmin", "dvmin", "vmax", "lvmax", "svmax", "dvmax"])
  },
  absoluteLengths: {
    units: new Set(["cm", "mm", "Q", "in", "pt", "pc", "px"]),
    compatible: true,
    canonicalUnit: "px",
    ratios: {
      "cm": 96 / 2.54, "mm": (96 / 2.54) / 10, "Q": (96 / 2.54) / 40, "in": 96, "pc": 96 / 6, "pt": 96 / 72, "px": 1
    }
  },
  angle: {
    units: new Set(["deg", "grad", "rad", "turn"]),
    compatible: true,
    canonicalUnit: "deg",
    ratios: {
      "deg": 1, "grad": 360 / 400, "rad": 180 / Math.PI, "turn": 360
    }
  },
  time: {
    units: new Set(["s", "ms"]),
    compatible: true,
    canonicalUnit: "s",
    ratios: {
      "s": 1, "ms": 1 / 1000
    }
  },
  frequency: {
    units: new Set(["hz", "khz"]),
    compatible: true,
    canonicalUnit: "hz",
    ratios: {
      "hz": 1, "khz": 1000
    }
  },
  resolution: {
    units: new Set(["dpi", "dpcm", "dppx"]),
    compatible: true,
    canonicalUnit: "dppx",
    ratios: {
      "dpi": 1 / 96, "dpcm": 2.54 / 96, "dppx": 1
    }
  }
};

const unitToCompatibleUnitsMap = new Map<string, UnitGroup>();
for (const group of Object.values(unitGroups) as UnitGroup[]) {
  if (!group.compatible) {
    continue;
  }
  for (const unit of group.units) {
    unitToCompatibleUnitsMap.set(unit, group);
  }
}

export function getSetOfCompatibleUnits(unit: string): UnitGroup | undefined {
  return unitToCompatibleUnitsMap.get(unit);
}

function productOfTwoUnitMaps(units1: UnitMap, units2: UnitMap): UnitMap {
  const result = { ...units1 };
  for (const unit of Object.keys(units2)) {
    const val2 = units2[unit];
    if (val2 !== undefined) {
      const val1 = result[unit];
      if (val1 !== undefined) {
        result[unit] = val1 + val2;
      } else {
        result[unit] = val2;
      }
    }
  }
  return result;
}

export function createAType(unit: string): Record<string, number> | null {
  if (unit === "number") {
    return {};
  } else if (unit === "percent") {
    return { "percent": 1 };
  } else if (unitGroups.absoluteLengths.units.has(unit) || unitGroups.fontRelativeLengths.units.has(unit) ||
    unitGroups.viewportRelativeLengths.units.has(unit)) {
    return { "length": 1 };
  } else if (unitGroups.angle.units.has(unit)) {
    return { "angle": 1 };
  } else if (unitGroups.time.units.has(unit)) {
    return { "time": 1 };
  } else if (unitGroups.frequency.units.has(unit)) {
    return { "frequency": 1 };
  } else if (unitGroups.resolution.units.has(unit)) {
    return { "resolution": 1 };
  } else if (unit === "fr") {
    return { "flex": 1 };
  } else {
    return null;
  }
}

export function createSumValue(cssNumericValue: CSSNumericValue): SumValue | null {
  if (cssNumericValue instanceof CSSUnitValue) {
    let { unit, value } = cssNumericValue;
    const compatibleUnits = getSetOfCompatibleUnits(unit);
    if (compatibleUnits && unit !== compatibleUnits.canonicalUnit) {
      value *= compatibleUnits.ratios![unit]!;
      unit = compatibleUnits.canonicalUnit!;
    }

    if (unit === "number") {
      return [[value, {}]];
    } else {
      return [[value, { [unit]: 1 }]];
    }
  } else if (cssNumericValue instanceof CSSMathInvert) {
    if (!(cssNumericValue.value instanceof CSSUnitValue)) {
      throw new Error("Not implemented");
    }
    const values = createSumValue(cssNumericValue.value);
    if (values === null) {
      return null;
    }
    if (values.length > 1) {
      return null;
    }
    const item = values[0]!;
    const tempUnionMap: UnitMap = {};
    for (const [unit, power] of Object.entries(item[1])) {
      tempUnionMap[unit] = -1 * power;
    }
    values[0] = [1 / item[0], tempUnionMap];
    return values;
  } else if (cssNumericValue instanceof CSSMathProduct) {
    let values: SumValue = [[1, {}]];
    for (const item of cssNumericValue.values) {
      const newValues = createSumValue(item);
      const temp: SumValue = [];
      if (newValues === null) {
        return null;
      }
      for (const item1 of values) {
        for (const item2 of newValues) {
          temp.push([item1[0] * item2[0], productOfTwoUnitMaps(item1[1], item2[1])]);
        }
      }
      values = temp;
    }
    return values;
  } else {
    throw new Error("Not implemented");
  }
}

export function to(cssNumericValue: CSSNumericValue, unit: string): CSSUnitValue {
  const type = createAType(unit);
  if (type === null) {
    throw new SyntaxError("The string did not match the expected pattern.");
  }

  const sumValue = createSumValue(cssNumericValue);
  if (!sumValue) {
    throw new TypeError();
  }

  if (sumValue.length > 1) {
    throw new TypeError("Sum has more than one item");
  }

  const item = convertCSSUnitValue(createCSSUnitValue(sumValue[0]!)!, unit);
  if (item === null) {
    throw new TypeError();
  }
  return item;
}

export function createCSSUnitValue(sumValueItem: SumValueItem): CSSUnitValue | null {
  const [value, unitMap] = sumValueItem;
  const entries = Object.entries(unitMap);
  if (entries.length > 1) {
    return null;
  }
  if (entries.length === 0) {
    return new CSSUnitValue(value, "number");
  }
  const entry = entries[0]!;
  if (entry[1] !== 1) {
    return null;
  } else {
    return new CSSUnitValue(value, entry[0]);
  }
}

export function convertCSSUnitValue(cssUnitValue: CSSUnitValue, unit: string): CSSUnitValue | null {
  if (cssUnitValue.unit === unit) {
    return cssUnitValue;
  }
  const oldUnit = cssUnitValue.unit;
  const oldValue = cssUnitValue.value;
  const oldCompatibleUnitGroup = getSetOfCompatibleUnits(oldUnit);
  const compatibleUnitGroup = getSetOfCompatibleUnits(unit);
  if (!compatibleUnitGroup || oldCompatibleUnitGroup !== compatibleUnitGroup) {
    return null;
  }
  return new CSSUnitValue(oldValue * compatibleUnitGroup.ratios![oldUnit]! / compatibleUnitGroup.ratios![unit]!, unit);
}

export function toSum(cssNumericValue: CSSNumericValue, ...units: string[]): CSSMathSum {
  if (units && units.length) {
    throw new Error("Not implemented");
  }

  const sum = createSumValue(cssNumericValue);
  if (!sum) {
    throw new TypeError("Type error");
  }

  const values = sum.map(item => createCSSUnitValue(item));
  if (values.some(value => value === null)) {
    throw new TypeError("Type error");
  }

  return new CSSMathSum(...(values as CSSUnitValue[]));
}

class CSSFunction {
  constructor(public name: string, public values: any[]) {}
}

class CSSSimpleBlock {
  constructor(public value: any[], public associatedToken: Token) {}
}

function normalizeIntoTokenStream(input: string | Token[]): Token[] {
  if (Array.isArray(input)) {
    return input;
  }
  if (typeof input === 'string') {
    return tokenizeString(input);
  }
  throw new TypeError(`Invalid input type ${typeof input}`);
}

function consumeFunction(token: FunctionToken, tokens: Token[]): CSSFunction {
  const func = new CSSFunction(token.value, []);
  while (true) {
    const nextToken = tokens.shift();
    if (nextToken instanceof RightParenthesisToken) {
      return func;
    } else if (typeof nextToken === 'undefined') {
      return func;
    } else {
      tokens.unshift(nextToken);
      func.values.push(consumeComponentValue(tokens));
    }
  }
}

function consumeSimpleBlock(tokens: Token[], currentInputToken: Token): CSSSimpleBlock | undefined {
  let endingTokenConstructor: any;
  if (currentInputToken instanceof LeftCurlyBracketToken) {
    endingTokenConstructor = RightCurlyBracketToken;
  } else if (currentInputToken instanceof LeftParenthesisToken) {
    endingTokenConstructor = RightParenthesisToken;
  } else if (currentInputToken instanceof LeftSquareBracketToken) {
    endingTokenConstructor = RightSquareBracketToken;
  } else {
    return undefined;
  }

  const simpleBlock = new CSSSimpleBlock([], currentInputToken);
  while (true) {
    const token = tokens.shift();
    if (token instanceof endingTokenConstructor) {
      return simpleBlock;
    } else if (typeof token === 'undefined') {
      return simpleBlock;
    } else {
      tokens.unshift(token);
      simpleBlock.value.push(consumeComponentValue(tokens));
    }
  }
}

function consumeComponentValue(tokens: Token[]): any {
  const token = tokens.shift();
  if (token instanceof LeftCurlyBracketToken || token instanceof LeftSquareBracketToken || token instanceof LeftParenthesisToken) {
    return consumeSimpleBlock(tokens, token);
  } else if (token instanceof FunctionToken) {
    return consumeFunction(token, tokens);
  } else {
    return token;
  }
}

function parseComponentValue(input: string): any {
  const tokens = normalizeIntoTokenStream(input);
  while (tokens[0] instanceof WhitespaceToken) {
    tokens.shift();
  }
  if (typeof tokens[0] === 'undefined') {
    return null;
  }
  const returnValue = consumeComponentValue(tokens);
  while (tokens[0] instanceof WhitespaceToken) {
    tokens.shift();
  }
  if (typeof tokens[0] === 'undefined') {
    return returnValue;
  } else {
    return null;
  }
}

function precedence(token: Token): number {
  if (token instanceof LeftParenthesisToken || token instanceof RightParenthesisToken) {
    return 6;
  } else if (token instanceof DelimToken) {
    if ((token as any).isUnary) {
      return 5;
    }
    const value = token.value;
    switch (value) {
      case '*':
        return 4;
      case '/':
        return 4;
      case '+':
        return 2;
      case '-':
        return 2;
    }
  }
  return 0;
}

function last<T>(items: T[]): T {
  return items[items.length - 1]!;
}

interface ASTNode {
  type: 'ADDITION' | 'MULTIPLICATION' | 'NEGATE' | 'INVERT';
  values?: any[];
  value?: any;
}

function toNAryAstNode(operatorToken: DelimToken, first: any, second: any): ASTNode {
  const type = ['+', '-'].includes(operatorToken.value) ? 'ADDITION' : 'MULTIPLICATION';
  const firstValues = (first && first.type === type) ? first.values : [first];
  const secondValues = (second && second.type === type) ? second.values : [second];

  if (operatorToken.value === '-') {
    secondValues[0] = { type: 'NEGATE', value: secondValues[0] };
  } else if (operatorToken.value === '/') {
    secondValues[0] = { type: 'INVERT', value: secondValues[0] };
  }
  return { type, values: [...firstValues, ...secondValues] };
}

function convertTokensToAST(tokens: Token[]): any {
  const operatorStack: Token[] = [];
  const tree: any[] = [];
  let prevNonWhitespace: Token | null = null;

  while (tokens.length) {
    const token = tokens.shift()!;
    if (token instanceof NumberToken || token instanceof DimensionToken || token instanceof PercentageToken ||
      token instanceof CSSFunction || token instanceof CSSSimpleBlock || token instanceof IdentToken) {
      tree.push(token);
      prevNonWhitespace = token;
    } else if (token instanceof DelimToken && ['*', '/', '+', '-'].includes(token.value)) {
      const isUnary = prevNonWhitespace === null ||
                      prevNonWhitespace instanceof LeftParenthesisToken ||
                      (prevNonWhitespace instanceof DelimToken && ['*', '/', '+', '-'].includes(prevNonWhitespace.value));
      if (isUnary) {
        if (token.value === '-') {
          (token as any).isUnary = true;
          operatorStack.push(token);
        }
        // Discard unary +
        continue;
      }

      while (operatorStack.length &&
      !(last(operatorStack) instanceof LeftParenthesisToken) &&
      precedence(last(operatorStack)) > precedence(token)) {
        const o2 = operatorStack.pop() as DelimToken;
        if ((o2 as any).isUnary) {
          const value = tree.pop();
          tree.push({ type: 'NEGATE', value });
        } else {
          const second = tree.pop();
          const first = tree.pop();
          tree.push(toNAryAstNode(o2, first, second));
        }
      }
      operatorStack.push(token);
      prevNonWhitespace = token;
    } else if (token instanceof LeftParenthesisToken) {
      operatorStack.push(token);
      prevNonWhitespace = token;
    } else if (token instanceof RightParenthesisToken) {
      if (!operatorStack.length) {
        return null;
      }
      while (!(last(operatorStack) instanceof LeftParenthesisToken)) {
        const o2 = operatorStack.pop() as DelimToken;
        if ((o2 as any).isUnary) {
          const value = tree.pop();
          tree.push({ type: 'NEGATE', value });
        } else {
          const second = tree.pop();
          const first = tree.pop();
          tree.push(toNAryAstNode(o2, first, second));
        }
      }
      if (!(last(operatorStack) instanceof LeftParenthesisToken)) {
        return null;
      }
      operatorStack.pop();
      prevNonWhitespace = token;
    } else if (token instanceof WhitespaceToken) {
      // Consume token
    } else {
      return null;
    }
  }

  while (operatorStack.length) {
    if (last(operatorStack) instanceof LeftParenthesisToken) {
      return null;
    }
    const o2 = operatorStack.pop() as DelimToken;
    if ((o2 as any).isUnary) {
      const value = tree.pop();
      tree.push({ type: 'NEGATE', value });
    } else {
      const second = tree.pop();
      const first = tree.pop();
      tree.push(toNAryAstNode(o2, first, second));
    }
  }
  return tree[0];
}

function transformToCSSNumericValue(node: any): CSSNumericValue {
  if (node.type === 'ADDITION') {
    return new CSSMathSum(...node.values.map((value: any) => transformToCSSNumericValue(value)));
  } else if (node.type === 'MULTIPLICATION') {
    return new CSSMathProduct(...node.values.map((value: any) => transformToCSSNumericValue(value)));
  } else if (node.type === 'NEGATE') {
    return new CSSMathNegate(transformToCSSNumericValue(node.value));
  } else if (node.type === 'INVERT') {
    return new CSSMathInvert(transformToCSSNumericValue(node.value));
  } else {
    if (node instanceof CSSSimpleBlock) {
      return reifyMathExpression(new CSSFunction('calc', node.value));
    } else if (node instanceof IdentToken) {
      if (node.value === 'e') {
        return new CSSUnitValue(Math.E, 'number');
      } else if (node.value === 'pi') {
        return new CSSUnitValue(Math.PI, 'number');
      } else {
        throw new SyntaxError('Invalid math expression');
      }
    } else {
      return reifyNumericValue(node);
    }
  }
}

function reifyMathExpression(num: CSSFunction): CSSNumericValue {
  if (num.name === 'min' || num.name === 'max') {
    const values = num.values
      .filter(value => !(value instanceof WhitespaceToken || value instanceof CommaToken))
      .map(value => simplifyCalculation(reifyMathExpression(new CSSFunction('calc', value))));
    return num.name === 'min' ? new CSSMathMin(...values) : new CSSMathMax(...values);
  }

  if (num.name !== 'calc') {
    throw new SyntaxError('Expected calc(), min() or max()');
  }

  const root = convertTokensToAST([...num.values]);
  const numericValue = transformToCSSNumericValue(root);
  let simplifiedValue: CSSNumericValue;
  try {
    simplifiedValue = simplifyCalculation(numericValue);
  } catch (e) {
    throw new TypeError('Failed to simplify calculation');
  }
  if (simplifiedValue instanceof CSSUnitValue) {
    return new CSSMathSum(simplifiedValue);
  } else {
    return simplifiedValue;
  }
}

function reifyNumericValue(num: any): CSSNumericValue {
  if (num instanceof CSSFunction && ['calc', 'min', 'max', 'clamp'].includes(num.name)) {
    return reifyMathExpression(num);
  }
  if (num instanceof NumberToken && num.value === 0 && !(num as any).unit) {
    return new CSSUnitValue(0, 'px');
  }
  if (num instanceof NumberToken) {
    return new CSSUnitValue(num.value, 'number');
  } else if (num instanceof PercentageToken) {
    return new CSSUnitValue(num.value, 'percent');
  } else if (num instanceof DimensionToken) {
    return new CSSUnitValue(num.value, num.unit);
  }
  throw new TypeError('Invalid numeric token');
}

export function parseCSSNumericValue(cssText: string): CSSNumericValue {
  const result = parseComponentValue(cssText);
  if (result === null) {
    throw new SyntaxError('Invalid CSS numeric value');
  }
  if (!(result instanceof NumberToken || result instanceof PercentageToken || result instanceof DimensionToken || result instanceof CSSFunction)) {
    throw new SyntaxError('Invalid CSS numeric value');
  }
  if (result instanceof DimensionToken) {
    const type = createAType(result.unit);
    if (type === null) {
      throw new SyntaxError('Invalid unit');
    }
  }
  return reifyNumericValue(result);
}
