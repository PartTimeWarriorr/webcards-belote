import { describe, expect, test } from "@jest/globals";
import { Rank, Suit } from "@shared/types";
import { sortHandsAsc, sortHandsDesc } from "./card-actions";
import { MOCK_CONFIG } from "./constants";

describe("Old state immutability", () => {
    test("Sorting hands", () => {
        const oldHands = {
            "p1": [
                {rank: Rank.Jack, suit: Suit.Clubs},
                {rank: Rank.Ace, suit: Suit.Clubs},
                {rank: Rank.Eight, suit: Suit.Diamonds},
            ],
            "p2": [],
            "p3": [],
            "p4": []
        };

        const newHands = sortHandsDesc(MOCK_CONFIG, oldHands);
        expect(newHands).toEqual({
            "p1": [
                {rank: Rank.Eight, suit: Suit.Diamonds},
                {rank: Rank.Ace, suit: Suit.Clubs},
                {rank: Rank.Jack, suit: Suit.Clubs}
            ],
            "p2": [],
            "p3": [],
            "p4": []
        });

        expect(oldHands).toEqual({
            "p1": [
                {rank: Rank.Jack, suit: Suit.Clubs},
                {rank: Rank.Ace, suit: Suit.Clubs},
                {rank: Rank.Eight, suit: Suit.Diamonds},
            ],
            "p2": [],
            "p3": [],
            "p4": []
        });
    });

    test("Cloning deck", () => {
        const oldDeck = [{rank: Rank.Eight, suit: Suit.Diamonds},
            {rank: Rank.Nine, suit: Suit.Spades}
        ];

        const newDeck = structuredClone(oldDeck);
        newDeck.pop();
        newDeck[0].rank = Rank.Ace;
        expect(oldDeck.length).toBe(2);
        expect(newDeck.length).toBe(1);
        expect(oldDeck[0].rank).toBe(Rank.Eight);
        expect(newDeck[0].rank).toBe(Rank.Ace);
    });
})