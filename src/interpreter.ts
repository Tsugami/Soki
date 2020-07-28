// right ela é basicamente o computador que vai rodar o código
// então oq vamos fazer é: ela recebe o AST pra executar então
// cria uma propriedade chamada "code"

import { Node, CallNode, Literal } from './node'
import { errored, CompilerError } from './error'
import { Compiler } from './compiler'
import { Kind } from './lexer'
import { raw } from 'express'
// huum então é só rodar com una função chamada
// run(ast)

enum ValueType {
    Number,
    String,
    List
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
    globalVariables: StackFrame = { vars: [], connected: false }
    variables: StackFrame[] = []

    constructor (rawCode: string) {
      this.rawCode = rawCode
    }

    private getVariable (name: string): Node {
      if (!isNull(this.globalVariables.vars[name])) {
        return this.globalVariables.vars[name]
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
          const value = this.visit(ast.compound[1])
        } else {
          errored(CompilerError.UnexpectedToken, { code: this.rawCode, range: ast.compound[0].range })
          process.exit(1)
        }
      } else { // sim sim (let potato 3) compound = parameters = potato e 3
        errored(CompilerError.WrongParameterNumber, { code: this.rawCode, range: ast.name, expected: 2, got: ast.compound.length })
        process.exit(1)
      }
    }

    private visitSet (ast: CallNode) {

    }

    private visitFn (ast: CallNode) {

    }

    private visitIf (ast: CallNode) {

    }

    private visitGroup (ast: CallNode) {
      this.variables.push({ vars: [], connected: true })
      ast.compound.forEach(node => this.visit(node))
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
        }
      } else {

      }
    }

    run (ast: Node) {
      this.visit(ast)
    }
}
