import { BaseGameState, BiddingState, GamePhase, PlayingState, ScoringState, TrickStatus } from "@shared/types" 
function createBaseState(): BaseGameState {
    return {
        round: {
            announcements: {},
            dealer: "p1",
            highestBidder: null,
            deck: [],
            hands: {},
            roundScores: {team1: 0, team2: 0}
        },
        totalScores: {team1: 0, team2: 0},
        hangingScore: 0
    }
}

export function createBiddingState(overrides: Partial<BiddingState> = {}): BiddingState {
    const base = createBaseState();
    return {
        phase: GamePhase.Bidding,
        highestBid: null,
        currentBidder: "p1",
        passed: new Set(),
        ...base,
        ...overrides,
    };
}

export function createPlayingState(overrides: Partial<PlayingState> = {}): PlayingState {
    const base = createBaseState();
    return {
        phase: GamePhase.Playing,
        currentPlayer: "p1",
        trickStatus: TrickStatus.Playing,
        plays: [],
        ...base,
        ...overrides
    };
}

export function createScoringState(overrides: Partial<ScoringState> = {}): ScoringState {
    const base = createBaseState();
    return {
        phase: GamePhase.Scoring,
        ...base,
        ...overrides
    };
}
