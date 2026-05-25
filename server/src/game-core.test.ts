import { describe, expect, test } from "@jest/globals";
import {
    Announcement,
    AnnouncementType,
    Bid,
    GameConfig,
    GameMode,
    GamePhase,
    GameState,
    Modifier,
    Rank,
    Suit,
    TrickStatus,
} from "@shared/types";
import {
    createBiddingState,
    createPlayingState,
    createScoringState,
} from "./state-builders";
import * as handlers from "./game-handlers";
import { compareCardsPower, higherBid } from "./compare";
import {
    addTrickScores,
    dealFinal,
    dealInitial,
    findAnns,
    getCardsOfSuit,
    getHighestPlayOfSuit,
    getTrickWinner,
    hasHigherSameSuit,
    isSameTeam,
    sortHandsAsc,
    sortHandsDesc,
} from "./game-actions";
import { Game } from "./game";
import { suite } from "node:test";

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
                announcements: {},
                dealer: "p4",
                highestBidder: null,
                deck: [],
                hands: { p1: [], p2: [], p3: [], p4: [] },
                roundScores: { team1: 6, team2: 7 },
                announcementScores:  { team1: 0, team2: 0 },
            },
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

describe("Playtest", () => {
    test("Playing", () => {
        const state = createPlayingState({
            plays: [
                { player: "p1", card: { rank: Rank.Jack, suit: Suit.Spades } },
            ],
            currentPlayer: "p2",
            round: {
                announcements: {},
                deck: [],
                hands: {
                    p2: [
                        { rank: Rank.Queen, suit: Suit.Hearts },
                        { rank: Rank.Queen, suit: Suit.Spades },
                        { rank: Rank.Nine, suit: Suit.Spades },
                        { rank: Rank.Ten, suit: Suit.Spades },
                        { rank: Rank.Ten, suit: Suit.Clubs },
                        { rank: Rank.Eight, suit: Suit.Spades },
                        { rank: Rank.King, suit: Suit.Clubs },
                        { rank: Rank.Seven, suit: Suit.Diamonds },
                    ],
                },
                dealer: "a",
                highestBidder: null,
                roundScores: { team1: 0, team2: 0 },
                announcementScores:  { team1: 0, team2: 0 },
                mode: GameMode.ALL_TRUMP,
            },
        });

        const card = { rank: Rank.Nine, suit: Suit.Spades };
        const result = handlers.handlePlay(MOCK_CONFIG, state, "p2", card);

        if (!result.ok) {
            console.log(result.reason);
        }
        expect(result.ok).toBe(true);
    });

    test("Comparing", () => {
        const state = createPlayingState({
            round: {
                announcements: {},
                deck: [],
                hands: {},
                dealer: "a",
                highestBidder: null,
                roundScores: { team1: 0, team2: 0 },
                announcementScores:  { team1: 0, team2: 0 },
                mode: GameMode.ALL_TRUMP,
            },
        });
        const lower = { rank: Rank.Nine, suit: Suit.Spades };
        const higher = { rank: Rank.Jack, suit: Suit.Spades };
        const result = compareCardsPower(state, higher, lower);
        expect(result > 0).toBe(true);
    });

    test("Comparing 2", () => {
        const state = createPlayingState({
            plays: [
                { player: "p1", card: { rank: Rank.Jack, suit: Suit.Spades } },
            ],
            currentPlayer: "p2",
            round: {
                announcements: {},
                deck: [],
                hands: {
                    p2: [
                        { rank: Rank.Queen, suit: Suit.Hearts },
                        { rank: Rank.Queen, suit: Suit.Spades },
                        { rank: Rank.Nine, suit: Suit.Spades },
                        { rank: Rank.Ten, suit: Suit.Spades },
                        { rank: Rank.Ten, suit: Suit.Clubs },
                        { rank: Rank.Eight, suit: Suit.Spades },
                        { rank: Rank.King, suit: Suit.Clubs },
                        { rank: Rank.Seven, suit: Suit.Diamonds },
                    ],
                },
                dealer: "a",
                highestBidder: null,
                roundScores: { team1: 0, team2: 0 },
                announcementScores:  { team1: 0, team2: 0 },
                mode: GameMode.ALL_TRUMP,
            },
        });
        const result = hasHigherSameSuit(state, "p2", {
            rank: Rank.Nine,
            suit: Suit.Spades,
        });
        expect(result).toBe(false);
    });

    test("Playtest TRUMP mode", () => {
        const state = createPlayingState({
            plays: [
                { player: "p1", card: { rank: Rank.Jack, suit: Suit.Spades } },
                { player: "p2", card: { rank: Rank.Queen, suit: Suit.Spades } },
            ],
            currentPlayer: "p3",
            round: {
                announcements: {},
                deck: [],
                hands: {
                    p3: [
                        { rank: Rank.Queen, suit: Suit.Hearts },
                        { rank: Rank.Nine, suit: Suit.Spades },
                        { rank: Rank.Ten, suit: Suit.Spades },
                        { rank: Rank.Ten, suit: Suit.Clubs },
                        { rank: Rank.Eight, suit: Suit.Spades },
                        { rank: Rank.King, suit: Suit.Clubs },
                        { rank: Rank.Seven, suit: Suit.Diamonds },
                        { rank: Rank.Eight, suit: Suit.Spades },
                    ],
                },
                dealer: "a",
                highestBidder: null,
                announcementScores:  { team1: 0, team2: 0 },
                roundScores: { team1: 0, team2: 0 },
                mode: GameMode.TRUMP,
                trump: Suit.Spades,
            },
        });
        expect(getHighestPlayOfSuit(state, Suit.Spades).card).toStrictEqual({
            rank: Rank.Jack,
            suit: Suit.Spades,
        });
        expect(getTrickWinner(state)).toBe("p1");
        expect(isSameTeam(MOCK_CONFIG, getTrickWinner(state), "p3")).toBe(true);

        const result = handlers.handlePlay(MOCK_CONFIG, state, "p3", {
            rank: Rank.Eight,
            suit: Suit.Spades,
        });
        if (!result.ok) console.log(result.reason);
        expect(result.ok).toBe(true);
    });

    test("Playtest - Bidding", () => {
        const state = createBiddingState({
            currentBidder: "p1",
            highestBid: null,
            round: {
                announcements: {},
                dealer: "p4",
                highestBidder: null,
                deck: [],
                hands: { p1: [], p2: [], p3: [], p4: [] },
                roundScores: { team1: 6, team2: 7 },
                announcementScores:  { team1: 0, team2: 0 },
            },
        });

        const result = handlers.handleBid(MOCK_CONFIG, state, "p1", {
            mode: GameMode.TRUMP,
            trump: Suit.Spades,
        });
        expect(result.ok).toBe(true);
        if (result.ok && result.state.phase === GamePhase.Bidding)
            expect(result.state.currentBidder).toBe("p2");
    });
});

describe("Scoring Phase", () => {
    test("Last trick score", () => {
        const state = createPlayingState({
            currentPlayer: "p4",
            plays: [
                { player: "p1", card: { rank: Rank.Nine, suit: Suit.Spades } },
                { player: "p2", card: { rank: Rank.Ace, suit: Suit.Spades } },
                { player: "p3", card: { rank: Rank.Eight, suit: Suit.Spades } },
            ],
            round: {
                announcements: {},
                mode: GameMode.NO_TRUMP,
                dealer: "p2",
                highestBidder: "p2",
                deck: [],
                hands: {
                    p1: [],
                    p2: [],
                    p3: [],
                    p4: [{ rank: Rank.Queen, suit: Suit.Spades }],
                },
                roundScores: { team1: 0, team2: 0 },
                announcementScores:  { team1: 0, team2: 0 },
            },
        });

        const result = handlers.handlePlay(MOCK_CONFIG, state, "p4", {
            rank: Rank.Queen,
            suit: Suit.Spades,
        });
        if (!result.ok) console.log(result.reason);
        expect(result.ok).toBe(true);
        if (result.ok && result.state.phase === GamePhase.Playing) {
            expect(result.state.plays.length).toBe(4);
            expect(result.state.trickStatus).toBe(TrickStatus.Resolving);
            const result_2 = handlers.handleResolveTrick(
                MOCK_CONFIG,
                result.state,
            );
            if (result_2.ok) {
                expect(result_2.state.phase).toBe(GamePhase.Scoring);
            }
        }
    });

    test("From Playing to Scoring transition", () => {
        const state = createPlayingState({
            currentPlayer: "p4",
            plays: [
                { player: "p1", card: { rank: Rank.Nine, suit: Suit.Spades } },
                { player: "p2", card: { rank: Rank.Ace, suit: Suit.Spades } },
                { player: "p3", card: { rank: Rank.Eight, suit: Suit.Spades } },
                { player: "p4", card: { rank: Rank.Queen, suit: Suit.Spades } },
            ],
            trickStatus: TrickStatus.Resolving,
            round: {
                announcements: {},
                mode: GameMode.NO_TRUMP,
                dealer: "p2",
                highestBidder: "p2",
                deck: [],
                hands: { p1: [], p2: [], p3: [], p4: [] },
                roundScores: { team1: 0, team2: 0 },
                announcementScores:  { team1: 0, team2: 0 },
            },
        });

        const result = handlers.handleResolveTrick(MOCK_CONFIG, state);
        if (result.ok) {
            expect(result.state.phase).toBe(GamePhase.Scoring);
        }
    });
});

describe("Starting new round", () => {
    test("Starting first round", () => {
        const game = new Game(MOCK_CONFIG);
        const state = game.getState();

        expect(state.phase).toBe(GamePhase.Bidding);
        for (const p of MOCK_CONFIG.players) {
            expect(state.round.hands[p].length).toBe(5);
        }
    });

    test("Starting 2nd and later round", () => {
        const wrongState = createPlayingState();
        let result = handlers.handleStartNewRound(MOCK_CONFIG, wrongState);
        expect(result.ok).toBe(false);

        const correctState = createScoringState();
        result = handlers.handleStartNewRound(MOCK_CONFIG, correctState);
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.state.phase).toBe(GamePhase.Bidding);
    });
});

describe("Announcements", () => {
    test("Sort cards", () => {
        const state = createPlayingState({
            round: {
                dealer: "",
                highestBidder: null,
                deck: [],
                hands: {
                    p1: [
                        { rank: Rank.Jack, suit: Suit.Clubs },
                        { rank: Rank.Seven, suit: Suit.Hearts },
                        { rank: Rank.Jack, suit: Suit.Diamonds },
                        { rank: Rank.Queen, suit: Suit.Clubs },
                        { rank: Rank.Seven, suit: Suit.Clubs },
                        { rank: Rank.Queen, suit: Suit.Diamonds },
                        { rank: Rank.King, suit: Suit.Spades },
                        { rank: Rank.Jack, suit: Suit.Spades },
                    ],
                    p2: [],
                    p3: [],
                    p4: [],
                },
                roundScores: { team1: 0, team2: 0 },
                announcements: {},
                announcementScores:  { team1: 0, team2: 0 },
            },
        });

        const correct = [
            { rank: Rank.Seven, suit: Suit.Clubs },
            { rank: Rank.Jack, suit: Suit.Clubs },
            { rank: Rank.Queen, suit: Suit.Clubs },
            { rank: Rank.Jack, suit: Suit.Diamonds },
            { rank: Rank.Queen, suit: Suit.Diamonds },
            { rank: Rank.Seven, suit: Suit.Hearts },
            { rank: Rank.Jack, suit: Suit.Spades },
            { rank: Rank.King, suit: Suit.Spades },
        ];

        const hands = sortHandsAsc(MOCK_CONFIG, state);
        expect(correct).toEqual(hands["p1"]);
    });
    test("Finding announcements 1", () => {
        const state = createPlayingState({
            round: {
                dealer: "",
                highestBidder: null,
                deck: [],
                hands: {
                    p1: [
                        { rank: Rank.Jack, suit: Suit.Spades },
                        { rank: Rank.Queen, suit: Suit.Spades },
                        { rank: Rank.Ten, suit: Suit.Spades },
                        { rank: Rank.King, suit: Suit.Spades },
                    ],
                    p2: [
                        { rank: Rank.Seven, suit: Suit.Spades },
                        { rank: Rank.Eight, suit: Suit.Spades },
                        { rank: Rank.Nine, suit: Suit.Spades },
                        { rank: Rank.Ace, suit: Suit.Spades },
                        { rank: Rank.Jack, suit: Suit.Spades },
                        { rank: Rank.Queen, suit: Suit.Spades },
                        { rank: Rank.Ten, suit: Suit.Spades },
                        { rank: Rank.King, suit: Suit.Spades },
                    ],
                    p3: [],
                    p4: [],
                },
                roundScores: { team1: 0, team2: 0 },
                announcementScores:  { team1: 0, team2: 0 },
                announcements: {},
            },
        });

        const anns = findAnns(MOCK_CONFIG, state);
        const correct: Announcement = {
            type: AnnouncementType.Quarte,
            suit: Suit.Spades,
            highestCard: Rank.King,
        };
        const correct2: Announcement[] = [
            {
                type: AnnouncementType.Quinte,
                suit: Suit.Spades,
                highestCard: Rank.Ace,
            },
            {
                type: AnnouncementType.Tierce,
                suit: Suit.Spades,
                highestCard: Rank.Nine
            }
        ];
        expect(anns["p1"]).toContainEqual(correct);
        expect(anns["p2"]).toStrictEqual(correct2);
    });

    test("Get of Suit", () => {
        const hand = [
            { rank: Rank.Jack, suit: Suit.Clubs },
            { rank: Rank.Seven, suit: Suit.Hearts },
            { rank: Rank.Jack, suit: Suit.Diamonds },
            { rank: Rank.Queen, suit: Suit.Clubs },
            { rank: Rank.King, suit: Suit.Spades },
            { rank: Rank.Seven, suit: Suit.Clubs },
            { rank: Rank.Queen, suit: Suit.Diamonds },
            { rank: Rank.Jack, suit: Suit.Spades },
        ];
        const ofSuit = getCardsOfSuit(hand, Suit.Spades);
        const correct = [
            { rank: Rank.King, suit: Suit.Spades },
            { rank: Rank.Jack, suit: Suit.Spades },
        ];
        expect(ofSuit).toEqual(correct);
    });
});
