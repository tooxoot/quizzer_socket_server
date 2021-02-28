import test from 'ava'
import { Container } from './container'
import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'
import { defaultState, getDefaultState, hasAscendingTimestamps, zerofyTimestamp } from './helper'

let container: Container

test.before(async () => {
  container = await new Container().init()
})

test('Guest submit multiple answers', async t => {
  let ws = container.getSocket('testuser')
  const GTYPES = QP.GuestClient.Message.TYPES

  await ws.message

  const clientMsgs: QP.GuestClient.Message[] = [
    { type: GTYPES.PING },
    { type: GTYPES.SUBMIT_ANSWER, answer: 1 },
    { type: GTYPES.SUBMIT_ANSWER, answer: 0 },
    { type: GTYPES.SUBMIT_ANSWER, answer: 2 },
  ]
  clientMsgs.forEach(ws.send)

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
      type: STYPES.PONG,
      state: {
        ...getDefaultState(),
        leaderBoard: { testuser: { givenAnswers: { '1': 1 }, total: 0 } },
      },
    },
    {
      type: STYPES.PONG,
      state: {
        ...getDefaultState(),
        leaderBoard: { testuser: { givenAnswers: { '1': 0 }, total: 1 } },
      },
    },
    {
      type: STYPES.PONG,
      state: {
        ...getDefaultState(),
        leaderBoard: { testuser: { givenAnswers: { '1': 2 }, total: 0 } },
      },
    },
  ]

  t.deepEqual(msgs, expectedMsgs, 'wrong message flow')
  t.pass()
})

test.after(async () => {
  await container.stop()
})
