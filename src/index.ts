
// eslint-disable-next-line no-unused-vars

import { Lexer } from './lexer'
import { Parser } from './parser'
import Interpreter from './interpreter'
// import { Interpreter } from './interpreter'

const lexer = new Lexer(`
(group 
    (let a 2))
    
(def functor [a b c]
    (let b 3)
    (let c 4))`)

const ast = new Parser(lexer).parse()

const int = new Interpreter(lexer.code)

int.run(ast)
