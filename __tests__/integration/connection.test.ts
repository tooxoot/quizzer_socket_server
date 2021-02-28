import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'
import test from 'ava'
import { Container } from './container'

let container: Container

test.before(async () => {
  container = await new Container().init()
})

test('Host connect and ping', async t => {
  let ws = await container.getSocket()

  ws.send({ type: QP.HostClient.Message.TYPES.PING })

  await ws.disconnect()

  const [msg1, msg2] = ws.messages

  t.is(msg1.type, 'PONG')
  t.is(msg2.type, 'PONG')
  t.deepEqual(msg1.state, msg2.state)

  t.pass()
})

test('Guest connect and ping', async t => {
  let ws = await container.getSocket('testuser')

  ws.send({ type: QP.GuestClient.Message.TYPES.PING })

  await ws.disconnect()

  const [msg1, msg2] = ws.messages

  t.is(msg1.type, 'PONG')
  t.is(msg2.type, 'PONG')
  t.deepEqual(msg1.state, msg2.state)

  t.pass()
})

test.after(async () => {
  await container.stop()
})
