import { BiddingState, GameConfig, GameState } from "@shared/types";

// Reset hands and bidding (Bidding -> new Bidding)
export function allPassed(state: BiddingState, config: GameConfig): boolean {
    return config.players.every((p) => state.passed.has(p));
}

// Transition: Bidding -> Playing
export function allButBidderPassed(
    state: BiddingState,
    config: GameConfig,
): boolean {
    if (!state.highestBid?.[0]) return false;
    const index = config.players.indexOf(state.highestBid[0]);
    const others = config.players.slice();
    others.splice(index, 1);

    return others.every((p) => state.passed.has(p));
}

// Transition: Playing -> Scoring
export function isRoundFinished(state: GameState): boolean {
    return Object.values(state.round.hands).every((h) => h.length === 0);
}