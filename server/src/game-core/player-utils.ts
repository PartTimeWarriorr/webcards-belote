import { PlayingState, GameConfig, BiddingState, PlayerId, TeamId } from "@shared/types";

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

export function getTeamId(config: GameConfig, player: PlayerId): TeamId {
    const { team1, team2 } = config.teams;

    if (team1.includes(player)) return "team1";
    if (team2.includes(player)) return "team2";

    throw new Error("Player not found in any team");
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