import { ClientSocket, Server, Sockets, State } from '.'
import { GuestClient, HostClient } from '../Clients'
import { GuestSocket } from './types'

type Handler = (
  message: GuestClient.Message | HostClient.Message,
  state: State,
  clients: Sockets,
  currentClient: ClientSocket | GuestSocket
) => void

const handlePong: Handler = (_m, _s, _c, currentSocket): void => {
  currentSocket.send({ type: Server.Message.TYPES.PONG })
}

export namespace Handlers {
  export namespace HostMessage {
    const handleNextQuestion: Handler = (_m, state, clients): void => {
      state.currentQuestionIdx++

      const m: Server.Message = {
        type: Server.Message.TYPES.SHOW_QUESTION,
        idx: state.currentQuestionIdx,
      }

      clients.guests.forEach(gs => gs.send(m))
      clients.host.send(m)
    }

    const handleStopQuestion: Handler = (_m, state, clients): void => {
      const message: Server.Message = {
        type: Server.Message.TYPES.SHOW_ANSWER,
        revealAnswer: false,
      }

      clients.guests.forEach(gs => {
        const guestMessage: Server.Message = { ...message }
        const givenAnswers = state.givenAnswers[gs.userName]
        const givenAnswer = givenAnswers && givenAnswers[state.currentQuestionIdx]

        guestMessage.givenAnswer = givenAnswer

        gs.send(guestMessage)
      })

      clients.host.send(message)
    }

    const constructLeaderborad = ({ givenAnswers, catalogue }: State): [string, ...number[]][] => {
      const board = Object.entries(givenAnswers).map(([name, answers]) => {
        const sum = answers.reduce(
          (sum, givenAnswer, idx) =>
            givenAnswer === catalogue.questions[idx].rightAnswer ? sum + 1 : sum,
          0
        )

        return [name, ...answers, sum]
      })

      return board as [string, ...number[]][]
    }

    const handleShowLeaderboard: Handler = (_m, state, clients): void => {
      const m: Server.Message = {
        type: Server.Message.TYPES.SHOW_LEADER_BOARD,
        leaderBoard: constructLeaderborad(state),
      }

      clients.guests.forEach(gs => gs.send(m))
      clients.host.send(m)
    }

    const handlers: Record<HostClient.Message.TYPES, Handler> = {
      [HostClient.Message.TYPES.PING]: handlePong,
      [HostClient.Message.TYPES.NEXT_QUESTION]: handleNextQuestion,
      [HostClient.Message.TYPES.STOP_QUESTION]: handleStopQuestion,
      [HostClient.Message.TYPES.SHOW_LEADERBOARD]: handleShowLeaderboard,
    }

    export const get = (
      state: State,
      clients: Sockets,
      currentClient: ClientSocket | GuestSocket
    ) => (data: unknown): void => {
      let message: HostClient.Message
      try {
        message = HostClient.Message.parse(data)
      } catch (e) {
        console.error('failed HostClient.Message.parse', e)
        return
      }

      handlers[message.type](message, state, clients, currentClient)
    }
  }

  export namespace GuestMessage {
    const handleSubmitAnswer: Handler = (
      message: GuestClient.Message.SubmitAnswer,
      state,
      _c,
      currentSocket: GuestSocket
    ): void => {
      if (!state.givenAnswers[currentSocket.userName])
        state.givenAnswers[currentSocket.userName] = []
      state.givenAnswers[currentSocket.userName][state.currentQuestionIdx] = message.answer
    }

    const handlers: Record<GuestClient.Message.TYPES, Handler> = {
      [GuestClient.Message.TYPES.PING]: handlePong,
      [GuestClient.Message.TYPES.SUBMIT_ANSWER]: handleSubmitAnswer,
    }

    export const get = (state: State, clients: Sockets, currentSocket: ClientSocket) => (
      data: unknown
    ): void => {
      let message: GuestClient.Message
      try {
        message = GuestClient.Message.parse(data)
      } catch (e) {
        console.error('failed GuestClient.Message.parse', e)
        return
      }

      handlers[message.type](message, state, clients, currentSocket)
    }
  }
}
