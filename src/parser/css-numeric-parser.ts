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
  CSSMathClamp,
  addTypes,
  createEmptyType,
  type CSSNumericType
} from '../css-numeric-value';
import { simplifyCalculation } from './simplify-calculation';
import {
  createAType,
  getSetOfCompatibleUnits,
  convertCSSUnitValue,
  type UnitMap,
  type UnitGroup
} from './unit-utils';

type SumValueItem = [number, UnitMap];
type SumValue = SumValueItem[];

const baseTypes = ["percent", "length", "angle", "time", "frequency", "resolution", "flex"];

function productOfTwoUnitMaps(units1: UnitMap, units2: UnitMap): UnitMap {
  const result = { ...units1 };
  for (const unit of Object.keys(units2)) {
    const val2 = units2[unit];
    if (val2 !== undefined) {
      const val1 = result[unit];
      if (val1 !== undefined) {
        const sum = val1 + val2;
        if (sum === 0) {
          delete result[unit];
        } else {
          result[unit] = sum;
        }
      } else {
        if (val2 !== 0) {
          result[unit] = val2;
        }
      }
    }
  }
  return result;
}



type CSSNumericTypeNumericKeys = Exclude<keyof CSSNumericType, 'percentHint'>;

function unitMapsEqual(m1: Record<string, number>, m2: Record<string, number>): boolean {
  const keys1 = Object.keys(m1);
  const keys2 = Object.keys(m2);
  if (keys1.length !== keys2.length) return false;
  for (const k of keys1) {
    if (m1[k] !== m2[k]) return false;
  }
  return true;
}

function multiplyTypes(t1: CSSNumericType, t2: CSSNumericType): CSSNumericType | null {
  const result = createEmptyType();
  for (const key of Object.keys(result) as (keyof CSSNumericType)[]) {
    if (key === 'percentHint') continue;
    result[key] = ((t1[key] as number) || 0) + ((t2[key] as number) || 0);
  }
  const h1 = t1.percentHint;
  const h2 = t2.percentHint;
  if (h1 && h2 && h1 !== h2) {
    return null;
  }
  result.percentHint = h1 || h2;
  return result;
}

function createTypeFromUnitMap(unitMap: UnitMap): CSSNumericType | null {
  let result = createEmptyType();
  for (const [unit, power] of Object.entries(unitMap)) {
    const rawType = createAType(unit);
    if (rawType === null) return null;
    const type = createEmptyType();
    for (const [k, v] of Object.entries(rawType)) {
      type[k as CSSNumericTypeNumericKeys] = v * power;
    }
    const multiplied = multiplyTypes(result, type);
    if (multiplied === null) return null;
    result = multiplied;
  }
  return result;
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
  } else if (cssNumericValue instanceof CSSMathSum) {
    const values: SumValue = [];
    for (const item of cssNumericValue.values) {
      const val = createSumValue(item);
      if (val === null) {
        return null;
      }
      for (const subvalue of val) {
        const existing = values.find(v => unitMapsEqual(v[1], subvalue[1]));
        if (existing) {
          existing[0] += subvalue[0];
        } else {
          values.push([subvalue[0], { ...subvalue[1] }]);
        }
      }
    }
    if (values.length > 0) {
      let sumType = createTypeFromUnitMap(values[0]![1]);
      if (sumType === null) return null;
      for (let i = 1; i < values.length; i++) {
        const nextType = createTypeFromUnitMap(values[i]![1]);
        if (nextType === null) return null;
        const added = addTypes(sumType, nextType);
        if (added === null) return null;
        sumType = added;
      }
    }
    return values;
  } else if (cssNumericValue instanceof CSSMathNegate) {
    const values = createSumValue(cssNumericValue.value);
    if (values === null) {
      return null;
    }
    for (const item of values) {
      item[0] = -item[0];
    }
    return values;
  } else if (cssNumericValue instanceof CSSMathMin || cssNumericValue instanceof CSSMathMax) {
    const isMin = cssNumericValue instanceof CSSMathMin;
    const args: SumValue[] = [];
    for (const item of cssNumericValue.values) {
      const val = createSumValue(item);
      if (val === null || val.length > 1) {
        return null;
      }
      args.push(val);
    }
    if (args.length === 0) return null;
    const firstUnitMap = args[0]![0]![1];
    for (let i = 1; i < args.length; i++) {
      if (!unitMapsEqual(firstUnitMap, args[i]![0]![1])) {
        return null;
      }
    }
    let targetArg = args[0]![0]!;
    for (let i = 1; i < args.length; i++) {
      const current = args[i]![0]!;
      if (isMin) {
        if (current[0] < targetArg[0]) {
          targetArg = current;
        }
      } else {
        if (current[0] > targetArg[0]) {
          targetArg = current;
        }
      }
    }
    return [ [targetArg[0], { ...targetArg[1] }] ];
  } else if (cssNumericValue instanceof CSSMathClamp) {
    const lowerSum = createSumValue(cssNumericValue.lower);
    const valueSum = createSumValue(cssNumericValue.value);
    const upperSum = createSumValue(cssNumericValue.upper);

    if (lowerSum === null || lowerSum.length > 1 ||
        valueSum === null || valueSum.length > 1 ||
        upperSum === null || upperSum.length > 1) {
      return null;
    }

    const lowerVal = lowerSum[0]!;
    const valueVal = valueSum[0]!;
    const upperVal = upperSum[0]!;

    if (!unitMapsEqual(lowerVal[1], valueVal[1]) || !unitMapsEqual(valueVal[1], upperVal[1])) {
      return null;
    }

    const resolvedValue = Math.max(lowerVal[0], Math.min(valueVal[0], upperVal[0]));
    return [ [resolvedValue, { ...valueVal[1] }] ];
  } else {
    return null;
  }
}

export function to(cssNumericValue: CSSNumericValue, unit: string): CSSUnitValue {
  const type = createAType(unit);
  if (type === null) {
    throw new DOMException("The string did not match the expected pattern.", "SyntaxError");
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



export function toSum(cssNumericValue: CSSNumericValue, ...units: string[]): CSSMathSum {
  if (units && units.length) {
    for (const unit of units) {
      if (createAType(unit) === null) {
        throw new DOMException(`Invalid unit: ${unit}`, 'SyntaxError');
      }
    }
    const uniqueUnits = new Set(units);
    if (uniqueUnits.size !== units.length) {
      throw new TypeError("Duplicate units are not allowed");
    }
  }

  const sum = createSumValue(cssNumericValue);
  if (!sum) {
    throw new TypeError("Failed to create sum value");
  }

  const values: CSSUnitValue[] = [];
  for (const item of sum) {
    const val = createCSSUnitValue(item);
    if (val === null) {
      throw new TypeError("Failed to create CSSUnitValue from sum item");
    }
    values.push(val);
  }

  if (!units || units.length === 0) {
    values.sort((a, b) => a.unit.localeCompare(b.unit));
    return new CSSMathSum(...values);
  }

  const result: CSSUnitValue[] = [];
  const remainingValues = [...values];

  for (const unit of units) {
    let tempValue = 0;
    for (let i = remainingValues.length - 1; i >= 0; i--) {
      const value = remainingValues[i]!;
      const converted = convertCSSUnitValue(value, unit);
      if (converted !== null) {
        tempValue += converted.value;
        remainingValues.splice(i, 1);
      }
    }
    result.push(new CSSUnitValue(tempValue, unit));
  }

  if (remainingValues.length > 0) {
    throw new TypeError("Leftover units that were not asked for");
  }

  return new CSSMathSum(...result);
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
        throw new DOMException('Invalid math expression', 'SyntaxError');
      }
    } else {
      return reifyNumericValue(node);
    }
  }
}

function splitTokensByComma(tokens: any[]): any[][] {
  const args: any[][] = [];
  let currentArg: any[] = [];
  for (const token of tokens) {
    if (token instanceof CommaToken) {
      args.push(currentArg);
      currentArg = [];
    } else {
      currentArg.push(token);
    }
  }
  args.push(currentArg);
  return args;
}

function reifyMathExpression(num: CSSFunction): CSSNumericValue {
  if (num.name === 'min' || num.name === 'max' || num.name === 'clamp') {
    const args = splitTokensByComma(num.values);
    const parsedArgs = args.map(arg => {
      // Remove leading/trailing whitespace to check for empty arguments
      const trimmed = arg.filter(t => !(t instanceof WhitespaceToken));
      if (trimmed.length === 0) {
        throw new DOMException('Empty argument in math function', 'SyntaxError');
      }
      return simplifyCalculation(reifyMathExpression(new CSSFunction('calc', arg)));
    });

    if (num.name === 'min') {
      return new CSSMathMin(...parsedArgs);
    } else if (num.name === 'max') {
      return new CSSMathMax(...parsedArgs);
    } else {
      if (parsedArgs.length !== 3) {
        throw new DOMException('clamp() requires exactly 3 arguments', 'SyntaxError');
      }
      return new CSSMathClamp(parsedArgs[0]!, parsedArgs[1]!, parsedArgs[2]!);
    }
  }

  if (num.name !== 'calc') {
    throw new DOMException('Expected calc(), min(), max() or clamp()', 'SyntaxError');
  }

  const root = convertTokensToAST([...num.values]);
  const numericValue = transformToCSSNumericValue(root);
  let simplifiedValue: CSSNumericValue;
  try {
    simplifiedValue = simplifyCalculation(numericValue);
  } catch (e) {
    throw new DOMException('Failed to simplify calculation', 'SyntaxError');
  }
  if (simplifiedValue instanceof CSSUnitValue) {
    return new CSSMathSum(simplifiedValue);
  } else {
    return simplifiedValue;
  }
}

// https://drafts.css-houdini.org/css-typed-om-1/#reify-a-numeric-value
function reifyNumericValue(num: any): CSSNumericValue {
  if (num instanceof CSSFunction && ['calc', 'min', 'max', 'clamp'].includes(num.name)) {
    return reifyMathExpression(num);
  }
  // Special case for unitless 0.
  if (num instanceof NumberToken && num.value === 0 && !(num as any).unit) {
    return new CSSUnitValue(0, 'px');
  }
  // 1. If value is a <number-token>, return a new CSSUnitValue(value's value, "number").
  if (num instanceof NumberToken) {
    return new CSSUnitValue(num.value, 'number');
  }
  // 2. If value is a <percentage-token>, return a new CSSUnitValue(value's value, "percent").
  else if (num instanceof PercentageToken) {
    return new CSSUnitValue(num.value, 'percent');
  }
  // 3. If value is a <dimension-token>, return a new CSSUnitValue(value's value, value's unit).
  else if (num instanceof DimensionToken) {
    return new CSSUnitValue(num.value, num.unit);
  }
  throw new DOMException('Invalid numeric token', 'SyntaxError');
}

// https://drafts.css-houdini.org/css-typed-om-1/#dom-cssnumericvalue-parse
export function parseCSSNumericValue(cssText: string): CSSNumericValue {
  // 1. Parse a component value from cssText and let result be the result.
  const result = parseComponentValue(cssText);
  // If result is a syntax error, throw a SyntaxError.
  if (result === null) {
    throw new DOMException('Invalid CSS numeric value', 'SyntaxError');
  }
  // 2. If result is not a <number-token>, <percentage-token>, <dimension-token>, or a math function, throw a SyntaxError.
  if (!(result instanceof NumberToken || result instanceof PercentageToken || result instanceof DimensionToken || result instanceof CSSFunction)) {
    throw new DOMException('Invalid CSS numeric value', 'SyntaxError');
  }
  // 3. If result is a <dimension-token> and creating a type from result’s unit returns failure, throw a SyntaxError.
  if (result instanceof DimensionToken) {
    const type = createAType(result.unit);
    if (type === null) {
      throw new DOMException('Invalid unit', 'SyntaxError');
    }
  }
  // 4. Reify a numeric value result, and return the result.
  try {
    return reifyNumericValue(result);
  } catch (e) {
    if (e instanceof TypeError || e instanceof RangeError) {
      throw new DOMException(e.message, 'SyntaxError');
    }
    throw e;
  }
}
