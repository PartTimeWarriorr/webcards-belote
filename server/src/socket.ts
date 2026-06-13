import { RoomManager } from "./room-manager";
import { ClientToServerEvents, ServerToClientEvents } from "../../shared/events";
import { instrument } from "@socket.io/admin-ui";
import { ServerLogger } from "./server-log";
import { Server } from "socket.io";
import {
    GameConfig,
    GameInitPayload,
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
        username: string;
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
            const decoded = <JwtPayload>jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            next();
        } catch (err) {
            return next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        socket.emit("welcome", socket.userId);
        socket.join(socket.userId);
        console.log(`${socket.userId} connected`);
        socket.on("room:join", (roomId) => {

            const room = roomManager.getRoom(roomId);
            const joined = room.join(socket.userId, socket.username);

            if (joined) {
                socket.join(room.name);
                io.to(room.name).emit("room:joined", {
                    player: socket.username,
                    room: room.name,
                    isGameActive: room.game !== undefined
                });
                io.to(room.name).emit("room:log", `${socket.username} joined the room`);
            } else {
                socket.emit("game:error", "Couldn't join room: Room is full.");
            }
        });

        socket.on("room:init", () => {
            const room = roomManager.findRoomByPlayerId(socket.userId);
            if (!room) return;

            socket.emit("room:init", {messages: [], joinedPlayers: Array.from(room.players).map(([_,v]) => v.username)});
        });

        socket.on("game:move", (move: Move) => {
            logger.logMove(move, socket.userId);
            const room = roomManager.findRoomByPlayerId(socket.userId);
            if (!room) {
                socket.emit("game:error", "You're not in any room/game");
                return;
            }
            if (!room.game) {
                socket.emit("game:error", "No game started in this room");
                return;
            }

            const result = room.game.applyMove(move);

            if (result.ok) {
                broadCastGameState(io, result.state, room);
                processBots(io, room);

                if (shouldResolveTrick(result.state)) {
                    const result = room.game.applyMove({
                        type: "RESOLVE_TRICK",
                    });
                    if (result.ok) {
                        setTimeout(() => {
                            broadCastGameState(io, result.state, room);
                            processBots(io, room);
                        }, 1000);
                    } else {
                        console.log(result.reason);
                    }
                }
            } else {
                socket.emit("game:error", result.reason);
            }
        });

        socket.on("game:save", async () => {
            const room = roomManager.findRoomByPlayerId(socket.userId);
            if (!room) {
                socket.emit("game:error", "You're not in any room/game");
                return;
            }

            if (!room.game) {
                socket.emit("game:error", "No game started in this room");
                return;
            }

            const replay = await room.game.saveReplay(socket.userId);
            if (replay) {
                socket.emit("game:log", "Replay saved!");
                return;
            }
        });

        socket.on("room:ready", (isReady) => {
            const room = roomManager.findRoomByPlayerId(socket.userId);
            if (!room) {
                socket.emit("game:error", "Not in any room");
                return;
            }
            try {
                isReady ? room.ready(socket.userId) : room.unready(socket.userId);
            } catch (err) {
                socket.emit("game:error", err instanceof Error ? err.message : "Unknown error");
            }

            io.to(room.name).emit("room:readied", Array.from(room.readyPlayers));

            if (room.allReady()) {
                console.log("Everyone is ready");
                room.resetReady();
            }
        });

        socket.on("game:sync", () => {
            console.log("Syncing game");
            const room = roomManager.findRoomByPlayerId(socket.userId);
            if (!room) {
                socket.emit("game:error", "Not in any room");
                return;
            }

            if (!room.game) {
                console.log("Whoops");
                return;
            }

            if (room.isGameFinished()) {
                room.initGame();
                const state = room.getGameState();
                const gameInit = room.getGameInitPayload();
                socket.emit("game:init", {
                    gameInit,
                    view: buildPlayerView(state, socket.userId),
                });
                return;
            }

            if (room.isGameScoring()) {
                const result = room.game.applyMove({
                    type: "START_NEW_ROUND",
                });
                if (result.ok) {
                    socket.emit("game:state", buildPlayerView(result.state, socket.userId));
                } else {
                    socket.emit("game:error", result.reason);
                }
                return;
            }
        });

        socket.on("game:advance", () => {
            const room = roomManager.findRoomByPlayerId(socket.userId);
            if (!room) {
                socket.emit("game:error", "Not in any room");
                return;
            }

            if (!room.game) {
                console.log("Whoops");
                return;
            }

            if (room.isGameFinished()) {
                room.initGame();
                const state = room.getGameState();
                const gameInit = room.getGameInitPayload();
                broadCastGameInit(io, state, gameInit, room);
                processBots(io, room);
                return;
            }

            if (room.isGameScoring()) {
                const result = room.game.applyMove({
                    type: "START_NEW_ROUND",
                });
                if (result.ok) {
                    broadCastGameState(io, result.state, room);
                    processBots(io, room);
                } else {
                    socket.emit("game:error", result.reason);
                }
                return;
            }
        });

        socket.on("game:init", () => {
            const room = roomManager.findRoomByPlayerId(socket.userId);
            if (!room) {
                socket.emit("game:error", "Player not in any room");
                return;
            }

            if (!room.game) {
                room.joinRandomTeams();
                room.initGame();
            }

            const state = room.getGameState();
            const gameInit = room.getGameInitPayload();
            socket.emit("game:init", {
                gameInit,
                view: buildPlayerView(state, socket.userId),
            });
            processBots(io, room);
        });

        socket.on("room:message", (msg: string) => {
            const room = roomManager.findRoomByPlayerId(socket.userId);
            if (!room) {
                socket.emit("game:error", "Player not in any room");
                return;
            }

            io.to(room.name).emit("room:messaged", socket.username, msg);
        });

        socket.on("room:leave", () => {
            const room = roomManager.findRoomByPlayerId(socket.userId);

            if (!room) {
                socket.emit("game:error", "Player not in any room");
                return;
            }

            try {
                room.leave(socket.userId);
            } catch (err) {
                socket.emit("game:error", "Player not in room");
            }

            io.to(room.name).emit("room:left", {
                player: socket.userId,
                room: room.name,
                isGameActive: true,
            });

            io.to(room.name).emit("room:log", `${socket.username} left the room.`);
        });

        socket.on("disconnect", () => {
            const room = roomManager.findRoomByPlayerId(socket.userId);
            if (!room) return;

            const player = room.players.get(socket.userId);
            if (!player) return;
            player.connected = false;
            console.log("Disconnected");
            console.log(room.players);

            io.to(room.name).emit("room:left", {
                player: socket.userId,
                room: room.name,
                isGameActive: true,
            });
        });
    });
}

function broadCastGameState(
    io: Server<ClientToServerEvents, ServerToClientEvents, any>,
    state: GameState,
    room: Room,
) {
    for (const pid of room.players.keys()) {
        console.log(`Broadcast game state to ${pid}`);
        io.to(pid).emit("game:state", buildPlayerView(state, pid));
    }
}

function broadCastGameInit(
    io: Server<ClientToServerEvents, ServerToClientEvents, any>,
    state: GameState,
    gameInit: GameInitPayload,
    room: Room,
) {
    for (const pid of room.players.keys()) {
        console.log(`Broadcast config to ${pid}`);
        io.to(pid).emit("game:init", {
            gameInit: gameInit,
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
    return state.phase === GamePhase.Playing && state.trickStatus === TrickStatus.Resolving;
}

async function processBots(io: Server<ClientToServerEvents, ServerToClientEvents, any>, room: Room) {
    while(room.game?.isBotTurn()) {
        await delay(500);

        const move = room.game.getBotMove();
        if (!move) break;
        const result = room.game.applyMove(move);

        if (!result.ok) break;

        broadCastGameState(io, result.state, room);

        if (shouldResolveTrick(result.state)) {
            await delay(1000);
            const trickResult = room.game.applyMove({type: "RESOLVE_TRICK"});

            if (!trickResult.ok) break;

            broadCastGameState(io, trickResult.state, room);
        }
    }
}

async function delay(ms: number) {
    return new Promise(res => setTimeout(res, ms)); 
}