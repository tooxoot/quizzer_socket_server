import { GenericContainer, StartedTestContainer } from 'testcontainers'
import * as WebSocket from 'ws'
import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'

export class Container {
  private mappedPort: number
  private container: StartedTestContainer
  private readonly image: string = process.env.IMAGE || 'quizzer-server:release'
  private readonly port: number = Number(process.env.PORT) || 8080

  public async init() {
    this.container = await new GenericContainer(this.image).withExposedPorts(this.port).start()
    this.mappedPort = this.container.getMappedPort(this.port)

    return this
  }

  public getSocket(username = '') {
    if (!this.mappedPort || !this.container) throw Error('Container must be initialized')

    const ws = new WebSocket(
      `ws://localhost:${this.mappedPort}/${username}`,
      username ? 'guest' : 'host'
    )

    let resClose, rejClose
    const close: Promise<[number, string]> = new Promise((res, rej) => {
      resClose = res
      rejClose = rej
    })
    ws.on('close', (n, r) => resClose([n, r]))

    const messages: QP.Server.Message[] = []
    let resMessage, rejMessage
    let message: Promise<QP.Server.Message>
    const resetMsg = () => {
      message = new Promise((res, rej) => {
        resMessage = res
        rejMessage = rej
      })
    }
    resetMsg()
    ws.on('message', data => {
      const msg = JSON.parse(data as string)
      messages.push(msg)
      resMessage(msg)
      resetMsg()
    })

    const send = (data: QP.HostClient.Message | QP.GuestClient.Message) =>
      ws.send(JSON.stringify(data))

    return {
      close,
      message,
      messages,
      send,
      disconnect: () => ws.close(),
    }
  }

  public async stop() {
    if (!this.mappedPort || !this.container) throw Error('Container must be initialized')
    await this.container.stop()

    this.mappedPort = undefined
    this.container = undefined
  }
}
