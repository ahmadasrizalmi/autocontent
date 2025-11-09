import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
}

export function broadcastEvent(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}
