import { describe, expect, test } from "@jest/globals"
import { GameEngine } from "../src/game-engine";
import { CardRaw, GameMode, Rank, Seats, Suit } from "../../shared/types";

const MOCK_MODE : GameMode = GameMode.ALL_TRUMP; 
const MOCK_SEATS : Seats = ["P1", "P2", "P3", "P4"];

describe("Basics", () => {
    test("GameEngine Constructor", () => {
        const gameEngine = new GameEngine(MOCK_MODE, MOCK_SEATS);

        [...gameEngine.seats].forEach(pid => {
            expect(gameEngine.hands[pid].length).toBe(8);
        });
    });

    test("Someone has card", () => {
        const gameEngine = new GameEngine(MOCK_MODE, MOCK_SEATS);
        const c : CardRaw = { suit: Suit.Hearts, rank: Rank.Queen };

        const allHands = Object.values(gameEngine.hands);
        const cardExists = allHands.some(hand => 
            hand.some(card => card.suit === c.suit && card.rank === c.rank)
        );

        expect(cardExists).toBe(true);
    });
});

describe("Hand Tests", () => {
    test("Has card", () => {
        const gameEngine = new GameEngine(MOCK_MODE, MOCK_SEATS);
        const c : CardRaw = { suit: Suit.Hearts, rank: Rank.Queen };

        gameEngine.hands["P1"] = [c];

        expect(gameEngine['hasCard']("P1", { suit: Suit.Hearts, rank: Rank.Queen })).toBe(true);
    });


    test("Has suit", () => {
        const gameEngine = new GameEngine(MOCK_MODE, MOCK_SEATS);
        const c1 : CardRaw = { suit: Suit.Hearts, rank: Rank.Queen };

        gameEngine.hands["P1"] = [c1];

        expect(gameEngine['hasSuit']("P1", Suit.Hearts)).toBe(true);
        expect(gameEngine['hasSuit']("P1", Suit.Clubs)).toBe(false);

        const c2 : CardRaw = { suit: Suit.Diamonds, rank: Rank.Queen };

        gameEngine.hands["P2"] = [c2];

        expect(gameEngine['hasSuit']("P2", Suit.Diamonds)).toBe(true);
        expect(gameEngine['hasSuit']("P2", Suit.Clubs)).toBe(false);
    });

    test("Has higher same suit 1", () => {
        const gameEngine = new GameEngine(MOCK_MODE, MOCK_SEATS);
        const cLower : CardRaw = { suit: Suit.Diamonds, rank: Rank.Queen };
        const cHigher : CardRaw = { suit: Suit.Diamonds, rank: Rank.Jack };

        gameEngine.hands["P1"] = [cHigher];

        expect(gameEngine['hasHigherSameSuit']("P1", cLower)).toBe(true);
    });

    test("Has higher same suit 2", () => {
        const gameEngine = new GameEngine(GameMode.NO_TRUMP, MOCK_SEATS);
        const cLower : CardRaw = { suit: Suit.Diamonds, rank: Rank.Queen };
        const cHigher : CardRaw = { suit: Suit.Diamonds, rank: Rank.Jack };
        const cLow : CardRaw = { suit: Suit.Diamonds, rank: Rank.Eight };

        gameEngine.hands["P1"] = [cHigher];

        expect(gameEngine['hasHigherSameSuit']("P1", cLower)).toBe(false);
        expect(gameEngine['hasHigherSameSuit']("P1", cLow)).toBe(true);
    });
});

describe("Team tests", () => {
    test("Basic teams", () => {
        const gameEngine = new GameEngine(MOCK_MODE, MOCK_SEATS);

        expect(gameEngine['isSameTeam']("P1", "P3")).toBe(true);
        expect(gameEngine['isSameTeam']("P2", "P4")).toBe(true);
        expect(gameEngine['isSameTeam']("P1", "P2")).toBe(false);
        expect(gameEngine['isSameTeam']("P3", "P4")).toBe(false);
        expect(gameEngine['isSameTeam']("P1", "P4")).toBe(false);
        expect(gameEngine['isSameTeam']("P2", "P3")).toBe(false);
    });

    test("Invalid player id", () => {
        const gameEngine = new GameEngine(MOCK_MODE, MOCK_SEATS);

        expect(() => gameEngine['isSameTeam']("P1", "foo")).toThrow();
    });
});

describe("Can play scenarios", () => {
    test("Can play first", () => {
        const gameEngine = new GameEngine(MOCK_MODE, MOCK_SEATS);
        const c : CardRaw = { suit: Suit.Spades, rank: Rank.Jack };

        gameEngine.hands["P1"] = [c];

        expect(gameEngine['canPlay']("P1", c)).toBe(true);
    });

    test("Can't play unowned card", () => {
        const gameEngine = new GameEngine(MOCK_MODE, MOCK_SEATS);
        const owned : CardRaw = { suit: Suit.Spades, rank: Rank.Jack };
        const unowned : CardRaw = { suit: Suit.Hearts, rank: Rank.Queen };

        gameEngine.hands["P1"] = [owned];

        expect(gameEngine['canPlay']("P1", owned)).toBe(true);
        expect(gameEngine['canPlay']("P1", unowned)).toBe(false);
    });

    test("Must play owned suit", () => {
        const gameEngine = new GameEngine(GameMode.ALL_TRUMP, MOCK_SEATS);
        const playedCard : CardRaw = { suit: Suit.Hearts, rank: Rank.Eight };

        gameEngine.playedCards.push(
            { player: "P1", card: playedCard }
        );
        gameEngine.turn = "P2";

        const diffSuit : CardRaw = { suit: Suit.Spades, rank: Rank.Jack };
        const sameSuit : CardRaw = { suit: Suit.Hearts, rank: Rank.Jack };
        const hand = [
            diffSuit,
            sameSuit
        ];
        gameEngine.hands["P2"] = hand;

        expect(gameEngine['canPlay']("P2", sameSuit)).toBe(true);
        expect(gameEngine['canPlay']("P2", diffSuit)).toBe(false);
    });

    test("Can play any suit if unowned is played", () => {
        const gameEngine = new GameEngine(GameMode.ALL_TRUMP, MOCK_SEATS);
        const playedCard : CardRaw = { suit: Suit.Hearts, rank: Rank.Eight };

        gameEngine.playedCards.push(
            { player: "P1", card: playedCard }
        );
        gameEngine.turn = "P2";

        const diffSuit : CardRaw = { suit: Suit.Spades, rank: Rank.Jack };
        gameEngine.hands["P2"] = [diffSuit];

        expect(gameEngine['canPlay']("P2", diffSuit)).toBe(true);
    });

    test("All trump mode - must play higher", () => {
        const gameEngine = new GameEngine(GameMode.ALL_TRUMP, MOCK_SEATS);
        const playedCard : CardRaw = { suit: Suit.Diamonds, rank: Rank.Queen };

        gameEngine.playedCards.push(
            { player: "P1", card: playedCard}
        );
        gameEngine.turn = "P2";

        const higherSameSuit : CardRaw = { suit: Suit.Diamonds, rank: Rank.Ace };
        const other : CardRaw = { suit: Suit.Clubs, rank: Rank.Eight };
        const hand : CardRaw[] = [
            higherSameSuit,
            other
        ];

        gameEngine.hands["P2"] = hand;

        expect(gameEngine['canPlay']("P2", higherSameSuit)).toBe(true);
        expect(gameEngine['canPlay']("P2", other)).toBe(false);
    });

    test("All trump mode - must play higher 2", () => {
        const gameEngine = new GameEngine(GameMode.ALL_TRUMP, MOCK_SEATS);
        const playedCard : CardRaw = { suit: Suit.Diamonds, rank: Rank.Queen };
        const playedCard2 : CardRaw = { suit: Suit.Clubs, rank: Rank.Queen };
        const playedCard3 : CardRaw = { suit: Suit.Diamonds, rank: Rank.Ace };

        gameEngine.playedCards.push(
            { player: "P1", card: playedCard}
        );
        gameEngine.playedCards.push(
            { player: "P2", card: playedCard2}
        );
        gameEngine.playedCards.push(
            { player: "P3", card: playedCard3}
        );
        gameEngine.turn = "P4";

        const higherSameSuit : CardRaw = { suit: Suit.Diamonds, rank: Rank.Nine };
        const other : CardRaw = { suit: Suit.Clubs, rank: Rank.Eight };
        const hand : CardRaw[] = [
            higherSameSuit,
            other
        ];
        gameEngine.hands["P4"] = hand;

        expect(gameEngine['canPlay']("P4", higherSameSuit)).toBe(true);
        expect(gameEngine['canPlay']("P4", other)).toBe(false);
    });

    test("Trump mode - must play trump if losing hand", () => {
        const gameEngine = new GameEngine(GameMode.TRUMP, MOCK_SEATS, Suit.Diamonds);
        const nonTrump : CardRaw = { suit: Suit.Clubs, rank: Rank.Queen };
        const trump : CardRaw = { suit: Suit.Diamonds, rank: Rank.Nine };

        gameEngine.playedCards.push(
            { player: "P1", card: { suit: Suit.Hearts, rank: Rank.Ace }}
        );

        gameEngine.playedCards.push(
            { player: "P2", card: { suit: Suit.Hearts, rank: Rank.Eight }}
        );

        gameEngine.playedCards.push(
            { player: "P3", card: { suit: Suit.Hearts, rank: Rank.Ten }}
        );

        gameEngine.turn = "P4";
        gameEngine.hands["P4"] = [ nonTrump, trump ];

        expect(gameEngine['canPlay']("P4", nonTrump)).toBe(false);
        expect(gameEngine['canPlay']("P4", trump)).toBe(true);
    });

    test("Trump mode - must play higher trump than opponent", () => {
        const gameEngine = new GameEngine(GameMode.TRUMP, MOCK_SEATS, Suit.Diamonds);
        const higher : CardRaw = { suit: Suit.Diamonds, rank: Rank.Nine };
        const lower : CardRaw = { suit: Suit.Diamonds, rank: Rank.Queen };

        gameEngine.playedCards.push(
            { player: "P1", card: { suit: Suit.Diamonds, rank: Rank.Ten } }
        );

        gameEngine.turn = "P2";
        gameEngine.hands["P2"] = [ higher, lower ];

        expect(gameEngine['canPlay']("P2", lower)).toBe(false);
        expect(gameEngine['canPlay']("P2", higher)).toBe(true);
    });

    test("Trump mode - can play anything if winning hand", () => {
        const gameEngine = new GameEngine(GameMode.TRUMP, MOCK_SEATS, Suit.Diamonds);
        const higher : CardRaw = { suit: Suit.Diamonds, rank: Rank.Nine };
        const lower : CardRaw = { suit: Suit.Diamonds, rank: Rank.Queen };

        gameEngine.playedCards.push(
            { player: "P1", card: { suit: Suit.Diamonds, rank: Rank.Ten } }
        );

        gameEngine.playedCards.push(
            { player: "P2", card: { suit: Suit.Diamonds, rank: Rank.Jack } }
        );

        gameEngine.turn = "P3";
        gameEngine.hands["P3"] = [ higher, lower ];

        expect(gameEngine['canPlay']("P3", lower)).toBe(true);
        expect(gameEngine['canPlay']("P3", higher)).toBe(true);
    });
});