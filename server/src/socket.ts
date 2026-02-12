import { Server } from 'socket.io';
import { Player } from './player';
import { Suit, Rank, Card } from '../../shared/card';

const players = new Map<string, Player>();

export function setupSocket(server: any) {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log(`A user connected: ${socket}`);
        console.log(`User id: ${socket.id}`);
        players.set(socket.id, new Player(socket.id));

        setTimeout(() => {
            // console.log("aaa");
            io.to(socket.id).emit("updateHand", [new Card(Suit.Clubs, Rank.Ace)])
        }, 3000);

        socket.on('disconnect', () => {
            console.log(`A user disconnected: ${socket}`);
            console.log(`User id: ${socket.id}`);
            players.delete(socket.id);
        });
    });
}