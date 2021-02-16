import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'

export interface ClientSocket {
  send: (
    a: QP.Server.Message | string,
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
