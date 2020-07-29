/* eslint-disable no-unused-vars */
import * as readline from 'readline'
import { Kind } from './lexer'

const Colors = {
  Reset: '[0m',
  Bright: '[1m',
  Dim: '[2m',
  Underscore: '[4m',
  Blink: '[5m',
  Reverse: '[7m',
  Hidden: '[8m',
  FgBlack: '[30m',
  FgRed: '[31m',
  FgGreen: '[32m',
  FgYellow: '[33m',
  FgBlue: '[34m',
  FgMagenta: '[35m',
  FgCyan: '[36m',
  FgWhite: '[37m',
  BgBlack: '[40m',
  BgRed: '[41m',
  BgGreen: '[42m',
  BgYellow: '[43m',
  BgBlue: '[44m',
  BgMagenta: '[45m',
  BgCyan: '[46m',
  BgWhite: '[47m'
}

enum CompilerError {
  UnexpectedToken,
  ExpectedToken,
  WrongParameterNumber,
  AlreadyExists
}

function errored (errorCode: CompilerError, payload: any) {
  process.stdout.write(Colors.FgRed + Colors.Bright + 'ERR:' + Colors.Reset + ' ')
  if (errorCode === CompilerError.UnexpectedToken) {
    const token = payload.code.substring(payload.range.start, payload.range.end)
    process.stdout.write(Colors.Reset + Colors.Bright + 'Unexpected token "' + token + '"\n\r' + Colors.Reset)
  } else if (errorCode === CompilerError.ExpectedToken) {
    process.stdout.write(Colors.Reset + Colors.Bright + 'Expected token ' + Kind[payload.type] + ' but instead got end of file!\n\r' + Colors.Reset)
  } else if (errorCode === CompilerError.AlreadyExists) {
    process.stdout.write(Colors.Reset + Colors.Bright + 'Variable \'' + payload.name + '\' already exists!\n\r' + Colors.Reset)
  }
  const lines = payload.code.split('\n')
  let count = 0
  for (var i = 0; i < lines.length; i++) {
    if (count + lines[i].length >= payload.range.start) {
      break
    }
    count += lines[i].length + 1
  }

  const elements = lines.slice(i, 5)
  elements.forEach((element, j) => {
    process.stdout.write((j === 0 ? Colors.Bright : Colors.Dim) + Colors.FgCyan + (i + j))
    readline.cursorTo(process.stdout, 3, null)
    if (j === 0) {
      const start = element.slice(0, payload.range.start - count)
      const middle = Colors.FgRed + Colors.Bright + element.slice(payload.range.start - count, payload.range.end - count)
      const end = Colors.Reset + element.slice(payload.range.end - count)
      process.stdout.write(Colors.Bright + Colors.FgCyan + ' | ' + Colors.Reset + start + middle + end + '\n\r')

      const marks = new Array(payload.range.end - payload.range.start).fill('^').join('')
      readline.cursorTo(process.stdout, 0, null)
      process.stdout.write(Colors.Bright + Colors.FgCyan + '    | ' + Colors.Reset)
      readline.cursorTo(process.stdout, 6 + payload.range.start - count, null)
      process.stdout.write(Colors.Bright + Colors.FgRed + marks + Colors.Reset + '\n\r')
    } else {
      process.stdout.write(Colors.Bright + Colors.FgCyan + ' | ' + Colors.Reset + element + '\n\r')
    }
  })
}

export { CompilerError, errored }
