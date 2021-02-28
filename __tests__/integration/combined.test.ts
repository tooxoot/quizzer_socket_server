import test from 'ava'
import { Container } from './container'
import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'
import {
  defaultState,
  getDefaultState,
  hasAscendingTimestamps,
  synchronize,
  zerofyTimestamp,
} from './helper'

test('Combined I: Multiclient state push ', async t => {
  const container = await new Container().init()

  const HTYPES = QP.HostClient.Message.TYPES
  const STYPES = QP.Server.Message.TYPES

  let guest1 = await container.getSocket('testuser1')
  let guest2 = await container.getSocket('testuser2')
  let host = await container.getSocket()

  host.send({ type: HTYPES.NEXT_QUESTION })
  await host.getCountPromise(2)

  await guest1.disconnect()
  await guest2.disconnect()
  await host.disconnect()

  t.is(guest1.messages.length, 2)
  t.is(guest2.messages.length, 2)
  t.is(host.messages.length, 2)

  t.true(hasAscendingTimestamps(guest1.messages))
  t.true(hasAscendingTimestamps(guest2.messages))
  t.true(hasAscendingTimestamps(host.messages))

  const expectedMsgs: QP.Server.Message[] = [
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
  ]

  t.deepEqual(guest1.messages.map(zerofyTimestamp), expectedMsgs, 'wrong message flow')

  const syncError = 'synchronized clients have differnt states'
  t.deepEqual(guest1.messages, guest2.messages, syncError)
  t.deepEqual(guest1.messages, host.messages, syncError)

  await container.stop()
  t.pass()
})

test('Combined II: Guests submit + Host next + Guests submit', async t => {
  const container = await new Container().init()
  const GTYPES = QP.GuestClient.Message.TYPES
  const HTYPES = QP.HostClient.Message.TYPES
  const STYPES = QP.Server.Message.TYPES

  let [guest1, guest2, host] = await synchronize(
    container.getSocket('testuser1'),
    container.getSocket('testuser2'),
    container.getSocket()
  )

  await guest1.send({ type: GTYPES.SUBMIT_ANSWER, answer: 0 })
  await guest2.send({ type: GTYPES.SUBMIT_ANSWER, answer: 1 })

  await host.send({ type: HTYPES.NEXT_QUESTION })

  await guest1.send({ type: GTYPES.SUBMIT_ANSWER, answer: 1 })
  await guest2.send({ type: GTYPES.SUBMIT_ANSWER, answer: 3 })
  await guest2.send({ type: GTYPES.SUBMIT_ANSWER, answer: 2 })

  await host.send({ type: HTYPES.NEXT_QUESTION })

  await guest1.send({ type: GTYPES.SUBMIT_ANSWER, answer: 2 })
  await guest2.send({ type: GTYPES.SUBMIT_ANSWER, answer: 3 })

  await guest1.disconnect()
  await guest2.disconnect()
  await host.disconnect()

  t.is(guest1.messages.length, 10)
  t.is(guest2.messages.length, 10)
  t.is(host.messages.length, 10)

  const expectedMsgs = [
    {
      type: STYPES.PONG,
      state: defaultState,
    },
    {
      type: STYPES.PONG,
      state: {
        ...defaultState,
        leaderBoard: { testuser1: { givenAnswers: { '1': 0 }, total: 1 } },
      },
    },
    {
      type: STYPES.PONG,
      state: {
        ...defaultState,
        leaderBoard: {
          testuser1: { givenAnswers: { '1': 0 }, total: 1 },
          testuser2: { givenAnswers: { '1': 1 }, total: 0 },
        },
      },
    },
    {
      type: STYPES.SHOW_QUESTION,
      state: {
        ...defaultState,
        currentQuestionIdx: 1,
        leaderBoard: {
          testuser1: { givenAnswers: { '1': 0 }, total: 1 },
          testuser2: { givenAnswers: { '1': 1 }, total: 0 },
        },
      },
    },
    {
      type: STYPES.PONG,
      state: {
        ...defaultState,
        currentQuestionIdx: 1,
        leaderBoard: {
          testuser1: { givenAnswers: { '1': 0, '2': 1 }, total: 1 },
          testuser2: { givenAnswers: { '1': 1 }, total: 0 },
        },
      },
    },
    {
      type: STYPES.PONG,
      state: {
        ...defaultState,
        currentQuestionIdx: 1,
        leaderBoard: {
          testuser1: { givenAnswers: { '1': 0, '2': 1 }, total: 1 },
          testuser2: { givenAnswers: { '1': 1, '2': 3 }, total: 0 },
        },
      },
    },
    {
      type: STYPES.PONG,
      state: {
        ...defaultState,
        currentQuestionIdx: 1,
        leaderBoard: {
          testuser1: { givenAnswers: { '1': 0, '2': 1 }, total: 1 },
          testuser2: { givenAnswers: { '1': 1, '2': 2 }, total: 1 },
        },
      },
    },
    {
      type: STYPES.SHOW_QUESTION,
      state: {
        ...defaultState,
        currentQuestionIdx: 2,
        leaderBoard: {
          testuser1: { givenAnswers: { '1': 0, '2': 1 }, total: 1 },
          testuser2: { givenAnswers: { '1': 1, '2': 2 }, total: 1 },
        },
      },
    },
    {
      type: STYPES.PONG,
      state: {
        ...defaultState,
        currentQuestionIdx: 2,
        leaderBoard: {
          testuser1: { givenAnswers: { '1': 0, '2': 1, '3': 2 }, total: 1 },
          testuser2: { givenAnswers: { '1': 1, '2': 2 }, total: 1 },
        },
      },
    },
    {
      type: STYPES.PONG,
      state: {
        ...defaultState,
        currentQuestionIdx: 2,
        leaderBoard: {
          testuser1: { givenAnswers: { '1': 0, '2': 1, '3': 2 }, total: 1 },
          testuser2: { givenAnswers: { '1': 1, '2': 2, '3': 3 }, total: 2 },
        },
      },
    },
  ]

  t.deepEqual(guest1.messages.map(zerofyTimestamp), expectedMsgs, 'wrong message flow')

  const syncError = 'synchronized clients have differnt states'
  t.deepEqual(guest1.messages, guest2.messages, syncError)
  t.deepEqual(guest1.messages, host.messages, syncError)

  await container.stop()
  t.pass()
})
