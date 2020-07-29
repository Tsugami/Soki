/* eslint-disable no-unused-vars */
// right ela é basicamente o computador que vai rodar o código
// então oq vamos fazer é: ela recebe o AST pra executar então
// cria uma propriedade chamada "code"

import { Node, CallNode, Literal, ListNode } from './node'
import { errored, CompilerError } from './error'
import { Kind } from './lexer'
// huum então é só rodar com una função chamada
// run(ast)

enum ValueType {
    Number,
    String,
    List,
    Function
}

interface Value {
    value: any;
    type: ValueType;
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

    private getVariable (name: string): Node {
      if (!isNull(this.variables[0].vars[name])) {
        return this.variables[0].vars[name]
      } else {
        for (var i = this.variables.length - 1; i === 0; i--) {
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
          if (ast.compound[1].kind instanceof ListNode) {
            ast.compound[1].kind.list.forEach(element => {
              if (!(element.kind instanceof Literal) || element.kind.kind !== Kind.Ident) {
                errored(CompilerError.UnexpectedToken, { code: this.rawCode, range: element.range })
                process.exit(0)
              }
            })
            const name = this.rawCode.substring(ast.compound[0].range.start, ast.compound[0].range.end)
            this.variables[this.variables.length - 1].vars[name] = {
              type: ValueType.Function,
              value:
              {
                params: ast.compound[1].kind.list.map(el => this.rawCode.substring(el.range.start, el.range.end)),
                compound: ast.compound.slice(2)
              }
            }
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

    }

    private visitIf (ast: CallNode) {

    }

    private visitGroup (ast: CallNode) {
      this.variables.push({ vars: [], connected: true })
      ast.compound.forEach(node => this.visit(node))
      this.variables.pop()
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
          default:
            this.variables.push({ vars: [], connected: false })
        }
      } else if (ast.kind instanceof Literal) {
        const value = this.rawCode.substring(ast.kind.value.start, ast.kind.value.end)
        switch (ast.kind.kind) {
          case Kind.Number : return { value: parseInt(value), type: ValueType.Number }
          case Kind.String : return { value, type: ValueType.String }
        }
      } else {

      }
    }

    run (ast: Node[]) {
      ast.forEach(ast =>
        this.visit(ast))
    }
}
