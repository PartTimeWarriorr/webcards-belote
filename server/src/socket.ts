import { Server } from "socket.io";
import { Player } from "./player";
import {
    Suit,
    Rank,
    BoardState,
    CardRaw,
    PlayerRaw,
    GameConfig,
    Seats,
    PlayerId,
    Play,
} from "@shared/types";
import { dealCards } from "./game";
import { Card } from "./card";
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from "@shared/events";
import { serializeMap } from "./utils";
import { instrument } from "@socket.io/admin-ui";
import { Room } from "./room";

const players = new Map<string, Player>();
const playedCards = new Map<string, CardRaw>();

const room = new Room("Game_1");

export function setupSocket(server: any) {
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
        cors: {
            origin: ["https://admin.socket.io"],
            credentials: true,
        },
    });

    instrument(io, {
        auth: false,
    });

    io.on("connection", (socket) => {
        socket.emit("welcome", socket.id);

        players.set(socket.id, new Player(socket.id));
        const joined = room.join(players.get(socket.id)!, "blue");
        if (joined) socket.join(room.name);

        if (room.isFull()) {
            console.log("Room is now full");
            const playerIds = room.getAllPlayerIds();
            const seats = room.getSeats();
            const teams = playerIds.reduce(
                (acc, pid) => {
                    acc[pid] = room.getPlayerTeam(pid);
                    return acc;
                },
                {} as Record<string, string>,
            );

            playerIds.forEach((pid) => {
                io.to(pid).emit("startGame", {
                    playerId: pid,
                    seats,
                    teams,
                });
            });

            dealCards(room.players);
            playerIds.forEach((pid) => {
                const cardCounts: Record<string, number> = room
                    .getAllPlayerIds()
                    .filter((id) => id !== pid)
                    .reduce(
                        (acc, id) => {
                            acc[id] = 8;
                            return acc;
                        },
                        {} as Record<string, number>,
                    );

                io.to(pid).emit("updateBoard", {
                    hand: room.players.get(pid)!.hand.map((c) => c.toRaw()),
                    cardCounts: cardCounts,
                    turn: playerIds[0],
                    playedCards: [],
                });
            });
        }

        socket.on("playCard", (card) => {
            console.log(
                `Player ${socket.id}, played ${card.rank} of ${card.suit}`,
            );
            if (room.players.get(socket.id)?.hasCard(card)) {
                console.log("Has card")
                room.players.get(socket.id)?.removeCard(card);
                const cardCounts: Record<string, number> = room
                    .getAllPlayerIds()
                    .reduce(
                        (acc, id) => {
                            acc[id] = 8;
                            return acc;
                        },
                        {} as Record<string, number>,
                    );
                
                const pid = socket.id;
                // room.playedCards[pid] = card;
                const play: Play = { player: pid, card: card };
                room.playedCards.push(play);
                socket.to(room.name).emit("updateBoard", {
                    cardCounts: cardCounts,
                    turn: "",
                    playedCards: room.playedCards
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`A user disconnected: ${socket}`);
            console.log(`User id: ${socket.id}`);
            players.delete(socket.id);
        });
    });
}
