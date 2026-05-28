import { describe, expect, test } from "@jest/globals";
import { Announcement, AnnouncementType, Rank, Suit } from "@shared/types";
import { highestSequence } from "./announcements";

describe("Announcement getters", () => {

    test("Get highest sequence - empty array", () => {
        const anns: Announcement[] = [
        ];

        highestSequence(anns);
    });

    test("Get highest sequence", () => {
        const anns: Announcement[] = [
            {type: AnnouncementType.Tierce, suit: Suit.Spades, highestCard: Rank.Ace},
            {type: AnnouncementType.Quarte, suit: Suit.Spades, highestCard: Rank.King},
        ];

        const correct ={type: AnnouncementType.Quarte, suit: Suit.Spades, highestCard: Rank.King};

        expect(highestSequence(anns)).toStrictEqual(correct);
    });
});