/* eslint-disable no-unused-vars */
import { Range, Kind } from './lexer'

type NodeKind = ListNode | CallNode | Literal;

class Node {
    range: Range;
    kind: NodeKind;

    constructor (kind: NodeKind, range: Range) {
      this.range = range
      this.kind = kind
    }
}

class ListNode {
    list: Array<Node>

    constructor (list: Array<Node>) {
      this.list = list
    }
}

class CallNode {
  name: Range;
  compound: Array<Node>;

  constructor (name: Range, compound: Array<Node>) {
    this.compound = compound
    this.name = name
  }
}

class Literal {
    value: Range;
    kind: Kind;

    constructor (value: Range, kind: Kind) {
      this.value = value
      this.kind = kind
    }
}

export { Node, ListNode, CallNode, Literal }
