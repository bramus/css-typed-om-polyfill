export abstract class Token {}

export class IdentToken extends Token {
  constructor(public value: string) {
    super();
  }
}

export class FunctionToken extends Token {
  constructor(public value: string) {
    super();
  }
}

export class AtKeywordToken extends Token {
  constructor(public value: string) {
    super();
  }
}

export class HashToken extends Token {
  constructor(public value: string, public type: 'id' | 'unrestricted' = 'unrestricted') {
    super();
  }
}

export class StringToken extends Token {
  constructor(public value: string) {
    super();
  }
}

export class BadStringToken extends Token {}

export class UrlToken extends Token {
  constructor(public value: string) {
    super();
  }
}

export class BadUrlToken extends Token {}

export class DelimToken extends Token {
  constructor(public value: string) {
    super();
  }
}

export class NumberToken extends Token {
  constructor(public value: number, public type: 'integer' | 'number' = 'integer') {
    super();
  }
}

export class PercentageToken extends Token {
  constructor(public value: number) {
    super();
  }
}

export class DimensionToken extends Token {
  constructor(public value: number, public type: 'integer' | 'number', public unit: string) {
    super();
  }
}

export class WhitespaceToken extends Token {}

export class CDOToken extends Token {}

export class CDCToken extends Token {}

export class ColonToken extends Token {}

export class SemicolonToken extends Token {}

export class CommaToken extends Token {}

export class LeftSquareBracketToken extends Token {}

export class RightSquareBracketToken extends Token {}

export class LeftParenthesisToken extends Token {}

export class RightParenthesisToken extends Token {}

export class LeftCurlyBracketToken extends Token {}

export class RightCurlyBracketToken extends Token {}

class InputStream {
  index = 0;
  constructor(public input: string) {}

  consume(): number | undefined {
    const codePoint = this.input.codePointAt(this.index);
    if (typeof codePoint !== 'undefined') {
      this.index += String.fromCodePoint(codePoint).length;
    }
    return codePoint;
  }

  reconsume(codePoint: number | undefined): void {
    if (typeof codePoint !== 'undefined') {
      this.index -= String.fromCodePoint(codePoint).length;
    }
  }

  peek(): (number | undefined)[] {
    const codePoints: (number | undefined)[] = [];
    let position = this.index;
    for (let i = 0; i < 3 && position < this.input.length; i++) {
      const nextCodePoint = this.input.codePointAt(position);
      codePoints.push(nextCodePoint);
      if (typeof nextCodePoint !== 'undefined') {
        position += String.fromCodePoint(nextCodePoint).length;
      } else {
        break;
      }
    }
    return codePoints;
  }
}

function isNewline(codePoint: number | undefined): boolean {
  return codePoint === 0x000A;
}

function isWhitespace(codePoint: number | undefined): boolean {
  return isNewline(codePoint) || codePoint === 0x2000 || codePoint === 0x0020;
}

function isDigit(codePoint: number | undefined): boolean {
  return typeof codePoint === 'number' && codePoint >= 0x0030 && codePoint <= 0x0039;
}

function isHexDigit(codePoint: number | undefined): boolean {
  if (typeof codePoint !== 'number') return false;
  return isDigit(codePoint) ||
    (codePoint >= 0x0041 && codePoint <= 0x0046) ||
    (codePoint >= 0x0061 && codePoint <= 0x0066);
}

function isUppercaseLetter(codePoint: number | undefined): boolean {
  return typeof codePoint === 'number' && codePoint >= 0x0041 && codePoint <= 0x005A;
}

function isLowercaseLetter(codePoint: number | undefined): boolean {
  return typeof codePoint === 'number' && codePoint >= 0x0061 && codePoint <= 0x007A;
}

function isLetter(codePoint: number | undefined): boolean {
  return isUppercaseLetter(codePoint) || isLowercaseLetter(codePoint);
}

function nonASCIICodePoint(codePoint: number | undefined): boolean {
  return typeof codePoint === 'number' && codePoint >= 0x0080;
}

function isIdentStartCodePoint(codePoint: number | undefined): boolean {
  return isLetter(codePoint) || nonASCIICodePoint(codePoint) || codePoint === 0x005F;
}

function isIdentCodePoint(codePoint: number | undefined): boolean {
  return isIdentStartCodePoint(codePoint) || isDigit(codePoint) || codePoint === 0x002D;
}

function isNonPrintableCodePoint(codePoint: number | undefined): boolean {
  if (typeof codePoint !== 'number') return false;
  return (codePoint >= 0x0000 && codePoint <= 0x0008) || codePoint === 0x000B ||
    (codePoint >= 0x000E && codePoint <= 0x001F) || codePoint === 0x007F;
}

function validEscape(firstCodePoint: number | undefined, secondCodePoint: number | undefined): boolean {
  return firstCodePoint === 0x005C && !isNewline(secondCodePoint);
}

function startsIdentSequence(
  firstCodePoint: number | undefined,
  secondCodePoint: number | undefined,
  thirdCodePoint: number | undefined
): boolean {
  if (firstCodePoint === 0x002D) {
    return isIdentStartCodePoint(secondCodePoint) || secondCodePoint === 0x002D ||
      validEscape(secondCodePoint, thirdCodePoint);
  } else if (isIdentStartCodePoint(firstCodePoint)) {
    return true;
  } else if (firstCodePoint === 0x005C) {
    return validEscape(firstCodePoint, secondCodePoint);
  } else {
    return false;
  }
}

function startsNumber(
  firstCodePoint: number | undefined,
  secondCodePoint: number | undefined,
  thirdCodePoint: number | undefined
): boolean {
  if (firstCodePoint === 0x002B || firstCodePoint === 0x002D) {
    return isDigit(secondCodePoint) || (secondCodePoint === 0x002E && isDigit(thirdCodePoint));
  } else if (firstCodePoint === 0x002E) {
    return isDigit(secondCodePoint);
  } else {
    return isDigit(firstCodePoint);
  }
}

function consumeEscapedCodePoint(input: InputStream): number {
  const codePoint = input.consume();
  if (isHexDigit(codePoint)) {
    const digits: number[] = [codePoint!];
    while (isHexDigit(input.peek()[0]) && digits.length < 5) {
      digits.push(input.consume()!);
    }
    if (isWhitespace(input.peek()[0])) {
      input.consume();
    }
    const hexStr = String.fromCodePoint(...digits);
    const numValue = parseInt(hexStr, 16);
    if (numValue === 0 || numValue > 0x10FFFF) {
      return 0xFFFD;
    } else {
      return numValue;
    }
  } else if (typeof codePoint === 'undefined') {
    return 0xFFFD;
  } else {
    return codePoint;
  }
}

function consumeStringToken(input: InputStream, endingCodePoint: number): Token {
  let value = '';
  while (true) {
    const codePoint = input.consume();
    if (codePoint === endingCodePoint) {
      return new StringToken(value);
    } else if (typeof codePoint === 'undefined') {
      return new StringToken(value);
    } else if (codePoint === 0x000A) {
      input.reconsume(codePoint);
      return new BadStringToken();
    } else if (codePoint === 0x005C) {
      const nextCodePoint = input.peek()[0];
      if (typeof nextCodePoint === 'undefined') {
        // Do nothing
      } else if (isNewline(nextCodePoint)) {
        input.consume();
      } else {
        value += String.fromCodePoint(consumeEscapedCodePoint(input));
      }
    } else {
      value += String.fromCodePoint(codePoint);
    }
  }
}

function consumeIdentSequence(input: InputStream): string {
  let result = '';
  while (true) {
    const codePoint = input.consume();
    if (isIdentCodePoint(codePoint)) {
      result += String.fromCodePoint(codePoint!);
    } else if (validEscape(codePoint, input.peek()[0])) {
      // Reconsume and consume escape
      input.reconsume(codePoint);
      result += String.fromCodePoint(consumeEscapedCodePoint(input));
    } else {
      input.reconsume(codePoint);
      return result;
    }
  }
}

function consumeNumber(input: InputStream): { value: number; type: 'integer' | 'number' } {
  let type: 'integer' | 'number' = 'integer';
  let repr = '';

  const next1 = input.peek()[0];
  if (next1 === 0x002B || next1 === 0x002D) {
    repr += String.fromCodePoint(input.consume()!);
  }

  while (isDigit(input.peek()[0])) {
    repr += String.fromCodePoint(input.consume()!);
  }

  const peek2 = input.peek();
  if (peek2[0] === 0x002E && isDigit(peek2[1])) {
    repr += String.fromCodePoint(input.consume()!, input.consume()!);
    type = 'number';
    while (isDigit(input.peek()[0])) {
      repr += String.fromCodePoint(input.consume()!);
    }
  }

  const peek3 = input.peek();
  if (peek3[0] === 0x0045 || peek3[0] === 0x0065) {
    if ((peek3[1] === 0x002D || peek3[1] === 0x002B) && isDigit(peek3[2])) {
      repr += String.fromCodePoint(input.consume()!, input.consume()!, input.consume()!);
      type = 'number';
    } else if (isDigit(peek3[1])) {
      repr += String.fromCodePoint(input.consume()!, input.consume()!);
      type = 'number';
    }
  }

  const value = parseFloat(repr);
  return { value, type };
}

function consumeNumericToken(input: InputStream): Token {
  const num = consumeNumber(input);
  const peek3 = input.peek();
  if (startsIdentSequence(peek3[0], peek3[1], peek3[2])) {
    const unit = consumeIdentSequence(input);
    return new DimensionToken(num.value, num.type, unit);
  } else if (input.peek()[0] === 0x0025) {
    input.consume();
    return new PercentageToken(num.value);
  } else {
    return new NumberToken(num.value, num.type);
  }
}

function consumeRemnantsOfBadUrl(input: InputStream): void {
  while (true) {
    const codePoint = input.consume();
    if (codePoint === 0x0029 || typeof codePoint === 'undefined') {
      return;
    } else if (validEscape(codePoint, input.peek()[0])) {
      input.reconsume(codePoint);
      consumeEscapedCodePoint(input);
    }
  }
}

function consumeUrlToken(input: InputStream): Token {
  let value = '';
  while (isWhitespace(input.peek()[0])) {
    input.consume();
  }

  while (true) {
    const codePoint = input.consume();
    if (codePoint === 0x0029) {
      return new UrlToken(value);
    } else if (typeof codePoint === 'undefined') {
      return new UrlToken(value);
    } else if (isWhitespace(codePoint)) {
      while (isWhitespace(input.peek()[0])) {
        input.consume();
      }
      const next = input.peek()[0];
      if (next === 0x0029 || typeof next === 'undefined') {
        input.consume();
        return new UrlToken(value);
      } else {
        consumeRemnantsOfBadUrl(input);
        return new BadUrlToken();
      }
    } else if (codePoint === 0x0022 || codePoint === 0x0027 || codePoint === 0x0028 || isNonPrintableCodePoint(codePoint)) {
      consumeRemnantsOfBadUrl(input);
      return new BadUrlToken();
    } else if (codePoint === 0x005C) {
      if (validEscape(codePoint, input.peek()[0])) {
        value += String.fromCodePoint(consumeEscapedCodePoint(input));
      } else {
        consumeRemnantsOfBadUrl(input);
        return new BadUrlToken();
      }
    } else {
      value += String.fromCodePoint(codePoint);
    }
  }
}

function consumeIdentLikeToken(input: InputStream): Token {
  const str = consumeIdentSequence(input);
  if (str.toLowerCase() === 'url' && input.peek()[0] === 0x0028) {
    input.consume();
    while (isWhitespace(input.peek()[0]) && isWhitespace(input.peek()[1])) {
      input.consume();
    }
    const next = input.peek()[0];
    const next2 = input.peek()[1];
    if (next === 0x0022 || next === 0x0027 || (isWhitespace(next) && (next2 === 0x0022 || next2 === 0x0027))) {
      return new FunctionToken(str);
    } else {
      return consumeUrlToken(input);
    }
  } else if (input.peek()[0] === 0x0028) {
    input.consume();
    return new FunctionToken(str);
  } else {
    return new IdentToken(str);
  }
}

function consumeToken(input: InputStream): Token | undefined {
  const codePoint = input.consume();
  const lookahead = input.peek();

  if (typeof codePoint === 'undefined') {
    return undefined;
  }

  if (isWhitespace(codePoint)) {
    while (isWhitespace(input.peek()[0])) {
      input.consume();
    }
    return new WhitespaceToken();
  } else if (codePoint === 0x0022) {
    return consumeStringToken(input, codePoint);
  } else if (codePoint === 0x0023) {
    if (isIdentCodePoint(lookahead[0]) || validEscape(lookahead[0], lookahead[1])) {
      let type: 'id' | 'unrestricted' = 'unrestricted';
      if (startsIdentSequence(lookahead[0], lookahead[1], lookahead[2])) {
        type = 'id';
      }
      const value = consumeIdentSequence(input);
      return new HashToken(value, type);
    } else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x0027) {
    return consumeStringToken(input, codePoint);
  } else if (codePoint === 0x0028) {
    return new LeftParenthesisToken();
  } else if (codePoint === 0x0029) {
    return new RightParenthesisToken();
  } else if (codePoint === 0x002B) {
    if (startsNumber(lookahead[0], lookahead[1], lookahead[2])) {
      input.reconsume(codePoint);
      return consumeNumericToken(input);
    } else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x002C) {
    return new CommaToken();
  } else if (codePoint === 0x002D) {
    if (startsNumber(lookahead[0], lookahead[1], lookahead[2])) {
      input.reconsume(codePoint);
      return consumeNumericToken(input);
    } else if (lookahead[0] === 0x002D && lookahead[1] === 0x003E) {
      input.consume();
      input.consume();
      return new CDCToken();
    } else if (startsIdentSequence(lookahead[0], lookahead[1], lookahead[2])) {
      input.reconsume(codePoint);
      return consumeIdentLikeToken(input);
    } else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x002E) {
    if (startsNumber(lookahead[0], lookahead[1], lookahead[2])) {
      input.reconsume(codePoint);
      return consumeNumericToken(input);
    } else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x003A) {
    return new ColonToken();
  } else if (codePoint === 0x003B) {
    return new SemicolonToken();
  } else if (codePoint === 0x003C) {
    if (lookahead[0] === 0x0021 && lookahead[1] === 0x002D && lookahead[2] === 0x002D) {
      input.consume();
      input.consume();
      input.consume();
      return new CDOToken();
    } else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x0040) {
    if (startsIdentSequence(lookahead[0], lookahead[1], lookahead[2])) {
      return new AtKeywordToken(consumeIdentSequence(input));
    } else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x005B) {
    return new LeftSquareBracketToken();
  } else if (codePoint === 0x005C) {
    if (validEscape(lookahead[0], lookahead[1])) {
      input.reconsume(codePoint);
      return consumeIdentLikeToken(input);
    } else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x005D) {
    return new RightSquareBracketToken();
  } else if (codePoint === 0x007B) {
    return new LeftCurlyBracketToken();
  } else if (codePoint === 0x007D) {
    return new RightCurlyBracketToken();
  } else if (isDigit(codePoint)) {
    input.reconsume(codePoint);
    return consumeNumericToken(input);
  } else if (isIdentStartCodePoint(codePoint)) {
    input.reconsume(codePoint);
    return consumeIdentLikeToken(input);
  } else {
    return new DelimToken(String.fromCodePoint(codePoint));
  }
}

export function tokenizeString(str: string): Token[] {
  const input = new InputStream(str);
  const tokens: Token[] = [];
  while (true) {
    const token = consumeToken(input);
    if (typeof token === 'undefined') {
      return tokens;
    } else {
      tokens.push(token);
    }
  }
}
