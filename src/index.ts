
// eslint-disable-next-line no-unused-vars

import { Lexer } from './lexer'
import { Parser } from './parser'
import Interpreter from './interpreter'
// n tem >= faz pra mim? KEK
const lexer = new Lexer(`
(def pode-beber [idade]
    (if (>= idade 18)
        (print "Pode beber po")
    else
        (print "Nao pode beber opo voce so tem" idade "anos")))
    
(pode-beber 5)
`)

const ast = new Parser(lexer).parse()

const int = new Interpreter(lexer.code)

int.run(ast)
