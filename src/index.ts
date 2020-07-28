
// eslint-disable-next-line no-unused-vars

import { Lexer } from './lexer'
import { Parser } from './parser'
import Interpreter from './interpreter'
// import { Interpreter } from './interpreter'

const lexer = new Lexer('(let a 2)')
const ast = new Parser(lexer).parse()

new Interpreter(lexer.code).run(ast)