import { Room } from "./room";

export class RoomManager {
    private rooms = new Map<string, Room>;

    getRoom(roomName: string) : Room {
        if (!this.rooms.has(roomName)) 
            this.rooms.set(roomName, new Room(roomName));
        return this.rooms.get(roomName)!;
    }
}