import { PlayerId } from "@shared/types";
import { Room } from "./room";

export class RoomManager {
    private rooms = new Map<string, Room>;

    getRoom(roomName: string) : Room {
        if (!this.rooms.has(roomName)) 
            this.rooms.set(roomName, new Room(roomName));
        return this.rooms.get(roomName)!;
    }

    findRoomByPlayerId(pid: PlayerId): Room | undefined {
        for (const r of this.rooms.values()) {
            if (r.players.has(pid)) return r;
        }

        return undefined;
    }

    addRoom(roomName: string, isBotRoom: boolean) {
        this.rooms.set(roomName, new Room(roomName, isBotRoom));
    }
}