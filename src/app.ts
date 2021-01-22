import { createServer } from 'http'
import { Socket } from 'net'
import { ClientSocket, GuestSocket, Handlers, Sockets, State } from './Server'
import * as WebSocket from 'ws'

// server logic //
const state: State = {
  catalogue: {
    questions: [
      {
        id: '1',
        prompt: '1?',
        answers: ['A', 'B', 'C', 'D'],
        rightAnswer: 0,
      },
      {
        id: '1',
        prompt: '1?',
        answers: ['A', 'B', 'C', 'D'],
        rightAnswer: 2,
      },
      {
        id: '1',
        prompt: '1?',
        answers: ['A', 'B', 'C', 'D'],
        rightAnswer: 3,
      },
    ],
  },
  currentQuestionIdx: 0,
  givenAnswers: {},
}

const sockets: Sockets = {
  guests: new Set<GuestSocket>(),
  host: null,
}

const debugHandler = (data: unknown) => {
  if (typeof data === 'string') console.log('received:', data)
  else console.log('received non string!')

  console.log(state)
}

const initiate = (socket: WebSocket, name: string) => {
  socket.on('message', debugHandler)
  if (socket.protocol === 'host') {
    const clientSocket: ClientSocket = {
      send: (a, ...args: any[]) => socket.send(JSON.stringify(a), ...args),
    }

    sockets.host = clientSocket

    socket.on('message', Handlers.HostMessage.get(state, sockets, clientSocket))
    socket.on('close', () => {
      sockets.host = null
    })
  } else if (socket.protocol === 'guest' && name) {
    const guestSocket: GuestSocket = {
      userName: name,
      send: (a, ...args: any[]) => socket.send(JSON.stringify(a), ...args),
    }

    sockets.guests.add(guestSocket)

    socket.on('message', Handlers.GuestMessage.get(state, sockets, guestSocket))
    socket.on('close', () => {
      sockets.guests.delete(guestSocket)
    })
  } else {
    socket.close(1002, 'protocol not sopported')
  }
}

const server = createServer((_, response) => {
  response.writeHead(404)
  response.end()
})

server.listen(8080)

const ws = new WebSocket.Server({ server })

ws.on('connection', (client, request) => {
  initiate(client, request.url.substring(1))
})
