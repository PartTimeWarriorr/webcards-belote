import { Announcement, AnnouncementType, GameConfig, GameState, PlayerId, GameMode, Suit, Rank, SquareRank, Card} from "@shared/types";
import { ALL_TRUMP_SCORE, ANNOUNCE_ORDER } from "./constants";
import { compareSequences } from "./compare";
import { getCardsOfSuit, sortHandsDesc } from "./card-actions";
import { hasCard, hasRank } from "./play-rules";

export function removeSquares(anns: Announcement[]): Announcement[] {
    return anns.filter((a) => a.type !== AnnouncementType.Square);
}

// !
export function highestSquare(anns: Announcement[]): Announcement {
    return anns.reduce((acc, a) => {
        if (
            a.type !== AnnouncementType.Square ||
            acc.type !== AnnouncementType.Square
        )
            return acc;
        else
            return ALL_TRUMP_SCORE[acc.rank] - ALL_TRUMP_SCORE[a.rank] > 0
                ? acc
                : a;
    });
}

// !
export function highestSequence(anns: Announcement[]): Announcement {
    return anns.reduce((acc, a) => {
        return compareSequences(acc, a) > 0 ? acc : a;
    });
}

export function splitAnns(all: Announcement[]): [Announcement[], Announcement[]] {
    const seq: Announcement[] = [];
    const other: Announcement[] = [];

    all.forEach((a) => {
        if (
            a.type === AnnouncementType.Belot ||
            a.type === AnnouncementType.Square
        )
            other.push(a);
        else seq.push(a);
    });

    return [seq, other];
}

export function findAnns(
    config: GameConfig,
    state: GameState,
): Record<PlayerId, Announcement[]> {
    const mode = state.round.mode;
    if (mode === GameMode.NO_TRUMP) return { team1: [], team2: [] };

    const result: Record<PlayerId, Announcement[]> = config.players.reduce<
        Record<PlayerId, Announcement[]>
    >((acc, c) => {
        acc[c] = [];
        return acc;
    }, {});
    const sorted = sortHandsDesc(config, state.round.hands);

    for (const [p, hand] of Object.entries(sorted)) {
        for (const suit of Object.values(Suit)) {
            const ofSuit = getCardsOfSuit(hand, suit as Suit);
            result[p].push(...findAnnsHelp(ofSuit, suit as Suit));
        }
    }

    const squareRanks = [
        Rank.Ace,
        Rank.King,
        Rank.Queen,
        Rank.Jack,
        Rank.Ten,
        Rank.Nine,
    ];
    for (const [p, _] of Object.entries(sorted)) {
        for (const r in squareRanks) {
            if (
                hasRank(state, p, r as Rank) &&
                hasSquare(state, p, r as Rank)
            ) {
                const ann: Announcement = {
                    type: AnnouncementType.Square,
                    rank: r as SquareRank,
                };
                result[p].push(ann);
            }
        }
    }

    return result;
}

function findAnnsHelp(cards: Card[], suit: Suit): Announcement[] {
    const result: Announcement[] = [];

    if (cards.length === 0) return result;

    let start = 0;
    const flushRun = (end: number) => {
        const len = end - start + 1;
        if (len < 3) return;

        let remaining = len;
        let offset = 0;

        if (remaining >= 5) {
            result.push({
                type: AnnouncementType.Quinte,
                suit: suit,
                highestCard: cards[start + offset].rank,
            });

            remaining -= 5;
            offset += 5;
        }

        if (remaining === 4) {
            result.push({
                type: AnnouncementType.Quarte,
                suit: suit,
                highestCard: cards[start + offset].rank,
            });
        }

        if (remaining === 3) {
            result.push({
                type: AnnouncementType.Tierce,
                suit: suit,
                highestCard: cards[start + offset].rank,
            });
        }
    };

    for (let i = 1; i < cards.length; ++i) {
        const prev = cards[i - 1];
        const curr = cards[i];

        const consecutive =
            ANNOUNCE_ORDER[prev.rank] - 1 === ANNOUNCE_ORDER[curr.rank];

        if (!consecutive) {
            flushRun(i - 1);
            start = i;
        }
    }

    flushRun(cards.length - 1);

    return result;
}

function hasSquare(state: GameState, player: PlayerId, rank: Rank): boolean {
    return Object.values(Suit).every((suit) =>
        hasCard(state, player, { rank: rank, suit: suit }),
    );
}
