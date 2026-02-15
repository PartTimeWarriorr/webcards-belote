import { Server } from "socket.io";
import { Player } from "./player";
import { Card } from "./card";
import { Suit, Rank, BoardState, CardRaw, PlayerRaw } from "../../shared/types";
import { dealCards } from "./game";

const players = new Map<string, Player>();

export function setupSocket(server: any) {
    const io = new Server(server);

    io.on("connection", (socket) => {
        console.log(`A user connected: ${socket}`);
        console.log(`User id: ${socket.id}`);

        socket.emit("welcome", socket.id);

        players.set(socket.id, new Player(socket.id, "green"));

        if (players.size === 4) {
            dealCards(players);
            const playersRaw = Array.from(players.values(), (p) => p.toRaw());
            const boardState: BoardState = {
                players: playersRaw,
                turn: socket.id,
            };
            io.emit("updateBoard", boardState);
        }

        if (players.size > 4) {
            players.delete(socket.id);
        }

        socket.on("disconnect", () => {
            console.log(`A user disconnected: ${socket}`);
            console.log(`User id: ${socket.id}`);
            players.delete(socket.id);
        });
    });
}
