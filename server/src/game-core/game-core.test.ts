import { describe, expect, test } from "@jest/globals";
import {
    Bid,
    GameConfig,
    GameMode,
    GamePhase,
    GameState,
    Modifier,
    Suit,
    TrickStatus,
} from "./types";
import { createBiddingState, createPlayingState } from "./state-builders";
import * as handlers from "./game-handlers";
import { higherBid } from "./compare";

const MOCK_CONFIG: GameConfig = {
    players: ["p1", "p2", "p3", "p4"],
    teams: {
        team1: ["p1", "p3"],
        team2: ["p2", "p4"],
    },
};

describe("Test bid handler", () => {

    test("Bid not higher", () => {
        const state = createBiddingState({
            highestBid: ["p1", { mode: GameMode.ALL_TRUMP }],
            currentBidder: "p2",
        });
        const result = handlers.handleBid(MOCK_CONFIG, state, "p2", {
            mode: GameMode.NO_TRUMP,
        });

        console.log(result);

        expect(result.ok).toBe(false);
    });

    test("Not current bidder", () => {
        const state = createBiddingState({ currentBidder: "someone else" });
        const result = handlers.handleBid(MOCK_CONFIG, state, "p1", {
            mode: GameMode.ALL_TRUMP,
        });

        expect(result.ok).toBe(false);
    });
    test("Highest bid updated", () => {
        const state = createBiddingState();
        const result = handlers.handleBid(MOCK_CONFIG, state, "p1", {
            mode: GameMode.ALL_TRUMP,
        });

        expect(result.ok).toBe(true);

        if (!result.ok) throw Error("Unexpected");
        const nextState = result.state;

        if (nextState.phase !== GamePhase.Bidding) throw Error("Unexpected");

        expect(nextState.highestBid?.[0]).toBe("p1");
        expect(nextState.highestBid?.[1].mode).toBe(GameMode.ALL_TRUMP);
    });
});

describe("Test pass handler", () => {
    test("Pass registered", () => {
        const state = createBiddingState();
        const result = handlers.handlePass(MOCK_CONFIG, state, "p1");

        expect(result.ok).toBe(true);
        if (!result.ok) throw Error("Unexpected");

        const nextState = result.state;
        if (nextState.phase !== GamePhase.Bidding) throw Error("Unexpected");

        expect(nextState.passed.has("p1")).toBe(true);
    });

    test("All passed - no bid", () => {
        const state = createBiddingState({
            passed: new Set(["p1", "p2", "p3"]),
            currentBidder: "p4",
        });
        const result = handlers.handlePass(MOCK_CONFIG, state, "p4");

        expect(result.ok).toBe(true);
        if (!result.ok) throw Error("Unexpected");

        const nextState = result.state;
        if (nextState.phase !== GamePhase.Bidding) throw Error("Unexpected");
        expect(nextState.passed.size).toBe(0);
        expect(nextState.round.dealer !== state.round.dealer);
    });

    test("All passed - bid", () => {
        const state = createBiddingState({
            passed: new Set(["p2", "p3"]),
            currentBidder: "p4",
            highestBid: ["p1", { mode: GameMode.ALL_TRUMP }],
            round: {
                dealer: "p4",
                highestBidder: null,
                deck: [],
                hands: {"p1": [], "p2": [], "p3": [], "p4":[]},
                roundScores: {"team1":6, "team2":7}
            }
        });
        const result = handlers.handlePass(MOCK_CONFIG, state, "p4");

        expect(result.ok).toBe(true);
        if (!result.ok) throw Error("Unexpected");

        const nextState = result.state;

        expect(nextState.phase).toBe(GamePhase.Playing);
        expect(nextState.round.highestBidder).toBe("p1");
    });
});

// describe("Test play handler", () => {
//     test()
// });

describe("Test compare bids", () => {
    test.each([
        [
            { mode: GameMode.TRUMP, trump: Suit.Clubs },
            { mode: GameMode.NO_TRUMP },
            true,
        ],
        [
            { mode: GameMode.TRUMP, trump: Suit.Clubs, modifier: Modifier.x2 },
            { mode: GameMode.NO_TRUMP },
            true,
        ],
        [
            { mode: GameMode.TRUMP, trump: Suit.Clubs },
            { mode: GameMode.ALL_TRUMP },
            true,
        ],
    ])("Compare test base", (low, high, expected) => {
        expect(higherBid(low as Bid, high as Bid)).toBe(expected);
    });

    test.each([
        [
            { mode: GameMode.TRUMP, trump: Suit.Clubs },
            { mode: GameMode.TRUMP, trump: Suit.Diamonds },
            true,
        ],
        [
            { mode: GameMode.TRUMP, trump: Suit.Clubs },
            { mode: GameMode.TRUMP, trump: Suit.Clubs },
            false,
        ],
        [
            { mode: GameMode.TRUMP, trump: Suit.Spades },
            { mode: GameMode.TRUMP, trump: Suit.Diamonds },
            false,
        ],
        [
            { mode: GameMode.TRUMP, trump: Suit.Clubs },
            { mode: GameMode.TRUMP, trump: Suit.Spades, modifier: Modifier.x2 },
            true,
        ],
    ])("Compare test trump", (low, high, expected) => {
        expect(higherBid(low as Bid, high as Bid)).toBe(expected);
    });

    test.each([
        [
            { mode: GameMode.NO_TRUMP, modifier: Modifier.x2 },
            { mode: GameMode.NO_TRUMP, modifier: Modifier.x4 },
            true,
        ],
        [
            { mode: GameMode.NO_TRUMP },
            { mode: GameMode.NO_TRUMP, modifier: Modifier.x4 },
            true,
        ],
        [
            { mode: GameMode.NO_TRUMP, modifier: Modifier.x4 },
            { mode: GameMode.NO_TRUMP, modifier: Modifier.x2 },
            false,
        ],
        [
            { mode: GameMode.NO_TRUMP, modifier: Modifier.x4 },
            { mode: GameMode.NO_TRUMP },
            false,
        ],
    ])("Compare test modifier 1", (low, high, expected) => {
        expect(higherBid(low as Bid, high as Bid)).toBe(expected);
    });

    test.each([
        [
            { mode: GameMode.TRUMP, suit: Suit.Clubs },
            { mode: GameMode.TRUMP, suit: Suit.Clubs, modifier: Modifier.x2 },
            true,
        ],
        [
            { mode: GameMode.TRUMP, suit: Suit.Clubs, modifier: Modifier.x2 },
            { mode: GameMode.TRUMP, suit: Suit.Clubs },
            false,
        ],
        [
            {
                mode: GameMode.TRUMP,
                suit: Suit.Diamonds,
                modifier: Modifier.x2,
            },
            {
                mode: GameMode.TRUMP,
                suit: Suit.Diamonds,
                modifier: Modifier.x4,
            },
            true,
        ],
        [
            {
                mode: GameMode.TRUMP,
                suit: Suit.Diamonds,
                modifier: Modifier.x4,
            },
            {
                mode: GameMode.TRUMP,
                suit: Suit.Diamonds,
                modifier: Modifier.x2,
            },
            false,
        ],
    ])("Compare test modifier 2", (low, high, expected) => {
        expect(higherBid(low as Bid, high as Bid)).toBe(expected);
    });
});
