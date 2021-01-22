import { parser } from '../utils/parser'

export namespace GuestClient {
  export type Message = Message.Ping | Message.SubmitAnswer

  export namespace Message {
    export enum TYPES {
      PING = 'PING',
      SUBMIT_ANSWER = 'SUBMIT_ANSWER',
    }

    export interface Ping {
      type: Message.TYPES.PING
    }

    export interface SubmitAnswer {
      type: Message.TYPES.SUBMIT_ANSWER
      answer: number
    }

    export const parse = parser<Message>(Object.values(TYPES))
  }
}
