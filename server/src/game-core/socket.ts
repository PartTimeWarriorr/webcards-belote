import { RoomManager } from "./room-manager";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/events";
import { instrument } from "@socket.io/admin-ui";
import { ServerLogger } from "./server-log";
import { Player } from "src/player";
import {Server} from "socket.io";
import { Card } from "./types";

const roomManager = new RoomManager();
const room = roomManager.getRoom("Game1");

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
        
        const joined = room.join(socket.id);
        if (joined) socket.join(room.name);

        socket.on("clientReady", () => {
            if (!room.isFull()) return;
            console.log("Room is now full");

            const playerIds = room.getSeats();
            const seats = playerIds;
            // const teams =

            room.joinRandomTeams();
            room.initGame();

            io.to(room.name).emit("sendState");
        });

        socket.on("playCard", async (card: Card, ack: (success: boolean) => void) => {
            
        });
    });
}