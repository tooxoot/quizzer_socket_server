import { parser } from '../utils/parser'

export namespace HostClient {
  export type Message =
    | Message.Ping
    | Message.NextQuestion
    | Message.StopQuestion
    | Message.ShowLeaderboard

  export namespace Message {
    export enum TYPES {
      PING = 'PING',
      NEXT_QUESTION = 'NEXT_QUESTION',
      STOP_QUESTION = 'STOP_QUESTION',
      SHOW_LEADERBOARD = 'SHOW_LEADERBOARD',
    }

    export interface Ping {
      type: Message.TYPES.PING
    }

    export interface NextQuestion {
      type: Message.TYPES.NEXT_QUESTION
    }

    export interface StopQuestion {
      type: Message.TYPES.STOP_QUESTION
    }

    export interface ShowLeaderboard {
      type: Message.TYPES.SHOW_LEADERBOARD
    }

    export const parse = parser<Message>(Object.values(TYPES))
  }
}
