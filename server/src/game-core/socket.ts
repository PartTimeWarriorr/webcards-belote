import { RoomManager } from "./room-manager";
import { ClientToServerEvents, ServerToClientEvents } from "./events";
import { instrument } from "@socket.io/admin-ui";
import { ServerLogger } from "./server-log";
import { Player } from "src/player";
import { Server } from "socket.io";
import {
    Bid,
    Card,
    GameState,
    Move,
    PlayerId,
    PlayerView,
} from "./types";
import { Room } from "./room";

const roomManager = new RoomManager();

const logger = new ServerLogger();

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

        socket.on("room:join", (roomId) => {
            const room = roomManager.getRoom(roomId);
            const joined = room.join(socket.id);

            if (joined) {
                socket.join(room.name);
                io.to(room.name).emit("room:joined", {
                    player: socket.id,
                    room: room.name,
                });
            } else {
                socket.emit(
                    "client:error",
                    "Couldn't join room: Room is full.",
                );
            }

            if (room.isReady()) {
                try {
                    room.initGame();
                    const state = room.getGameState();
                    broadCastGameState(io, state, room);
                } catch (err) {
                    io.to(room.name).emit("room:error", "Error starting game");
                }
            }
        });

        socket.on("game:move", (move: Move) => {
            const room = roomManager.findRoomBySocket(socket.id);
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
            } else {
                socket.emit("client:error", result.reason);
            }
        });

        socket.on("room:leave", (roomId) => {
            const room = roomManager.getRoom(roomId);
            try {
                room.leave(socket.id);
            } catch (err) {
                socket.emit("client:error", "Player not in room");
            }

            io.to(room.name).emit("room:left", {
                player: socket.id,
                room: room.name,
            });
        });

        socket.on("disconnect", () => {
            const room = roomManager.findRoomBySocket(socket.id);
            if (!room) return;

            try {
                room.leave(socket.id);
            } catch (err) {
                socket.emit("client:error", "Player not in room");
            }
            io.to(room.name).emit("room:left", {
                player: socket.id,
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
        io.to(pid).emit("game:state", buildPlayerView(state, pid));
    }
}

function buildPlayerView(state: GameState, player: PlayerId): PlayerView {
    const playerHand = state.round.hands[player];
    const { hands, deck, ...publicRound } = state.round;
    return {
        ...state,
        round: {
            ...publicRound,
            hand: playerHand,
        },
    };
}
