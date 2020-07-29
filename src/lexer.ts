/* eslint-disable no-unused-vars */

// These are functions that validate characters to
// predicative function in digest.

function isDigit (x: string) : boolean {
  return x >= '0' && x <= '9'
}

// These two functions are related to identifiers.
// In the beginning identifiers cannot have numbers

function isIdent (x: string) : boolean {
  return !['(', ')', '[', ']', ' ', '\n', '\r', '\t', '', undefined, null].includes(x)
}

function isUseless (x: string) : boolean {
  return x === ' ' || x === '\n' || x === '\t' || x === '\r'
}

class Range {
    start: number;
    end: number;

    constructor (start: number, end: number) {
      this.start = start
      this.end = end
    }
}

enum Kind {
    LPar,
    RPar,
    LBrackets,
    RBrackets,
    Comma,
    Number,
    Comment,
    Ident,
    String,
    WhiteSpace,
    EOF
}

class Token {
    type: Kind;
    range: Range;

    constructor (type: Kind, range: Range) {
      this.type = type
      this.range = range
    }
}

class Lexer {
    code: string;
    pos: number;

    constructor (input: string) {
      this.code = input
      this.pos = 0
    }

    // This function returns the char that is being processed at the moment.
    actual (): string {
      return this.code[this.pos]
    }

    // Simply advances a char and returns the old one.
    advance (): string {
      return this.code[this.pos++]
    }

    // This function simply matches a function called predicative and then
    // Returns a token with the range of everything that got digested
    // by the function.
    digest (token: Kind, predicative: (arg0: string) => boolean): Token {
      const start = this.pos
      while (predicative(this.actual()) && this.actual()) {
        this.pos++
      }
      return new Token(token, new Range(start, this.pos))
    }

    // It makes a easy way to create simple tokens with one char.
    createToken (token: Kind): Token {
      this.advance()
      return new Token(token, new Range(this.pos - 1, this.pos))
    }
    // This functions matches the code with a pattern and then returns the
    // Lexical representation of it.

    nextToken () : Token {
      // It matches some tokens with constant size and comments.
      switch (this.actual()) {
        case '(': return this.createToken(Kind.LPar)
        case ')': return this.createToken(Kind.RPar)
        case '[': return this.createToken(Kind.LBrackets)
        case ']': return this.createToken(Kind.RBrackets)
        case ',': return this.createToken(Kind.Comma)
        case '#': {
          this.digest(Kind.Comment, (x) => x !== '\n')
          this.advance()
          return this.nextToken()
        }
      }

      // It matches some variable size constants (Numbers, Identifiers and Strings)
      switch (true) {
        case isDigit(this.actual()) : return this.digest(Kind.Number, (x) => isDigit(x))
        case this.actual() === '"' : {
          this.advance()
          const str = this.digest(Kind.String, (x) => x !== '"')
          if (this.actual() !== '"') {
            throw new Error('You cannot just break everything with this String')
          }
          this.advance()
          return str
        }
        case isIdent(this.actual()) : return this.digest(Kind.Ident, (x) => isIdent(x))
        case isUseless(this.actual()): {
          this.digest(Kind.WhiteSpace, (x) => isUseless(x))
          return this.nextToken()
        }
      }

      return new Token(Kind.EOF, new Range(this.pos, this.pos))
    }
}

export { Kind, Token, Lexer, Range }
