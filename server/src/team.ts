import { PlayerId } from "@shared/types";

type PlayerSlot = PlayerId | null;

export class Team {
    slots: [PlayerSlot, PlayerSlot] = [null, null];

    isFull() : boolean {
        return this.slots.every(s => s !== null);
    }

    join(id: PlayerId) : boolean {
        if (this.isFull()) {
            return false;
        }

        const emptyIndex = this.slots.findIndex(i => i === null);
        this.slots[emptyIndex] = id;
        return true;
    }

    leave(id: PlayerId) : boolean {
        const playerIndex = this.slots.findIndex(i => i === id);
        if (playerIndex === -1) {
            throw new Error(`Player ${id} is not in this team`);
        }

        this.slots[playerIndex] = null;
        return true;
    }

    includes(pid: string) : Team | null {
        return this.slots.some(id => id === pid) ? this : null;
    }
}