/* eslint-disable no-unused-vars */

import { Node, CallNode, Literal, ListNode } from './node'
import { errored, CompilerError } from './error'
import { Kind } from './lexer'

enum ValueType {
    Number,
    String,
    List,
    Function
}

type ApplyFunction = (x: number, y: number) => number

class Value {
  value: any;
  type: ValueType;
  constructor (value: any, type: ValueType) {
    this.value = value
    this.type = type
  }
}

interface StackFrame {
  vars: Record<string, Value>[];
  connected: boolean;
}

const isNull = (value: any): boolean => value === null || value === undefined

export default class Interpreter {
    rawCode: string
    variables: StackFrame[] = [{ vars: [], connected: false }]

    constructor (rawCode: string) {
      this.rawCode = rawCode
    }

    private getVariable (name: string): Value {
      if (!isNull(this.variables[0].vars[name])) {
        return this.variables[0].vars[name]
      } else {
        for (var i = this.variables.length - 1; i > 0; i--) {
          if (!isNull(this.variables[i].vars[name])) {
            return this.variables[i].vars[name]
          }
          if (!this.variables[i].connected) {
            return
          }
        }
      }
    }

    private visitLet (ast: CallNode) {
      if (ast.compound.length === 2) {
        const kind = ast.compound[0].kind
        if (kind instanceof Literal && kind.kind === Kind.Ident) {
          const name = this.rawCode.substring(ast.compound[0].range.start, ast.compound[0].range.end)
          if (this.getVariable(name)) {
            errored(CompilerError.AlreadyExists, { code: this.rawCode, range: ast.compound[0].range, name })
            process.exit(0)
          }
          const value = this.visit(ast.compound[1])
          this.variables[this.variables.length - 1].vars[name] = value
        } else {
          errored(CompilerError.UnexpectedToken, { code: this.rawCode, range: ast.compound[0].range })
          process.exit(0)
        }
      } else {
        errored(CompilerError.WrongParameterNumber, { code: this.rawCode, range: ast.name, expected: 2, got: ast.compound.length })
        process.exit(0)
      }
    }

    private visitFn (ast: CallNode) {
      if (ast.compound.length >= 2) {
        if (ast.compound[0].kind instanceof Literal && ast.compound[0].kind.kind === Kind.Ident) {
          const name = this.rawCode.substring(ast.compound[0].range.start, ast.compound[0].range.end)
          if (this.getVariable(name)) {
            errored(CompilerError.AlreadyExists, { code: this.rawCode, range: ast.compound[0].range, name })
            process.exit(0)
          }
          if (ast.compound[1].kind instanceof ListNode) {
            ast.compound[1].kind.list.forEach(element => {
              if (!(element.kind instanceof Literal) || element.kind.kind !== Kind.Ident) {
                errored(CompilerError.UnexpectedToken, { code: this.rawCode, range: element.range })
                process.exit(0)
              }
            })

            this.variables[this.variables.length - 1].vars[name] = new Value(
              {
                params: ast.compound[1].kind.list.map(el => this.rawCode.substring(el.range.start, el.range.end)),
                compound: ast.compound.slice(2)
              },
              ValueType.Function
            )
          } else {
            errored(CompilerError.UnexpectedToken, { code: this.rawCode, range: ast.compound[0].range })
            process.exit(0)
          }
        } else {
          errored(CompilerError.UnexpectedToken, { code: this.rawCode, range: ast.compound[0].range })
          process.exit(0)
        }
      } else {
        errored(CompilerError.WrongParameterNumber, { code: this.rawCode, range: ast.name, expected: 2, got: ast.compound.length })
        process.exit(0)
      }
    }

    private visitSet (ast: CallNode) {
      if (ast.compound.length === 2) {
        const kind = ast.compound[0].kind
        if (kind instanceof Literal && kind.kind === Kind.Ident) {
          const name = this.rawCode.substring(ast.compound[0].range.start, ast.compound[0].range.end)
          if (!this.getVariable(name)) {
            errored(CompilerError.NotExists, { code: this.rawCode, range: ast.compound[0].range, name })
            process.exit(0)
          }
          const value = this.visit(ast.compound[1])
          this.variables[this.variables.length - 1].vars[name] = value
        } else {
          errored(CompilerError.UnexpectedToken, { code: this.rawCode, range: ast.compound[0].range })
          process.exit(0)
        }
      } else {
        errored(CompilerError.WrongParameterNumber, { code: this.rawCode, range: ast.name, expected: 2, got: ast.compound.length })
        process.exit(0)
      }
    }

    private visitIf (ast: CallNode) {

    }

    private visitCall (ast: CallNode) {
      const name = this.rawCode.substring(ast.name.start, ast.name.end)
      const func = this.getVariable(name)
      if (!func || func.type !== ValueType.Function) {
        errored(CompilerError.FunctionNotExists, { code: this.rawCode, range: ast.name, name })
        process.exit(0)
      }
      if (ast.compound.length === func.value.params.length) {
        const processed = ast.compound.map(a => this.visit(a))
        this.variables.push({ vars: [], connected: true })
        func.value.params.forEach((name, i) => {
          this.variables[this.variables.length - 1].vars[name as string] = processed[i] as Value
        })

        func.value.compound.forEach(element => {
          this.visit(element)
        })

        this.variables.pop()
      } else {
        errored(CompilerError.WrongParameterNumber, { code: this.rawCode, range: ast.name, expected: func.value.params.length, got: ast.compound.length })
        process.exit(0)
      }
    }

    private visitPrint (ast: CallNode) {
      ast.compound.map(a => this.visit(a)).forEach((el) => {
        if ((el as Value).type === ValueType.Number) {
          process.stdout.write((el as Value).value.toString() + ' ')
        } else {
          process.stdout.write((el as Value).value + ' ')
        }
      })
      process.stdout.write('\n\r')
    }

    private visitGroup (ast: CallNode) {
      this.variables.push({ vars: [], connected: true })
      ast.compound.forEach(node => this.visit(node))
      this.variables.pop()
    }

    private arithReduceAst (ast: CallNode, apply: ApplyFunction) : number {
      const el = ast.compound.map(element => [this.visit(element), element.range])
      el.forEach(element => {
        if (!(element[0] instanceof Value) || element[0].type !== ValueType.Number) {
          errored(CompilerError.UnexpectedToken, { code: this.rawCode, range: element[1] })
          process.exit(0)
        }
      })
      return el.reduce((a, c, i) => {
        const value = (c[0] as Value).value

        if (i === 0) {
          return value
        }

        return apply(a, value)
      }, 0)
    }

    private visitSum (ast: CallNode) : Value {
      const num = this.arithReduceAst(ast, (a, c) => a + c)
      return new Value(num, ValueType.Number)
    }

    private visitSub (ast: CallNode) : Value {
      const num = this.arithReduceAst(ast, (a, c) => a - c)
      return new Value(num, ValueType.Number)
    }

    private visitMult (ast: CallNode) : Value {
      const num = this.arithReduceAst(ast, (a, c) => a * c)
      return new Value(num, ValueType.Number)
    }

    private visitDiv (ast: CallNode) : Value {
      const num = this.arithReduceAst(ast, (a, c) => a / c)
      return new Value(num, ValueType.Number)
    }

    private visit (ast: Node) {
      if (ast.kind instanceof CallNode) {
        const stringName = this.rawCode.substring(ast.kind.name.start, ast.kind.name.end)
        switch (stringName) {
          case 'def': return this.visitFn(ast.kind)
          case 'set': return this.visitSet(ast.kind)
          case 'let': return this.visitLet(ast.kind)
          case 'if': return this.visitIf(ast.kind)
          case 'group': return this.visitGroup(ast.kind)
          case 'print': return this.visitPrint(ast.kind)
          case '+': return this.visitSum(ast.kind)
          case '-': return this.visitSub(ast.kind)
          case '*': return this.visitMult(ast.kind)
          case '/': return this.visitDiv(ast.kind)
          default:
            this.visitCall(ast.kind)
        }
      } else if (ast.kind instanceof Literal) {
        const value = this.rawCode.substring(ast.kind.value.start, ast.kind.value.end)
        switch (ast.kind.kind) {
          case Kind.Number : return new Value(parseInt(value), ValueType.Number)
          case Kind.String : return new Value(value, ValueType.String)
          case Kind.Ident : {
            const name = this.rawCode.substring(ast.kind.value.start, ast.kind.value.end)
            if (!this.getVariable(name)) {
              errored(CompilerError.NotExists, { code: this.rawCode, range: ast.kind.value, name })
              process.exit(0)
            }
            return this.getVariable(name)
          }
        }
      } else {
      }
    }

    run (ast: Node[]) {
      ast.forEach(ast =>
        this.visit(ast))
    }
}
