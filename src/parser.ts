/* eslint-disable no-unused-vars */
import { Lexer, Kind, Token, Range } from './lexer'
import { errored, CompilerError } from './error'
import { Literal, Node, CallNode, ListNode, DefNode } from './node'

type NodeKind = ListNode | CallNode | Literal | DefNode;

class Parser {
    lexer: Lexer
    actual: Token
    next: Token

    constructor (lexer: Lexer) {
      this.lexer = lexer
      this.actual = new Token(Kind.EOF, new Range(0, 0))
      this.next = this.lexer.nextToken()
    }

    advance () {
      this.actual = this.next
      this.next = this.lexer.nextToken()
    }

    eat (type: Kind): Token {
      if (this.next.type !== type) {
        if (this.next.type === Kind.EOF) {
          errored(CompilerError.ExpectedToken, { code: this.lexer.code, range: this.next.range, type: type })
        } else {
          errored(CompilerError.UnexpectedToken, { code: this.lexer.code, range: this.next.range })
        }
        process.exit(0)
      }
      this.advance()
      return this.actual
    }

    getArgs (): Node[] {
      const args = []
      while (this.next.type !== Kind.RPar && this.next.type !== Kind.EOF) {
        args.push(this.parseStatement())
      }
      return args
    }

    call (): Node {
      const startRange = this.eat(Kind.LPar).range
      const name = this.eat(Kind.Ident).range
      const str = this.lexer.code.substring(name.start, name.end)
      const callNode = this.callNode(name)
      const endRange = this.eat(Kind.RPar).range
      return new Node(callNode, new Range(startRange.start, endRange.end))
    }

    callNode (original: Range): NodeKind {
      const args = this.getArgs()
      return new CallNode(
        original,
        args
      )
    }

    list (): Node {
      const startRange = this.eat(Kind.LBrackets).range
      const args = []
      while (this.next.type !== Kind.RBrackets && this.next.type !== Kind.EOF) {
        args.push(this.parseStatement())
      }
      const listNode = new ListNode(args)
      const endRange = this.eat(Kind.RBrackets).range
      return new Node(listNode, new Range(startRange.start, endRange.end))
    }

    parseStatement () {
      if (this.next.type === Kind.LPar) {
        return this.call()
      } else if (this.next.type === Kind.LBrackets) {
        return this.list()
      } else if ([Kind.Ident, Kind.String, Kind.Number].includes(this.next.type)) {
        this.advance()
        const literal = new Literal(this.actual.range, this.actual.type)
        return new Node(literal, this.actual.range)
      } else {
        errored(CompilerError.UnexpectedToken, { code: this.lexer.code, range: this.next.range })
        process.exit(0)
      }
    }

    parse (): Node[] {
      const statements = []
      while (this.next.type !== Kind.EOF) {
        statements.push(this.parseStatement())
      }
      this.eat(Kind.EOF)
      return statements
    }
}

export { Parser }
