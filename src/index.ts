
// eslint-disable-next-line no-unused-vars

import { Lexer } from './lexer'
import { Parser } from './parser'
import Interpreter from './interpreter'

const lexer = new Lexer(`
    
(def functor [a b]
    (let c 2)
    (set a 3)
    (print (+ a b c)))

(functor 2 3)
(functor 10 2)

`)

const ast = new Parser(lexer).parse()

const int = new Interpreter(lexer.code)

int.run(ast)
