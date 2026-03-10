import { Server } from "socket.io";
import { Player } from "./player";
import {
    CardRaw,
    GameMode,
} from "@shared/types";
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from "@shared/events";
import { instrument } from "@socket.io/admin-ui";
import { Room } from "./room";

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

        const joined = room.join(new Player(socket.id), "blue");
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

            room.startGame(GameMode.ALL_TRUMP);
            if (!room.gameEngine) throw new Error("GameEngine didn't start");
            const cardCounts = mapHandLengths(room.gameEngine.hands);

            playerIds.forEach((pid) => {
                io.to(pid).emit("updateBoard", {
                    hand: room.gameEngine?.hands[pid],
                    cardCounts: cardCounts,
                    turn: playerIds[0],
                    playedCards: [],
                });
            });
        }

        socket.on("playCard", async (card: CardRaw, ack: (success: boolean) => void) => {
            console.log(
                `Player ${socket.id}, played ${card.rank} of ${card.suit}`,
            );

            try {
                if (!room.gameEngine) {
                    console.log("GameEngine not loaded");
                    return;
                }

                const success = room.gameEngine.playCard(socket.id, card) ?? false;
                ack(success);

                if (!success) {
                    console.log(`Player couldn't play: ${card.rank} of ${card.suit}`);
                    return;
                }

                const cardCounts = mapHandLengths(room.gameEngine.hands);
                socket.to(room.name).emit("updateBoard", {
                    cardCounts: cardCounts,
                    turn: room.gameEngine.turn,
                    playedCards: room.gameEngine.playedCards
                });
                io.to(socket.id).emit("updateBoard", {
                    hand: room.gameEngine.hands[socket.id],
                    cardCounts: cardCounts,
                    turn: room.gameEngine.turn,
                    playedCards: room.gameEngine.playedCards
                });
                // io.to(room.name).emit("updateBoard", {
                //     hand: room.gameEngine.hands[socket.id],
                //     cardCounts: cardCounts,
                //     turn: room.gameEngine.turn,
                //     playedCards: room.gameEngine.playedCards
                // });

                if (room.gameEngine.isTrickOver()) {
                    setTimeout(() => {
                        if (!room.gameEngine) return;

                        room.gameEngine.finishTrick();
                        const cardCounts = mapHandLengths(room.gameEngine.hands);

                        // socket.to(room.name).emit("updateBoard", {
                        //     cardCounts: cardCounts,
                        //     turn: room.gameEngine.turn,
                        //     playedCards: room.gameEngine.playedCards
                        // });
                        const playerIds = room.getAllPlayerIds();
                        playerIds.forEach((pid) => {
                            io.to(pid).emit("updateBoard", {
                                hand: room.gameEngine?.hands[pid],
                                cardCounts: cardCounts,
                                turn: playerIds[0],
                                playedCards: [],
                            });
                        })
                    }, 1500);
                }
            } catch (error) {
                console.log(error);
                ack(false);
            }
        });

        socket.on("disconnect", () => {
            console.log(`A user disconnected: ${socket}`);
            console.log(`User id: ${socket.id}`);
            room.players.delete(socket.id);
        });
    });
}

function mapHandLengths(hands: Record<string, CardRaw[]>): Record<string, number> {
    return Object.fromEntries(
        Object.entries(hands).map(([pid, hand]) => [pid, hand.length])
    );
}