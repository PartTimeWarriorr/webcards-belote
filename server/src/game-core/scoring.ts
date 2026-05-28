import {
    Announcement,
    AnnouncementType,
    Card,
    GameConfig,
    GameMode,
    GameState,
    PlayerId,
    Rank,
    Scores,
    TeamId,
} from "@shared/types";
import { PlayingState } from "@shared/types";
import {
    ALL_TRUMP_SCORE,
    NO_TRUMP_SCORE,
    TARGET_SCORE,
    VALAT_SCORE,
} from "./constants";
import { compareSequences } from "./compare";
import {
    highestSequence,
    highestSquare,
    removeSquares,
    splitAnns,
} from "./announcements";
import { getTeamId } from "./player-utils";

function calcScore(base: number): number {
    return Math.round(base / 10);
}

export function addRoundScores(
    config: GameConfig,
    state: PlayingState,
): { scores: Scores; hanging: number; condition: string } {
    const newTotal = { ...state.totalScores };
    const roundScores = state.round.roundScores;
    const annScores = state.round.announcementScores;
    const modifier = state.round.modifier;
    const isNoTrump = state.round.mode === GameMode.NO_TRUMP;

    if (!state.round.highestBidder)
        throw new Error("Game has no highest bidder");

    const winnerTeamId = getRoundWinner(roundScores);
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
                condition: "Hanging",
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
            condition: "Contra",
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
            condition: "Hanging",
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
            condition: isValat ? "Valat" : "Outside",
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
            condition: isValat ? "Valat" : "Inside",
        };
    }

    return {
        scores: newTotal,
        hanging: 0,
        condition: "",
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

    if (team1Highest && team2Highest) {
        const higher = compareSequences(team1Highest, team2Highest);
        if (higher > 0) {
            team2Seqs = [];
        } else if (higher < 0) {
            team1Seqs = [];
        } else {
            team1Seqs = [];
            team2Seqs = [];
        }
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

export function getGameWinner(scores: Scores): TeamId | undefined {
    const team1Reached = scores.team1 >= TARGET_SCORE;
    const team2Reached = scores.team2 >= TARGET_SCORE;

    if (!team1Reached && !team2Reached) return undefined;

    if (scores.team1 > scores.team2) return "team1";

    if (scores.team2 > scores.team1) return "team2";

    return undefined;
}

export function getRoundWinner(scores: Scores): TeamId | undefined {
    if (scores.team1 > scores.team2) {
        return "team1";
    } else if (scores.team1 < scores.team2) {
        return "team2";
    } else if (scores.team1 === scores.team2) {
        return undefined;
    }
}
