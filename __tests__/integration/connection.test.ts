import test from 'ava'
import { Container } from './container'

test('Host connect and ping', async t => {
  const container = await new Container().init()
  const ws = container.getSocket()

  const msg1 = await ws.message
  t.is(msg1.type, 'PONG')
  ws.send({ type: 'PING' })
  const msg2 = await ws.message
  t.is(msg2.type, 'PONG')
  t.is(msg1.state, msg2.state)

  ws.disconnect()
  await ws.close
  await container.stop()

  t.pass()
})
