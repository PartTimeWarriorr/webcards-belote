import { Seats } from "@shared/types";

export function rotateSeats(seats: Seats, playerId: string): Seats {
    // Rotate the player positions so player is at south
    const playerIndex = seats.findIndex((id) => id === playerId);
    const rotated = [
        ...seats.slice(playerIndex),
        ...seats.slice(0, playerIndex),
    ];
    if (rotated.length !== 4) {
        throw new Error("Invalid seats");
    }

    return rotated as Seats;
}
