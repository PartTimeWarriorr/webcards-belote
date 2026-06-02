import { RoomManager } from "./room-manager";
import {
    ClientToServerEvents,
    ServerToClientEvents,
} from "../../shared/events";
import { instrument } from "@socket.io/admin-ui";
import { ServerLogger } from "./server-log";
import { Server } from "socket.io";
import {
    GameConfig,
    GamePhase,
    GameState,
    Move,
    PlayerId,
    PlayerView,
    TrickStatus,
} from "@shared/types";
import { Room } from "./room";
import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

declare module "socket.io" {
    export interface Socket {
        userId: string;
    }
}

const roomManager = new RoomManager();
roomManager.addRoom("Test", true);
const logger = new ServerLogger();

export function setupSocket(server: any) {
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
        cors: {
            origin: ["https://localhost:5173", "https://admin.socket.io"],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    instrument(io, {
        auth: false,
    });

    io.use((socket, next) => {
        const cookie = socket.handshake.headers.cookie;

        if (!cookie) {
            return next(new Error("Missing cookie"));
        }

        const token = cookie.split("=")[1];

        if (!token) {
            return next(new Error("Missing token"));
        }

        try {
            const decoded = <JwtPayload>(
                jwt.verify(token, process.env.JWT_SECRET)
            );
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            return next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        socket.emit("welcome", socket.userId);
        console.log(`${socket.userId} connected`);
        socket.on("room:join", (roomId) => {
            const room = roomManager.getRoom(roomId);
            const joined = room.join(socket.userId);

            if (joined) {
                socket.join(room.name);
                io.to(room.name).emit("room:joined", {
                    player: socket.userId,
                    room: room.name,
                });
            } else {
                socket.emit(
                    "client:error",
                    "Couldn't join room: Room is full.",
                );
            }

            if (room.isFull()) {
                room.joinRandomTeams();
                try {
                    room.initGame();
                    const state = room.getGameState();
                    const config = room.getGameConfig();
                    broadCastGameInit(io, state, config, room);
                } catch (err) {
                    io.to(room.name).emit("room:error", "Error starting game");
                }
            }
        });

        socket.on("game:move", (move: Move) => {
            logger.logMove(move, socket.userId);
            const room = roomManager.findRoomBySocket(socket.userId);
            if (!room) {
                socket.emit("client:error", "You're not in any room/game");
                return;
            }
            if (!room.game) {
                socket.emit("client:error", "No game started in this room");
                return;
            }

            const result = room.game.applyMove(move);

            if (result.ok) {
                broadCastGameState(io, result.state, room);

                if (shouldResolveTrick(result.state)) {
                    const result = room.game.applyMove({
                        type: "RESOLVE_TRICK",
                    });
                    if (result.ok) {
                        setTimeout(() => {
                            broadCastGameState(io, result.state, room);
                        }, 1000);
                    } else {
                        console.log(result.reason);
                    }
                }
            } else {
                socket.emit("client:error", result.reason);
            }
        });

        socket.on("room:ready", (isReady) => {
            const room = roomManager.findRoomBySocket(socket.userId);
            if (!room) {
                socket.emit("client:error", "Not in any room");
                return;
            }
            try {
                isReady
                    ? room.ready(socket.userId)
                    : room.unready(socket.userId);
            } catch (err) {
                socket.emit(
                    "client:error",
                    err instanceof Error ? err.message : "Unknown error",
                );
            }

            io.to(room.name).emit(
                "room:readied",
                Array.from(room.readyPlayers),
            );

            if (room.allReady()) {
                if (!room.game) {
                    socket.emit("client:error", "No game started");
                    return;
                }

                if (room.isGameFinished()) {
                    room.initRematch();
                    const state = room.getGameState();
                    const config = room.getGameConfig();
                    broadCastGameInit(io, state, config, room);
                    return;
                }

                const result = room.game.applyMove({ type: "START_NEW_ROUND" });
                if (result.ok) {
                    broadCastGameState(io, result.state, room);
                }
            }
        });

        socket.on("room:leave", (roomId) => {
            const room = roomManager.getRoom(roomId);
            try {
                room.leave(socket.userId);
            } catch (err) {
                socket.emit("client:error", "Player not in room");
            }

            io.to(room.name).emit("room:left", {
                player: socket.userId,
                room: room.name,
            });
        });

        socket.on("disconnect", () => {
            const room = roomManager.findRoomBySocket(socket.userId);
            if (!room) return;

            try {
                room.leave(socket.userId);
            } catch (err) {
                socket.emit("client:error", "Player not in room");
            }
            io.to(room.name).emit("room:left", {
                player: socket.userId,
                room: room.name,
            });
        });
    });
}

function broadCastGameState(
    io: Server<ClientToServerEvents, ServerToClientEvents, any>,
    state: GameState,
    room: Room,
) {
    for (const pid of room.players) {
        console.log(`Broadcast game state to ${pid}`);
        io.to(pid).emit("game:state", buildPlayerView(state, pid));
    }
}

function broadCastGameInit(
    io: Server<ClientToServerEvents, ServerToClientEvents, any>,
    state: GameState,
    config: GameConfig,
    room: Room,
) {
    for (const pid of room.players) {
        console.log(`Broadcast config to ${pid}`);
        io.to(pid).emit("game:init", {
            config: config,
            view: buildPlayerView(state, pid),
        });
    }
}

function buildPlayerView(state: GameState, player: PlayerId): PlayerView {
    const { hands, deck, ...publicRound } = state.round;
    const playerHand = hands[player];
    const numCards: Record<string, number> = Object.fromEntries(
        Object.entries(hands)
            .filter(([pid, _]) => pid !== player)
            .map(([pid, cards]) => [pid, cards.length]),
    );
    return {
        ...state,
        round: {
            ...publicRound,
            hand: playerHand,
            numCards,
        },
    };
}

function shouldResolveTrick(state: GameState): boolean {
    return (
        state.phase === GamePhase.Playing &&
        state.trickStatus === TrickStatus.Resolving
    );
}
