import { Server } from "socket.io";
import { Player } from "./player";
import { CardRaw, GameMode } from "@shared/types";
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

        socket.on("clientReady", () => {
            if (!room.isFull()) return;

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

            room.initGame();

            io.to(room.name).emit("startModeSetup");

            // if (!room.gameEngine) throw new Error("GameEngine didn't start");
            // const cardCounts = mapHandLengths(room.gameEngine.hands);

            // playerIds.forEach((pid) => {
            //     io.to(pid).emit(
            //         "initGame",
            //         {
            //             playerId: pid,
            //             seats,
            //             teams,
            //         },
            //         {
            //             hand: room.gameEngine?.hands[pid],
            //             cardCounts: cardCounts,
            //             turn: playerIds[0],
            //             playedCards: [],
            //         },
            //     );
            // });
        });

        socket.on(
            "pickMode", (mode) => {
                if (!room.gameEngine) return new Error("GameEngine didn't start");

                const success = room.gameEngine.pickMode(socket.id, mode);
                if (success) {
                    console.log("Yay");
                }
            }
        )

        socket.on(
            "playCard",
            async (card: CardRaw, ack: (success: boolean) => void) => {
                console.log(
                    `Player ${socket.id}, played ${card.rank} of ${card.suit}`,
                );

                try {
                    if (!room.gameEngine) {
                        console.log("GameEngine not loaded");
                        return;
                    }

                    const success =
                        room.gameEngine.playCard(socket.id, card) ?? false;
                    ack(success);

                    if (!success) {
                        console.log(
                            `Player couldn't play: ${card.rank} of ${card.suit}`,
                        );
                        return;
                    }

                    socket.to(room.name).emit("cardPlayed", {
                        playerId: socket.id,
                        card,
                    });

                    if (room.gameEngine.isTrickOver()) {
                        setTimeout(() => {
                            if (!room.gameEngine) return;

                            room.gameEngine.finishTrick();
                            io.to(room.name).emit("finishTrick");
                        }, 1500);
                    }
                } catch (error) {
                    console.log(error);
                    ack(false);
                }
            },
        );

        socket.on("disconnect", () => {
            console.log(`A user disconnected: ${socket}`);
            console.log(`User id: ${socket.id}`);
            room.leave(socket.id);
        });
    });
}

function mapHandLengths(
    hands: Record<string, CardRaw[]>,
): Record<string, number> {
    return Object.fromEntries(
        Object.entries(hands).map(([pid, hand]) => [pid, hand.length]),
    );
}