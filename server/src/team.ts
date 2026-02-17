import { Player } from "./player";

type PlayerSlot = Player | null;

export class Team {
    slots: [PlayerSlot, PlayerSlot] = [null, null];

    isFull() : boolean {
        return this.slots.every(s => s !== null);
    }

    join(player: Player) : boolean {
        if (this.isFull()) {
            return false;
        }

        const emptyIndex = this.slots.findIndex(i => i === null);
        this.slots[emptyIndex] = player;
        return true;
    }

    leave(player: Player) : boolean {
        const playerIndex = this.slots.findIndex(i => i === player);
        if (playerIndex === -1) {
            throw new Error(`Player ${player.id} is not in this team`);
        }

        this.slots[playerIndex] = null;
        return true;
    }

    includes(playerId: string) : Team | null {
        return this.slots.some(p => p?.id === playerId) ? this : null;
    }
}