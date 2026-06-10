import {
    PlayerView,
    Bid,
    GameMode,
    Modifier,
    GamePhase,
    Suit,
} from "@shared/types";

export function parseBid(bid: string, gameView: PlayerView): Bid {
    switch (bid) {
        case "C":
        case "D":
        case "H":
        case "S": {
            return { mode: GameMode.TRUMP, trump: bid as Suit };
        }
        case "NT": {
            return { mode: GameMode.NO_TRUMP };
        }
        case "AT": {
            return { mode: GameMode.ALL_TRUMP };
        }
        case "x2": {
            if (gameView.phase !== GamePhase.Bidding)
                throw new Error("Not in bidding phase");
            if (!gameView.highestBid) throw new Error("Cannot x2");
            return {
                ...gameView.highestBid?.[1],
                modifier: Modifier.x2,
            } as Bid;
        }
        case "x4": {
            if (gameView.phase !== GamePhase.Bidding)
                throw new Error("Not in bidding phase");
            if (!gameView.highestBid) throw new Error("Cannot x4");
            return {
                ...gameView.highestBid?.[1],
                modifier: Modifier.x4,
            } as Bid;
        }
    }

    return {} as Bid;
}
