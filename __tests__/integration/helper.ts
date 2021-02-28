import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'
import { Container } from './container'

type SocketPromise = ReturnType<Container['getSocket']>
type Socket = SocketPromise extends Promise<infer T> ? T : unknown
export const synchronize = async (...socketPromises: SocketPromise[]) => {
  const sockets = await Promise.all(socketPromises)
  let idx = 1

  return sockets.map(s => ({
    ...s,
    send: (msg: QP.HostClient.Message | QP.GuestClient.Message) => {
      idx++
      s.send(msg)
      return Promise.all(sockets.map(s => s.getCountPromise(idx)))
    },
  }))
}

export const getDefaultState = (): QP.State => ({
  catalogue: {
    questions: [
      {
        id: '1',
        prompt: '1?',
        answers: ['A', 'B', 'C', 'D'],
        rightAnswer: 0,
      },
      {
        id: '2',
        prompt: '1?',
        answers: ['A', 'B', 'C', 'D'],
        rightAnswer: 2,
      },
      {
        id: '3',
        prompt: '1?',
        answers: ['A', 'B', 'C', 'D'],
        rightAnswer: 3,
      },
    ],
  },
  currentQuestionIdx: 0,
  leaderBoard: {},
  lockQuestion: false,
  showLeaderBoard: false,
  showRightAnswers: false,
  timestamp: 0,
})
export const defaultState: QP.State = getDefaultState()

export const zerofyTimestamp = (msg: QP.Server.Message): QP.Server.Message => ({
  ...msg,
  state: { ...msg.state, timestamp: 0 },
})

export const hasAscendingTimestamps = (msgs: QP.Server.Message[]) => {
  let last = 0
  for (let msg of msgs) {
    if (last > msg.state.timestamp) {
      return false
    }
    last = msg.state.timestamp
  }
  return true
}
