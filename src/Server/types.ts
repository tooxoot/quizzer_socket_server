import { Server } from './'

export interface Question {
  id: string
  prompt: string
  answers: string[]
  rightAnswer?: number
}

export interface Catalogue {
  questions: Question[]
}

export interface GivenAnswers extends Record<string, number[]> {}

export interface State {
  catalogue: Catalogue
  givenAnswers: GivenAnswers
  currentQuestionIdx: number
}

export interface ClientSocket {
  send: (
    a: Server.Message | string,
    b?: {} | ((err?: Error) => void),
    c?: (err?: Error) => void
  ) => void
}

export interface GuestSocket extends ClientSocket {
  userName: string
}

export interface Sockets {
  guests: Set<GuestSocket>
  host: ClientSocket
}
