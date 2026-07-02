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

// Helper class representing the input stream of code points.
// https://drafts.csswg.org/css-syntax-3/#input-stream
class InputStream {
  index = 0;
  constructor(public input: string) {}

  // https://drafts.csswg.org/css-syntax-3/#consume-the-next-input-code-point
  consume(): number | undefined {
    const codePoint = this.input.codePointAt(this.index);
    if (typeof codePoint !== 'undefined') {
      this.index += String.fromCodePoint(codePoint).length;
    }
    return codePoint;
  }

  // https://drafts.csswg.org/css-syntax-3/#reconsume-the-current-input-code-point
  reconsume(codePoint: number | undefined): void {
    if (typeof codePoint !== 'undefined') {
      this.index -= String.fromCodePoint(codePoint).length;
    }
  }

  // https://drafts.csswg.org/css-syntax-3/#next-input-code-point
  // Peeks at the next 3 code points (lookahead).
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

// https://drafts.csswg.org/css-syntax-3/#newline
// U+000A LINE FEED. Note: U+000D CARRIAGE RETURN and U+000C FORM FEED are assumed to be
// preprocessed to U+000A.
function isNewline(codePoint: number | undefined): boolean {
  return codePoint === 0x000A;
}

// https://drafts.csswg.org/css-syntax-3/#whitespace
// A newline, U+0009 CHARACTER TABULATION, or U+0020 SPACE.
function isWhitespace(codePoint: number | undefined): boolean {
  return isNewline(codePoint) || codePoint === 0x0009 || codePoint === 0x0020;
}

// https://drafts.csswg.org/css-syntax-3/#digit
function isDigit(codePoint: number | undefined): boolean {
  return typeof codePoint === 'number' && codePoint >= 0x0030 && codePoint <= 0x0039;
}

// https://drafts.csswg.org/css-syntax-3/#hex-digit
function isHexDigit(codePoint: number | undefined): boolean {
  if (typeof codePoint !== 'number') return false;
  return isDigit(codePoint) ||
    (codePoint >= 0x0041 && codePoint <= 0x0046) ||
    (codePoint >= 0x0061 && codePoint <= 0x0066);
}

// https://drafts.csswg.org/css-syntax-3/#uppercase-letter
function isUppercaseLetter(codePoint: number | undefined): boolean {
  return typeof codePoint === 'number' && codePoint >= 0x0041 && codePoint <= 0x005A;
}

// https://drafts.csswg.org/css-syntax-3/#lowercase-letter
function isLowercaseLetter(codePoint: number | undefined): boolean {
  return typeof codePoint === 'number' && codePoint >= 0x0061 && codePoint <= 0x007A;
}

// https://drafts.csswg.org/css-syntax-3/#letter
function isLetter(codePoint: number | undefined): boolean {
  return isUppercaseLetter(codePoint) || isLowercaseLetter(codePoint);
}

// https://drafts.csswg.org/css-syntax-3/#non-ascii-code-point
function nonASCIICodePoint(codePoint: number | undefined): boolean {
  return typeof codePoint === 'number' && codePoint >= 0x0080;
}

// https://drafts.csswg.org/css-syntax-3/#identifier-start-code-point
function isIdentStartCodePoint(codePoint: number | undefined): boolean {
  return isLetter(codePoint) || nonASCIICodePoint(codePoint) || codePoint === 0x005F;
}

// https://drafts.csswg.org/css-syntax-3/#identifier-code-point
function isIdentCodePoint(codePoint: number | undefined): boolean {
  return isIdentStartCodePoint(codePoint) || isDigit(codePoint) || codePoint === 0x002D;
}

// https://drafts.csswg.org/css-syntax-3/#non-printable-code-point
function isNonPrintableCodePoint(codePoint: number | undefined): boolean {
  if (typeof codePoint !== 'number') return false;
  return (codePoint >= 0x0000 && codePoint <= 0x0008) || codePoint === 0x000B ||
    (codePoint >= 0x000E && codePoint <= 0x001F) || codePoint === 0x007F;
}

// https://drafts.csswg.org/css-syntax-3/#starts-a-valid-escape
function validEscape(firstCodePoint: number | undefined, secondCodePoint: number | undefined): boolean {
  // 1. If the first code point is not U+005C REVERSE SOLIDUS (\), return false.
  // 2. Otherwise, if the second code point is a newline, return false.
  // 3. Otherwise, return true.
  return firstCodePoint === 0x005C && !isNewline(secondCodePoint);
}

// https://drafts.csswg.org/css-syntax-3/#would-start-an-identifier
function startsIdentSequence(
  firstCodePoint: number | undefined,
  secondCodePoint: number | undefined,
  thirdCodePoint: number | undefined
): boolean {
  // 1. Look at the first code point:
  if (firstCodePoint === 0x002D) {
    // U+002D HYPHEN-MINUS (-)
    // If the second code point is an identifier-start code point or a U+002D HYPHEN-MINUS (-),
    // or the second and third code points start a valid escape, return true. Otherwise, return false.
    return isIdentStartCodePoint(secondCodePoint) || secondCodePoint === 0x002D ||
      validEscape(secondCodePoint, thirdCodePoint);
  } else if (isIdentStartCodePoint(firstCodePoint)) {
    // identifier-start code point
    // Return true.
    return true;
  } else if (firstCodePoint === 0x005C) {
    // U+005C REVERSE SOLIDUS (\)
    // If the first and second code points start a valid escape, return true. Otherwise, return false.
    return validEscape(firstCodePoint, secondCodePoint);
  } else {
    // anything else
    // Return false.
    return false;
  }
}

// https://drafts.csswg.org/css-syntax-3/#starts-a-number
function startsNumber(
  firstCodePoint: number | undefined,
  secondCodePoint: number | undefined,
  thirdCodePoint: number | undefined
): boolean {
  // 1. Look at the first code point:
  if (firstCodePoint === 0x002B || firstCodePoint === 0x002D) {
    // U+002B PLUS SIGN (+) or U+002D HYPHEN-MINUS (-)
    // If the second code point is a digit, return true.
    // Otherwise, if the second code point is U+002E FULL STOP (.) and the third code point is a digit, return true.
    // Otherwise, return false.
    return isDigit(secondCodePoint) || (secondCodePoint === 0x002E && isDigit(thirdCodePoint));
  } else if (firstCodePoint === 0x002E) {
    // U+002E FULL STOP (.)
    // If the second code point is a digit, return true. Otherwise, return false.
    return isDigit(secondCodePoint);
  } else {
    // digit
    // Return true.
    // anything else
    // Return false.
    return isDigit(firstCodePoint);
  }
}

// https://drafts.csswg.org/css-syntax-3/#consume-escaped-code-point
function consumeEscapedCodePoint(input: InputStream): number {
  // 1. Consume the next input code point.
  const codePoint = input.consume();
  // 2. hex digit:
  if (isHexDigit(codePoint)) {
    // Consume as many hex digits as possible, but no more than five more (total 6).
    const digits: number[] = [codePoint!];
    while (isHexDigit(input.peek()[0]) && digits.length < 6) {
      digits.push(input.consume()!);
    }
    // If the next input code point is whitespace, consume it.
    if (isWhitespace(input.peek()[0])) {
      input.consume();
    }
    // Interpret the hex digits as a hexadecimal number.
    const hexStr = String.fromCodePoint(...digits);
    const numValue = parseInt(hexStr, 16);
    // If this number is zero, or is for a surrogate, or is greater than the maximum allowed code point,
    // return U+FFFD REPLACEMENT CHARACTER ().
    if (numValue === 0 || numValue > 0x10FFFF) {
      return 0xFFFD;
    } else {
      // Otherwise, return the code point with that value.
      return numValue;
    }
  } else if (typeof codePoint === 'undefined') {
    // EOF
    // Return U+FFFD REPLACEMENT CHARACTER ().
    return 0xFFFD;
  } else {
    // anything else
    // Return the consumed code point.
    return codePoint;
  }
}

// https://drafts.csswg.org/css-syntax-3/#consume-string-token
function consumeStringToken(input: InputStream, endingCodePoint: number): Token {
  // 1. Create a string token with its value initially set to the empty string.
  let value = '';
  // 2. Repeatedly consume the next input code point:
  while (true) {
    const codePoint = input.consume();
    if (codePoint === endingCodePoint) {
      // ending code point: Return the string token.
      return new StringToken(value);
    } else if (typeof codePoint === 'undefined') {
      // EOF: This is a parse error. Return the string token.
      return new StringToken(value);
    } else if (codePoint === 0x000A) {
      // newline: This is a parse error. Reconsume the current input code point,
      // create a bad-string token, and return it.
      input.reconsume(codePoint);
      return new BadStringToken();
    } else if (codePoint === 0x005C) {
      // U+005C REVERSE SOLIDUS (\)
      const nextCodePoint = input.peek()[0];
      if (typeof nextCodePoint === 'undefined') {
        // If the next input code point is EOF, do nothing.
      } else if (isNewline(nextCodePoint)) {
        // Otherwise, if the next input code point is a newline, consume it.
        input.consume();
      } else {
        // Otherwise, run the "consume an escaped code point" algorithm,
        // and append the returned code point to the string token’s value.
        value += String.fromCodePoint(consumeEscapedCodePoint(input));
      }
    } else {
      // anything else: Append the code point to the string token’s value.
      value += String.fromCodePoint(codePoint);
    }
  }
}

// https://drafts.csswg.org/css-syntax-3/#consume-name
function consumeIdentSequence(input: InputStream): string {
  // 1. Let result be an empty string.
  let result = '';
  // 2. Repeatedly consume the next input code point:
  while (true) {
    const codePoint = input.consume();
    // name code point: Append the code point to result.
    if (isIdentCodePoint(codePoint)) {
      result += String.fromCodePoint(codePoint!);
    } else if (validEscape(codePoint, input.peek()[0])) {
      // the stream starts a valid escape: Reconsume the current input code point,
      // run the "consume an escaped code point" algorithm, and append the returned code point to result.
      input.reconsume(codePoint);
      result += String.fromCodePoint(consumeEscapedCodePoint(input));
    } else {
      // anything else: Reconsume the current input code point. Return result.
      input.reconsume(codePoint);
      return result;
    }
  }
}

// https://drafts.csswg.org/css-syntax-3/#consume-a-number
function consumeNumber(input: InputStream): { value: number; type: 'integer' | 'number' } {
  // 1. Let type be "integer". Let repr be the empty string.
  let type: 'integer' | 'number' = 'integer';
  let repr = '';

  // 2. If the next input code point is U+002B PLUS SIGN (+) or U+002D HYPHEN-MINUS (-),
  // consume it and append it to repr.
  const next1 = input.peek()[0];
  if (next1 === 0x002B || next1 === 0x002D) {
    repr += String.fromCodePoint(input.consume()!);
  }

  // 3. While the next input code point is a digit, consume it and append it to repr.
  while (isDigit(input.peek()[0])) {
    repr += String.fromCodePoint(input.consume()!);
  }

  // 4. If the next 2 input code points are U+002E FULL STOP (.) followed by a digit, then:
  const peek2 = input.peek();
  if (peek2[0] === 0x002E && isDigit(peek2[1])) {
    // 1. Consume them and append them to repr.
    repr += String.fromCodePoint(input.consume()!, input.consume()!);
    // 2. Set type to "number".
    type = 'number';
    // 3. While the next input code point is a digit, consume it and append it to repr.
    while (isDigit(input.peek()[0])) {
      repr += String.fromCodePoint(input.consume()!);
    }
  }

  // 5. If the next 2 or 3 input code points are U+0045 LATIN CAPITAL LETTER E (E)
  // or U+0065 LATIN SMALL LETTER E (e), optionally followed by U+002B PLUS SIGN (+)
  // or U+002D HYPHEN-MINUS (-), followed by a digit, then:
  const peek3 = input.peek();
  if (peek3[0] === 0x0045 || peek3[0] === 0x0065) {
    if ((peek3[1] === 0x002D || peek3[1] === 0x002B) && isDigit(peek3[2])) {
      // 1. Consume them and append them to repr.
      repr += String.fromCodePoint(input.consume()!, input.consume()!, input.consume()!);
      // 2. Set type to "number".
      type = 'number';
    } else if (isDigit(peek3[1])) {
      // 1. Consume them and append them to repr.
      repr += String.fromCodePoint(input.consume()!, input.consume()!);
      // 2. Set type to "number".
      type = 'number';
    }
  }

  // 6. Convert repr to a number. Return the number and type.
  const value = parseFloat(repr);
  return { value, type };
}

// https://drafts.csswg.org/css-syntax-3/#consume-numeric-token
function consumeNumericToken(input: InputStream): Token {
  // 1. Consume a number, and let number be the result.
  const num = consumeNumber(input);
  // 2. If the next 3 input code points would start an identifier, then:
  const peek3 = input.peek();
  if (startsIdentSequence(peek3[0], peek3[1], peek3[2])) {
    // 1. Consume a name, and let unit be the result.
    const unit = consumeIdentSequence(input);
    // 2. Create a <dimension-token> with its value set to number’s value,
    // its type flag set to number’s type, and its unit set to unit. Return it.
    return new DimensionToken(num.value, num.type, unit);
  }
  // 3. Otherwise, if the next input code point is U+0025 PERCENTAGE SIGN (%), then:
  else if (input.peek()[0] === 0x0025) {
    // 1. Consume the next input code point.
    input.consume();
    // 2. Create a <percentage-token> with its value set to number’s value. Return it.
    return new PercentageToken(num.value);
  }
  // 4. Otherwise:
  else {
    // 1. Create a <number-token> with its value set to number’s value and its type flag set to number’s type. Return it.
    return new NumberToken(num.value, num.type);
  }
}

// https://drafts.csswg.org/css-syntax-3/#consume-remnants-of-bad-url
function consumeRemnantsOfBadUrl(input: InputStream): void {
  // Repeatedly consume the next input code point:
  while (true) {
    const codePoint = input.consume();
    // U+0029 RIGHT PARENTHESIS ()) or EOF: Return.
    if (codePoint === 0x0029 || typeof codePoint === 'undefined') {
      return;
    }
    // the input stream starts a valid escape:
    else if (validEscape(codePoint, input.peek()[0])) {
      // Reconsume the current input code point, run the "consume an escaped code point" algorithm,
      // and discard the returned code point.
      input.reconsume(codePoint);
      consumeEscapedCodePoint(input);
    }
    // anything else: Do nothing.
  }
}

// https://drafts.csswg.org/css-syntax-3/#consume-url-token
function consumeUrlToken(input: InputStream): Token {
  // 1. Create a <url-token> with its value initially set to the empty string.
  let value = '';
  // 2. Consume as much whitespace as possible.
  while (isWhitespace(input.peek()[0])) {
    input.consume();
  }

  // 3. Repeatedly consume the next input code point:
  while (true) {
    const codePoint = input.consume();
    if (codePoint === 0x0029) {
      // U+0029 RIGHT PARENTHESIS ()): Return the <url-token>.
      return new UrlToken(value);
    } else if (typeof codePoint === 'undefined') {
      // EOF: This is a parse error. Return the <url-token>.
      return new UrlToken(value);
    } else if (isWhitespace(codePoint)) {
      // whitespace:
      // Consume as much whitespace as possible.
      while (isWhitespace(input.peek()[0])) {
        input.consume();
      }
      // If the next input code point is U+0029 RIGHT PARENTHESIS ()) or EOF, consume it and return the <url-token>.
      const next = input.peek()[0];
      if (next === 0x0029 || typeof next === 'undefined') {
        input.consume();
        return new UrlToken(value);
      }
      // Otherwise, run the "consume the remnants of a bad url" algorithm,
      // create a <bad-url-token>, and return it.
      else {
        consumeRemnantsOfBadUrl(input);
        return new BadUrlToken();
      }
    } else if (codePoint === 0x0022 || codePoint === 0x0027 || codePoint === 0x0028 || isNonPrintableCodePoint(codePoint)) {
      // U+0022 QUOTATION MARK ("), U+0027 APOSTROPHE ('), U+0028 LEFT PARENTHESIS ((), or non-printable code point:
      // This is a parse error. Run the "consume the remnants of a bad url" algorithm,
      // create a <bad-url-token>, and return it.
      consumeRemnantsOfBadUrl(input);
      return new BadUrlToken();
    } else if (codePoint === 0x005C) {
      // U+005C REVERSE SOLIDUS (\):
      // If the input stream starts a valid escape, run the "consume an escaped code point" algorithm,
      // and append the returned code point to the <url-token>’s value.
      if (validEscape(codePoint, input.peek()[0])) {
        value += String.fromCodePoint(consumeEscapedCodePoint(input));
      }
      // Otherwise, this is a parse error. Run the "consume the remnants of a bad url" algorithm,
      // create a <bad-url-token>, and return it.
      else {
        consumeRemnantsOfBadUrl(input);
        return new BadUrlToken();
      }
    } else {
      // anything else: Append the code point to the <url-token>’s value.
      value += String.fromCodePoint(codePoint);
    }
  }
}

// https://drafts.csswg.org/css-syntax-3/#consume-ident-like-token
function consumeIdentLikeToken(input: InputStream): Token {
  // 1. Consume a name, and let string be the result.
  const str = consumeIdentSequence(input);
  // 2. If string’s value is an ASCII case-insensitive match for "url",
  // and the next input code point is U+0028 LEFT PARENTHESIS ((), then:
  if (str.toLowerCase() === 'url' && input.peek()[0] === 0x0028) {
    // 1. Consume the next input code point.
    input.consume();
    // 2. While the next two input code points are whitespace, consume them?
    // @NOTE: Spec says "While the next two input code points are whitespace, consume them."
    // Actually, it means if there is whitespace followed by a quote, it's a function, otherwise it's a URL.
    while (isWhitespace(input.peek()[0]) && isWhitespace(input.peek()[1])) {
      input.consume();
    }
    // 3. If the next one or two input code points are U+0022 QUOTATION MARK (") or U+0027 APOSTROPHE ('),
    // optionally preceded by whitespace, return a <function-token> with its value set to string.
    const next = input.peek()[0];
    const next2 = input.peek()[1];
    if (next === 0x0022 || next === 0x0027 || (isWhitespace(next) && (next2 === 0x0022 || next2 === 0x0027))) {
      return new FunctionToken(str);
    }
    // 4. Otherwise, run the "consume a url token" algorithm and return the result.
    else {
      return consumeUrlToken(input);
    }
  }
  // 3. Otherwise, if the next input code point is U+0028 LEFT PARENTHESIS ((), return a <function-token> with its value set to string.
  else if (input.peek()[0] === 0x0028) {
    input.consume();
    return new FunctionToken(str);
  }
  // 4. Otherwise, return an <ident-token> with its value set to string.
  else {
    return new IdentToken(str);
  }
}

// https://drafts.csswg.org/css-syntax-3/#consume-token
function consumeToken(input: InputStream): Token | undefined {
  // @NOTE: Consuming comments before consuming a token.
  // https://drafts.csswg.org/css-syntax-3/#consume-comments
  while (true) {
    const peek = input.peek();
    if (peek[0] === 0x002F && peek[1] === 0x002A) { // U+002F SOLIDUS (/), U+002A ASTERISK (*)
      input.consume(); // consume /
      input.consume(); // consume *
      while (true) {
        const c = input.consume();
        if (typeof c === 'undefined') {
          break; // EOF
        }
        if (c === 0x002A && input.peek()[0] === 0x002F) {
          input.consume(); // consume /
          break;
        }
      }
      continue;
    }
    break;
  }

  // 1. Consume the next input code point.
  const codePoint = input.consume();
  const lookahead = input.peek();

  if (typeof codePoint === 'undefined') {
    return undefined;
  }

  // 2. Look at the consumed code point:
  if (isWhitespace(codePoint)) {
    // whitespace
    // Consume as much whitespace as possible. Return a <whitespace-token>.
    while (isWhitespace(input.peek()[0])) {
      input.consume();
    }
    return new WhitespaceToken();
  } else if (codePoint === 0x0022) {
    // U+0022 QUOTATION MARK (")
    // Consume a string token, and return it.
    return consumeStringToken(input, codePoint);
  } else if (codePoint === 0x0023) {
    // U+0023 NUMBER SIGN (#)
    // If the next input code point is an identifier code point or the next two input code points start a valid escape, then:
    if (isIdentCodePoint(lookahead[0]) || validEscape(lookahead[0], lookahead[1])) {
      // 1. If the next three input code points would start an identifier, set the <hash-token>’s type flag to "id".
      // 2. Consume a name, and set the <hash-token>’s value to the returned name.
      // 3. Return the <hash-token>.
      let type: 'id' | 'unrestricted' = 'unrestricted';
      if (startsIdentSequence(lookahead[0], lookahead[1], lookahead[2])) {
        type = 'id';
      }
      const value = consumeIdentSequence(input);
      return new HashToken(value, type);
    }
    // Otherwise, return a <delim-token> with its value set to the consumed code point.
    else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x0027) {
    // U+0027 APOSTROPHE (')
    // Consume a string token, and return it.
    return consumeStringToken(input, codePoint);
  } else if (codePoint === 0x0028) {
    // U+0028 LEFT PARENTHESIS (()
    // Return a <left-paren-token>.
    return new LeftParenthesisToken();
  } else if (codePoint === 0x0029) {
    // U+0029 RIGHT PARENTHESIS ())
    // Return a <right-paren-token>.
    return new RightParenthesisToken();
  } else if (codePoint === 0x002B) {
    // U+002B PLUS SIGN (+)
    // If the input stream starts a number, reconsume the current input code point, consume a numeric token, and return it.
    if (startsNumber(lookahead[0], lookahead[1], lookahead[2])) {
      input.reconsume(codePoint);
      return consumeNumericToken(input);
    }
    // Otherwise, return a <delim-token> with its value set to the consumed code point.
    else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x002C) {
    // U+002C COMMA (,)
    // Return a <comma-token>.
    return new CommaToken();
  } else if (codePoint === 0x002D) {
    // U+002D HYPHEN-MINUS (-)
    // 1. If the input stream starts a number, reconsume the current input code point, consume a numeric token, and return it.
    if (startsNumber(lookahead[0], lookahead[1], lookahead[2])) {
      input.reconsume(codePoint);
      return consumeNumericToken(input);
    }
    // 2. Otherwise, if the next 2 input code points are U+002D HYPHEN-MINUS (-) followed by U+003E GREATER-THAN SIGN (>),
    // consume them and return a <CDC-token>.
    else if (lookahead[0] === 0x002D && lookahead[1] === 0x003E) {
      input.consume();
      input.consume();
      return new CDCToken();
    }
    // 3. Otherwise, if the input stream starts an identifier, reconsume the current input code point, consume an ident-like token, and return it.
    else if (startsIdentSequence(lookahead[0], lookahead[1], lookahead[2])) {
      input.reconsume(codePoint);
      return consumeIdentLikeToken(input);
    }
    // 4. Otherwise, return a <delim-token> with its value set to the consumed code point.
    else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x002E) {
    // U+002E FULL STOP (.)
    // If the input stream starts a number, reconsume the current input code point, consume a numeric token, and return it.
    if (startsNumber(lookahead[0], lookahead[1], lookahead[2])) {
      input.reconsume(codePoint);
      return consumeNumericToken(input);
    }
    // Otherwise, return a <delim-token> with its value set to the consumed code point.
    else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x003A) {
    // U+003A COLON (:)
    // Return a <colon-token>.
    return new ColonToken();
  } else if (codePoint === 0x003B) {
    // U+003B SEMICOLON (;)
    // Return a <semicolon-token>.
    return new SemicolonToken();
  } else if (codePoint === 0x003C) {
    // U+003C LESS-THAN SIGN (<)
    // If the next 3 input code points are U+0021 EXCLAMATION MARK (!) followed by U+002D HYPHEN-MINUS (-) followed by U+002D HYPHEN-MINUS (-),
    // consume them and return a <CDO-token>.
    if (lookahead[0] === 0x0021 && lookahead[1] === 0x002D && lookahead[2] === 0x002D) {
      input.consume();
      input.consume();
      input.consume();
      return new CDOToken();
    }
    // Otherwise, return a <delim-token> with its value set to the consumed code point.
    else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x0040) {
    // U+0040 COMMERCIAL AT (@)
    // If the next 3 input code points would start an identifier, consume a name, create an <at-keyword-token> with its value set to the name, and return it.
    if (startsIdentSequence(lookahead[0], lookahead[1], lookahead[2])) {
      return new AtKeywordToken(consumeIdentSequence(input));
    }
    // Otherwise, return a <delim-token> with its value set to the consumed code point.
    else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x005B) {
    // U+005B LEFT SQUARE BRACKET ([)
    // Return a <left-bracket-token>.
    return new LeftSquareBracketToken();
  } else if (codePoint === 0x005C) {
    // U+005C REVERSE SOLIDUS (\)
    // If the input stream starts a valid escape, reconsume the current input code point, consume an ident-like token, and return it.
    if (validEscape(lookahead[0], lookahead[1])) {
      input.reconsume(codePoint);
      return consumeIdentLikeToken(input);
    }
    // Otherwise, this is a parse error. Return a <delim-token> with its value set to the consumed code point.
    else {
      return new DelimToken(String.fromCodePoint(codePoint));
    }
  } else if (codePoint === 0x005D) {
    // U+005D RIGHT SQUARE BRACKET (])
    // Return a <right-bracket-token>.
    return new RightSquareBracketToken();
  } else if (codePoint === 0x007B) {
    // U+007B LEFT CURLY BRACKET ({)
    // Return a <left-brace-token>.
    return new LeftCurlyBracketToken();
  } else if (codePoint === 0x007D) {
    // U+007D RIGHT CURLY BRACKET (})
    // Return a <right-brace-token>.
    return new RightCurlyBracketToken();
  } else if (isDigit(codePoint)) {
    // digit
    // Reconsume the current input code point, consume a numeric token, and return it.
    input.reconsume(codePoint);
    return consumeNumericToken(input);
  } else if (isIdentStartCodePoint(codePoint)) {
    // identifier-start code point
    // Reconsume the current input code point, consume an ident-like token, and return it.
    input.reconsume(codePoint);
    return consumeIdentLikeToken(input);
  } else {
    // anything else
    // Return a <delim-token> with its value set to the consumed code point.
    return new DelimToken(String.fromCodePoint(codePoint));
  }
}

// @NOTE: High-level tokenization loop.
// Repeatedly consume a token until EOF (undefined) is returned.
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
