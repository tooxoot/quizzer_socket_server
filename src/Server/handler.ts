import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'
import { ClientSocket, GuestSocket, Sockets } from '.'

type Handler = (
  message: QP.GuestClient.Message | QP.HostClient.Message,
  state: QP.State,
  clients: Sockets,
  currentClient: ClientSocket | GuestSocket
) => QP.Server.Message.TYPES

const handlePing: Handler = (_m, state, _c, currentSocket) => {
  currentSocket.send({ type: QP.Server.Message.TYPES.PONG, state })

  return undefined
}

const pushState = (type: QP.Server.Message.TYPES, state: QP.State, clients: Sockets) => {
  if (!type) return

  const m: QP.Server.Message = {
    type,
    state,
  }

  clients.guests.forEach(g => g.send(m))
  clients.host.send(m)
}

const updateLeaderboard = (state: QP.State) => {
  for (const question of state.catalogue.questions) {
    for (const userId in state.leaderBoard) {
      const entry = state.leaderBoard[userId]
      if (entry.givenAnswers[question.id] === question.rightAnswer) {
        entry.total += 1
      }
    }
  }
}

const stamp = (state: QP.State) => {
  state.timestamp = Date.now()
}

export namespace Handlers {
  export namespace HostMessage {
    const handleNextQuestion: Handler = (_m, state, clients) => {
      state.currentQuestionIdx++
      state.lockQuestion = false
      state.showLeaderBoard = false
      state.showRightAnswers = false
      stamp(state)

      return QP.Server.Message.TYPES.SHOW_QUESTION
    }

    const handleStopQuestion: Handler = (_m, state, clients) => {
      state.lockQuestion = true
      stamp(state)

      return QP.Server.Message.TYPES.SHOW_ANSWER
    }

    const handleShowLeaderboard: Handler = (_m, state, clients) => {
      state.showLeaderBoard = true
      state.lockQuestion = true
      stamp(state)

      return QP.Server.Message.TYPES.SHOW_LEADER_BOARD
    }

    const handlers: Record<QP.HostClient.Message.TYPES, Handler> = {
      [QP.HostClient.Message.TYPES.PING]: handlePing,
      [QP.HostClient.Message.TYPES.NEXT_QUESTION]: handleNextQuestion,
      [QP.HostClient.Message.TYPES.STOP_QUESTION]: handleStopQuestion,
      [QP.HostClient.Message.TYPES.SHOW_LEADERBOARD]: handleShowLeaderboard,
    }

    export const get = (
      state: QP.State,
      clients: Sockets,
      currentClient: ClientSocket | GuestSocket
    ) => (data: unknown): QP.Server.Message.TYPES => {
      let message: QP.HostClient.Message
      try {
        message = QP.HostClient.Message.parse(data)
      } catch (e) {
        console.error('failed HostClient.Message.parse', e)
        return
      }

      const msgType = handlers[message.type](message, state, clients, currentClient)
      pushState(msgType, state, clients)
    }
  }

  export namespace GuestMessage {
    const handleSubmitAnswer: Handler = (
      message: QP.GuestClient.Message.SubmitAnswer,
      state,
      _c,
      currentSocket: GuestSocket
    ) => {
      let userEntry = state.leaderBoard[currentSocket.userName]
      if (!userEntry) {
        userEntry = {
          givenAnswers: {},
          total: 0,
        }

        state.leaderBoard[currentSocket.userName] = userEntry
      }

      const currentId = state.catalogue.questions[state.currentQuestionIdx].id
      userEntry.givenAnswers[currentId] = message.answer

      updateLeaderboard(state)
      stamp(state)

      return QP.Server.Message.TYPES.PONG
    }

    const handlers: Record<QP.GuestClient.Message.TYPES, Handler> = {
      [QP.GuestClient.Message.TYPES.PING]: handlePing,
      [QP.GuestClient.Message.TYPES.SUBMIT_ANSWER]: handleSubmitAnswer,
    }

    export const get = (state: QP.State, clients: Sockets, currentSocket: ClientSocket) => (
      data: unknown
    ): void => {
      let message: QP.GuestClient.Message
      try {
        message = QP.GuestClient.Message.parse(data)
      } catch (e) {
        console.error('failed GuestClient.Message.parse', e)
        return
      }

      const msgType = handlers[message.type](message, state, clients, currentSocket)
      pushState(msgType, state, clients)
    }
  }
}
