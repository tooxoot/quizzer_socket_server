import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'
import test from 'ava'
import { Container } from './container'

let container: Container

test.before(async () => {
  container = await new Container().init()
})

test('Host connect and ping', async t => {
  let ws = container.getSocket()

  const msg1 = await ws.message
  t.is(msg1.type, 'PONG')
  ws.send({ type: QP.HostClient.Message.TYPES.PING })
  const msg2 = await ws.message
  t.is(msg2.type, 'PONG')
  t.is(msg1.state, msg2.state)

  ws.disconnect()
  await ws.close

  t.pass()
})

test('Guest connect and ping', async t => {
  let ws = container.getSocket('testuser')

  const msg1 = await ws.message
  t.is(msg1.type, 'PONG')
  ws.send({ type: QP.GuestClient.Message.TYPES.PING })
  const msg2 = await ws.message
  t.is(msg2.type, 'PONG')
  t.is(msg1.state, msg2.state)

  ws.disconnect()
  await ws.close

  t.pass()
})

test.after(async () => {
  await container.stop
})
