import { parser } from '../utils/parser'

export namespace Server {
  export type Message =
    | Message.Pong
    | Message.ShowQuestion
    | Message.ShowAnswer
    | Message.ShowLeaderboard

  export namespace Message {
    export enum TYPES {
      PONG = 'PONG',
      SHOW_QUESTION = 'SHOW_QUESTION',
      SHOW_LEADER_BOARD = 'SHOW_LEADER_BOARD',
      SHOW_ANSWER = 'SHOW_ANSWER',
    }

    export interface Pong {
      type: Message.TYPES.PONG
    }

    export interface ShowQuestion {
      type: Message.TYPES.SHOW_QUESTION
      idx: number
    }

    export interface ShowAnswer {
      type: Message.TYPES.SHOW_ANSWER
      revealAnswer?: boolean
      givenAnswer?: number
    }

    export interface ShowLeaderboard {
      type: Message.TYPES.SHOW_LEADER_BOARD
      leaderBoard: [string, ...number[]][]
    }

    export const parse = parser<Message>(Object.values(TYPES))
  }
}
