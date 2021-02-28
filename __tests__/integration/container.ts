import { GenericContainer, StartedTestContainer } from 'testcontainers'
import * as WebSocket from 'ws'
import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'

type PromiseHandle<T> = [Promise<T>, (t?: T) => void, (r?: any) => void]
const getPromise = <T>(): PromiseHandle<T> => {
  let resolve: (t?: T) => void
  let reject: (r?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return [promise, resolve, reject]
}

export class Container {
  private mappedPort: number
  public container: StartedTestContainer
  private readonly image: string = process.env.IMAGE || 'ghcr.io/tooxoot/quizzer-server:release'
  private readonly port: number = Number(process.env.PORT) || 8080

  public async init() {
    this.container = await new GenericContainer(this.image).withExposedPorts(this.port).start()
    this.mappedPort = this.container.getMappedPort(this.port)

    return this
  }

  public async getSocket(username = '') {
    if (!this.mappedPort || !this.container) throw Error('Container must be initialized')

    const ws = new WebSocket(
      `ws://${this.container.getHost()}:${this.mappedPort}/${username}`,
      username ? 'guest' : 'host'
    )

    const [close, resolveClose] = getPromise()
    ws.on('close', (n, r) => resolveClose([n, r]))

    const [open, resolveOpen] = getPromise()
    ws.on('open', () => resolveOpen())

    const messages: QP.Server.Message[] = []

    let countPromises: {
      resolve: () => void
      count: number
    }[] = []
    const getCountPromise = (count: number): Promise<void> => {
      if (count <= messages.length) return Promise.resolve()

      const [promise, resolve] = getPromise<void>()

      countPromises.push({
        resolve,
        count,
      })

      return promise
    }

    ws.on('message', data => {
      const msg = JSON.parse(data as string)
      messages.push(msg)
      countPromises.forEach(({ resolve, count }) => {
        if (count === messages.length) {
          resolve()
        }
      })
      countPromises = countPromises.filter(({ count }) => count > messages.length)
    })

    const send = (data: QP.HostClient.Message | QP.GuestClient.Message) => {
      ws.send(JSON.stringify(data))
    }

    await open // open socket
    if (messages.length < 1) {
      await getCountPromise(1) // first pong
    }

    return {
      messages,
      send,
      getCountPromise,
      disconnect: async () => {
        ws.close()
        return close
      },
    }
  }

  public async stop() {
    if (!this.mappedPort || !this.container) throw Error('Container must be initialized')
    await this.container.stop()

    this.mappedPort = undefined
    this.container = undefined
  }
}
