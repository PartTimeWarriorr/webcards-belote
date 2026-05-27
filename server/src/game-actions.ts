import {
    compareCardsFull,
    compareCardsPower,
    compareSequences,
} from "./compare";
import {
    Play,
    Card,
    Suit,
    Rank,
    PlayingState,
    GameConfig,
    PlayerId,
    BiddingState,
    GameState,
    GameMode,
    TeamId,
    Scores,
    Result,
    GamePhase,
    TrickStatus,
    Announcement,
    AnnouncementType,
    ANNOUNCEMENT_LENGTH,
    SquareRank,
} from "@shared/types";
import {
    ALL_TRUMP_POWER,
    ALL_TRUMP_SCORE,
    ANNOUNCE_ORDER,
    NO_TRUMP_SCORE,
    TARGET_SCORE,
    VALAT_SCORE,
} from "./game-rules";

export function shuffle(): Card[] {
    const deck = getFullDeck();
    return deck.sort(() => Math.random() - 0.5);
}

function getFullDeck(): Card[] {
    const deck: Card[] = [];
    for (let s of Object.values(Suit)) {
        for (let r of Object.values(Rank)) {
            deck.push({ rank: r, suit: s });
        }
    }
    return deck;
}

export function getNextToPlay(
    state: PlayingState,
    config: GameConfig,
): PlayerId {
    if (state.plays.length === 0) {
        return getNextPlayer(config.players, state.round.dealer);
    }

    const last = state.plays[state.plays.length - 1].player;
    return getNextPlayer(config.players, last);
}

export function getNextToBid(
    state: BiddingState,
    config: GameConfig,
): PlayerId {
    // if (state.highestBid === null) {
    //     return getNextPlayer(config.players, state.round.dealer);
    // }

    const last = state.currentBidder;

    return getNextPlayer(config.players, last);
}

export function getNextPlayer(
    players: PlayerId[],
    current: PlayerId,
): PlayerId {
    const idx = players.indexOf(current);
    if (idx === -1) throw new Error("Invalid player");

    return players[(idx + 1) % players.length];
}

export function allPassed(state: BiddingState, config: GameConfig): boolean {
    return config.players.every((p) => state.passed.has(p));
}

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

export function dealInitial(
    state: GameState,
    config: GameConfig,
): [Card[], Record<PlayerId, Card[]>] {
    const deck = state.round.deck;
    const hands = state.round.hands;

    config.players.forEach((p) => {
        hands[p] = deck.splice(0, 5);
    });

    return [deck, hands];
}

export function dealFinal(
    state: GameState,
    config: GameConfig,
): [Card[], Record<PlayerId, Card[]>] {
    const deck = state.round.deck;
    const hands = state.round.hands;

    config.players.forEach((p) => {
        hands[p] = hands[p].concat(deck.splice(0, 3));
    });

    return [deck, hands];
}

export function hasCard(
    state: GameState,
    player: PlayerId,
    card: Card,
): boolean {
    return state.round.hands[player].some(
        (c) => c.rank === card.rank && c.suit === card.suit,
    );
}

function hasRank(state: GameState, player: PlayerId, rank: Rank): boolean {
    return state.round.hands[player].some((c) => c.rank === rank);
}

export function hasSuit(
    state: GameState,
    player: PlayerId,
    suit: Suit,
): boolean {
    return state.round.hands[player].some((c) => c.suit === suit);
}

export function hasHigherSameSuit(
    state: GameState,
    player: PlayerId,
    card: Card,
): boolean {
    return state.round.hands[player].some(
        (c) => compareCardsPower(state, c, card) > 0 && c.suit === card.suit,
    );
}

export function getHighestPlay(state: PlayingState): Play {
    const plays = state.plays;
    plays.sort((left, right) =>
        compareCardsPower(state, left.card, right.card),
    );
    return plays[0];
}

export function getHighestPlayOfSuit(state: PlayingState, suit: Suit): Play {
    const filtered = state.plays.filter((p) => p.card.suit === suit);
    filtered.sort((left, right) =>
        compareCardsPower(state, right.card, left.card),
    );
    return filtered[0];
}

export function getHighestOppTrump(
    config: GameConfig,
    state: PlayingState,
    player: PlayerId,
): Card {
    const oppTrumps = state.plays
        .filter(
            (play) =>
                play.card.suit === state.round.trump &&
                !isSameTeam(config, play.player, player),
        )
        .map((play) => play.card);
    oppTrumps.sort((left, right) => compareCardsPower(state, left, right));
    return oppTrumps[0];
}

export function isTrumpPlayed(state: PlayingState, trump: Suit): boolean {
    if (state.round.mode !== GameMode.TRUMP)
        throw new Error("This is not a TRUMP mode game");

    return state.plays.some((play) => play.card.suit === trump);
}

export function canPlay(
    state: PlayingState,
    player: PlayerId,
    card: Card,
    config: GameConfig,
): Result<boolean> {
    if (state.currentPlayer !== player)
        return { ok: false, reason: "It's not this player's turn" };
    if (!hasCard(state, player, card))
        return { ok: false, reason: "Player doesn't have this card" };

    if (state.plays.length === 0) return { ok: true, state: true };
    if (state.plays.length === 4)
        return { ok: false, reason: "Trick is complete already" };

    const { player: trickPlayer, card: trickCard } = state.plays[0];
    const trickSuit = trickCard.suit;

    switch (state.round.mode) {
        case GameMode.ALL_TRUMP: {
            if (hasSuit(state, player, trickSuit) && card.suit !== trickSuit)
                return {
                    ok: false,
                    reason: "ALL_TRUMP mode: Player has correct suit but not playing it.",
                };

            const { card: highest } = getHighestPlay(state);
            if (
                compareCardsPower(state, highest, card) > 0 &&
                hasHigherSameSuit(state, player, highest)
            )
                return {
                    ok: false,
                    reason: "ALL_TRUMP mode: Player has higher card of suit, but not playing it.",
                };

            return { ok: true, state: true };
        }
        case GameMode.NO_TRUMP: {
            if (hasSuit(state, player, trickSuit) && card.suit !== trickSuit)
                return {
                    ok: false,
                    reason: "NO_TRUMP mode: Player has correct suit but not playing it.",
                };

            return { ok: true, state: true };
        }
        case GameMode.TRUMP: {
            if (!state.round.trump) {
                throw new Error("No trump selected in TRUMP GameMode");
            }

            if (hasSuit(state, player, trickSuit) && card.suit !== trickSuit)
                return {
                    ok: false,
                    reason: "TRUMP mode: Player has correct suit but not playing it.",
                };

            const trickWinner = getTrickWinner(state);
            if (
                !isSameTeam(config, trickWinner, player) &&
                !hasSuit(state, player, trickSuit) &&
                hasSuit(state, player, state.round.trump) &&
                card.suit !== state.round.trump
            )
                return {
                    ok: false,
                    reason: "TRUMP mode: The winner is the opposing team and the player has a trump they can play.",
                };

            const highestOppTrump = getHighestOppTrump(config, state, player);
            if (
                !isSameTeam(config, trickWinner, player) &&
                highestOppTrump &&
                compareCardsPower(state, highestOppTrump, card) > 0 &&
                hasHigherSameSuit(state, player, highestOppTrump)
            )
                return {
                    ok: false,
                    reason: "TRUMP mode: Player has higher trump than the opponent but not playing it.",
                };

            return { ok: true, state: true };
        }
        default:
            return { ok: false, reason: "Default" };
    }
}

export function isSameTeam(
    config: GameConfig,
    pid_1: PlayerId,
    pid_2: PlayerId,
): boolean {
    const ind_1 = config.players.indexOf(pid_1);
    const ind_2 = config.players.indexOf(pid_2);

    if (ind_1 === -1 || ind_2 === -1) {
        throw new Error("Invalid player id");
    }

    return Math.abs(ind_1 - ind_2) === 2;
}

export function getTrickWinner(state: PlayingState): PlayerId {
    const { card: trickCard } = state.plays[0];
    const trickSuit = trickCard.suit;

    switch (state.round.mode) {
        case GameMode.ALL_TRUMP:
        case GameMode.NO_TRUMP: {
            const highestOfSuit = getHighestPlayOfSuit(state, trickSuit);

            return highestOfSuit.player;
        }
        case GameMode.TRUMP: {
            if (!state.round.trump) {
                throw new Error("No trump selected in TRUMP GameMode");
            }

            if (isTrumpPlayed(state, state.round.trump)) {
                const highestOfSuit = getHighestPlayOfSuit(
                    state,
                    state.round.trump,
                );

                return highestOfSuit.player;
            } else {
                const highestOfSuit = getHighestPlayOfSuit(state, trickSuit);

                return highestOfSuit.player;
            }
        }
    }

    return "";
}

export function isRoundFinished(state: GameState): boolean {
    return Object.values(state.round.hands).every((h) => h.length === 0);
}

export function getTeamId(config: GameConfig, player: PlayerId): TeamId {
    const { team1, team2 } = config.teams;

    if (team1.includes(player)) return "team1";
    if (team2.includes(player)) return "team2";

    throw new Error("Player not found in any team");
}

function getWinnerTeamId(scores: Scores): TeamId | undefined {
    if (scores.team1 > scores.team2) {
        return "team1";
    } else if (scores.team1 < scores.team2) {
        return "team2";
    } else if (scores.team1 === scores.team2) {
        return undefined;
    }
}

function calcScore(base: number): number {
    return Math.round(base / 10);
}

export function addRoundScores(
    config: GameConfig,
    state: PlayingState,
): { scores: Scores; hanging: number; condition: string} {
    const newTotal = { ...state.totalScores };
    const roundScores = state.round.roundScores;
    const annScores = state.round.announcementScores;
    const modifier = state.round.modifier;
    const isNoTrump = state.round.mode === GameMode.NO_TRUMP;

    if (!state.round.highestBidder)
        throw new Error("Game has no highest bidder");

    const winnerTeamId = getWinnerTeamId(roundScores);
    const bidderTeamId = getTeamId(config, state.round.highestBidder);

    if (modifier) {
        if (!winnerTeamId) {
            const otherTeam = bidderTeamId === "team1" ? "team2" : "team1";
            return {
                scores: newTotal,
                hanging:
                    state.hangingScore +
                    calcScore(
                        ((roundScores[bidderTeamId] + roundScores[otherTeam]) *
                            (isNoTrump ? 2 : 1) +
                            annScores[bidderTeamId] +
                            annScores[otherTeam]) *
                            modifier,
                    ),
                condition: "Hanging"
            };
        }
        const otherTeam = winnerTeamId === "team1" ? "team2" : "team1";
        newTotal[winnerTeamId] +=
            calcScore(
                ((roundScores[otherTeam] + roundScores[winnerTeamId]) *
                    (isNoTrump ? 2 : 1) +
                    annScores[otherTeam] +
                    annScores[winnerTeamId]) *
                    modifier,
            ) + state.hangingScore;

        return {
            scores: newTotal,
            hanging: 0,
            condition: "Contra"
        };
    }

    if (winnerTeamId === undefined) {
        // visqshti
        const otherTeam = bidderTeamId === "team1" ? "team2" : "team1";

        newTotal[otherTeam] += calcScore(
            roundScores[otherTeam] * (isNoTrump ? 2 : 1) + annScores[otherTeam],
        );
        const newHangingScore =
            state.hangingScore +
            calcScore(
                roundScores[bidderTeamId] * (isNoTrump ? 2 : 1) +
                    annScores[bidderTeamId],
            );

        return {
            scores: newTotal,
            hanging: newHangingScore,
            condition: "Hanging"
        };
    }

    if (winnerTeamId === bidderTeamId) {
        // izlizame - vsichko e tochno
        const otherTeam = winnerTeamId === "team1" ? "team2" : "team1";
        const isValat = roundScores[otherTeam] === 0;
        newTotal[winnerTeamId] +=
            calcScore(
                roundScores[winnerTeamId] * (isNoTrump ? 2 : 1) +
                    annScores[winnerTeamId] +
                    (isValat ? VALAT_SCORE : 0),
            ) + state.hangingScore;
        newTotal[otherTeam] += calcScore(
            roundScores[otherTeam] * (isNoTrump ? 2 : 1) + annScores[otherTeam],
        );

        const newHangingScore = 0;

        return {
            scores: newTotal,
            hanging: newHangingScore,
            condition: (isValat ? "Valat" : "Outside")
        };
    } else if (winnerTeamId !== bidderTeamId) {
        // vytre
        const isValat = roundScores[bidderTeamId] === 0;
        newTotal[winnerTeamId] +=
            calcScore(
                roundScores[winnerTeamId] * (isNoTrump ? 2 : 1) +
                    roundScores[bidderTeamId] * (isNoTrump ? 2 : 1) +
                    annScores[winnerTeamId] +
                    annScores[bidderTeamId] +
                    (isValat ? VALAT_SCORE : 0),
            ) + state.hangingScore;
        const newHangingScore = 0;
        return {
            scores: newTotal,
            hanging: newHangingScore,
            condition: (isValat ? "Valat" : "Inside")
        };
    }

    return {
        scores: newTotal,
        hanging: 0,
        condition: ""
    };
}

export function addTrickScores(
    config: GameConfig,
    state: PlayingState,
    winner: PlayerId,
    isRoundOver: boolean,
): Scores {
    const trickScore = state.plays.reduce((total, play) => {
        return (total += getCardScore(state, play.card));
    }, 0);

    const trickWinnerId = getTeamId(config, winner);
    return {
        team1:
            state.round.roundScores.team1 +
            ("team1" === trickWinnerId ? trickScore : 0) +
            ("team1" === trickWinnerId && isRoundOver ? 10 : 0),
        team2:
            state.round.roundScores.team2 +
            ("team2" === trickWinnerId ? trickScore : 0) +
            ("team2" === trickWinnerId && isRoundOver ? 10 : 0),
    };
}

export function getCardScore(state: GameState, card: Card): number {
    switch (state.round.mode) {
        case GameMode.ALL_TRUMP: {
            return ALL_TRUMP_SCORE[card.rank];
        }
        case GameMode.NO_TRUMP: {
            return NO_TRUMP_SCORE[card.rank];
        }
        case GameMode.TRUMP: {
            if (card.suit === state.round.trump) {
                return ALL_TRUMP_SCORE[card.rank];
            } else {
                return NO_TRUMP_SCORE[card.rank];
            }
        }
    }

    return 0;
}

export function getAnnScore(announcement: Announcement) {
    switch (announcement.type) {
        case AnnouncementType.Tierce:
        case AnnouncementType.Belot: {
            return 20;
        }
        case AnnouncementType.Quarte: {
            return 50;
        }
        case AnnouncementType.Quinte: {
            return 100;
        }
        case AnnouncementType.Square: {
            if (
                [Rank.Ten, Rank.Queen, Rank.King, Rank.Ace].includes(
                    announcement.rank,
                )
            ) {
                return 100;
            } else if (announcement.rank === Rank.Nine) {
                return 150;
            } else if (announcement.rank === Rank.Jack) {
                return 200;
            }
        }
        default:
            return 0;
    }
}

export function calcAnnScores(config: GameConfig, state: GameState): Scores {
    if (state.round.mode === GameMode.NO_TRUMP)
        return {
            team1: 0,
            team2: 0,
        };

    const team1Anns: Announcement[] = config.teams.team1.reduce<Announcement[]>(
        (acc, player) => {
            if (!player) return acc;
            acc.push(...state.round.announcements[player]);
            return acc;
        },
        [],
    );

    const team2Anns: Announcement[] = config.teams.team2.reduce<Announcement[]>(
        (acc, player) => {
            if (!player) return acc;
            acc.push(...state.round.announcements[player]);
            return acc;
        },
        [],
    );

    let [team1Seqs, team1Other] = splitAnns(team1Anns);
    let [team2Seqs, team2Other] = splitAnns(team2Anns);

    const team1Highest = highestSequence(team1Seqs);
    const team2Highest = highestSequence(team2Seqs);

    const higher = compareSequences(team1Highest, team2Highest);
    if (higher > 0) {
        team2Seqs = [];
    } else if (higher < 0) {
        team1Seqs = [];
    } else {
        team1Seqs = [];
        team2Seqs = [];
    }

    const team1Square = highestSquare(team1Other);
    const team2Square = highestSquare(team2Other);

    if (
        team1Square &&
        team1Square.type === AnnouncementType.Square &&
        team2Square &&
        team2Square.type === AnnouncementType.Square
    ) {
        if (
            ALL_TRUMP_SCORE[team1Square.rank] >
            ALL_TRUMP_SCORE[team2Square.rank]
        )
            team2Other = removeSquares(team2Other);
        else if (
            ALL_TRUMP_SCORE[team2Square.rank] >
            ALL_TRUMP_SCORE[team1Square.rank]
        )
            team1Other = removeSquares(team1Other);
    }

    const team1Scores = [...team1Other, ...team1Seqs].reduce((acc, ann) => {
        acc += getAnnScore(ann);
        return acc;
    }, 0);
    const team2Scores = [...team2Other, ...team2Seqs].reduce((acc, ann) => {
        acc += getAnnScore(ann);
        return acc;
    }, 0);

    return {
        team1: team1Scores,
        team2: team2Scores,
    };
}

function removeSquares(anns: Announcement[]): Announcement[] {
    return anns.filter((a) => a.type !== AnnouncementType.Square);
}

function highestSquare(anns: Announcement[]): Announcement {
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

function highestSequence(anns: Announcement[]): Announcement {
    return anns.reduce((acc, a) => {
        return compareSequences(acc, a) > 0 ? acc : a;
    });
}

function splitAnns(all: Announcement[]): [Announcement[], Announcement[]] {
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
    const sorted = sortHandsDesc(config, state);

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

export function sortHandsDesc(
    config: GameConfig,
    state: GameState,
): Record<PlayerId, Card[]> {
    const hands = state.round.hands;
    for (const p of config.players) {
        hands[p].sort((a, b) => compareCardsFull(b, a));
    }
    return hands;
}

export function sortHandsAsc(
    config: GameConfig,
    state: GameState,
): Record<PlayerId, Card[]> {
    const hands = state.round.hands;
    for (const p of config.players) {
        hands[p].sort((a, b) => compareCardsFull(a, b));
    }
    return hands;
}

export function getCardsOfSuit(cards: Card[], suit: Suit): Card[] {
    return cards.filter((c) => c.suit === suit);
}

export function getGameWinner(scores: Scores): TeamId | undefined {
    const team1Reached = scores.team1 >= TARGET_SCORE;
    const team2Reached = scores.team2 >= TARGET_SCORE;

    if (!team1Reached && !team2Reached) 
        return undefined;

    if (scores.team1 > scores.team2)
        return "team1";

    if (scores.team2 > scores.team1)
        return "team2";

    return undefined;
}