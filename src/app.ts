import { QuizzerProtocol as QP } from '@tooxoot/quizzer-protocol'
import { createServer } from 'http'
import { ClientSocket, GuestSocket, Handlers, Sockets } from './Server'
import * as WebSocket from 'ws'

// server logic //
const state: QP.State = {
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
  leaderBoard: {},
  lockQuestion: false,
  showLeaderBoard: false,
  showRightAnswers: false,
  timestamp: Date.now(),
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

    clientSocket.send({ type: QP.Server.Message.TYPES.PONG, state })
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

    guestSocket.send({ type: QP.Server.Message.TYPES.PONG, state })
  } else {
    socket.close(1002, 'protocol not sopported')
  }
}

const server = createServer((request, response) => {
  if (request.url === '/catalogue.json') {
    response.statusCode = 200
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.end(JSON.stringify(state.catalogue))
    return
  }
  response.writeHead(404)
  response.end()
})

server.listen(8080)

const ws = new WebSocket.Server({ server })

ws.on('connection', (client, request) => {
  initiate(client, request.url.substring(1))
})
