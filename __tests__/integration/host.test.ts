import test from 'ava'
import { Container } from './container'
import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'
import { defaultState, getDefaultState, hasAscendingTimestamps, zerofyTimestamp } from './helper'

let container: Container

test.before(async () => {
  container = await new Container().init()
})

test('Host connect and ping', async t => {
  let ws = container.getSocket()
  const HTYPES = QP.HostClient.Message.TYPES

  await ws.message

  const clientMsgs = [
    HTYPES.PING,
    HTYPES.NEXT_QUESTION,
    HTYPES.STOP_QUESTION,
    HTYPES.NEXT_QUESTION,
    HTYPES.SHOW_LEADERBOARD,
    HTYPES.NEXT_QUESTION,
    HTYPES.NEXT_QUESTION,
    HTYPES.SHOW_LEADERBOARD,
  ]
  clientMsgs.map(type => ({ type })).forEach(ws.send)

  ws.disconnect()
  await ws.close

  t.is(ws.messages.length, clientMsgs.length + 1, 'received too few messages')
  t.true(hasAscendingTimestamps(ws.messages))

  const msgs = ws.messages.map(zerofyTimestamp)

  const STYPES = QP.Server.Message.TYPES

  const expectedMsgs: QP.Server.Message[] = [
    {
      type: STYPES.PONG,
      state: defaultState,
    },
    {
      type: STYPES.PONG,
      state: defaultState,
    },
    {
      type: STYPES.SHOW_QUESTION,
      state: {
        ...getDefaultState(),
        currentQuestionIdx: 1,
      },
    },
    {
      type: STYPES.SHOW_ANSWER,
      state: {
        ...getDefaultState(),
        currentQuestionIdx: 1,
        lockQuestion: true,
      },
    },
    {
      type: STYPES.SHOW_QUESTION,
      state: {
        ...getDefaultState(),
        currentQuestionIdx: 2,
      },
    },
    {
      type: STYPES.SHOW_LEADER_BOARD,
      state: {
        ...getDefaultState(),
        currentQuestionIdx: 2,
        lockQuestion: true,
        showLeaderBoard: true,
      },
    },
    {
      type: STYPES.SHOW_QUESTION,
      state: {
        ...getDefaultState(),
        currentQuestionIdx: 3,
      },
    },
    {
      type: STYPES.SHOW_QUESTION,
      state: {
        ...getDefaultState(),
        currentQuestionIdx: 4,
      },
    },
    {
      type: STYPES.SHOW_LEADER_BOARD,
      state: {
        ...getDefaultState(),
        currentQuestionIdx: 4,
        lockQuestion: true,
        showLeaderBoard: true,
      },
    },
  ]

  t.deepEqual(msgs, expectedMsgs, 'wrong message flow')
  t.pass()
})

test.after(async () => {
  await container.stop
})
