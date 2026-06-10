import { Announcement, AnnouncementType, GameInitPayload, PlayerId, PlayerView } from "@shared/types";

export function formatDebugInfo(
    id: string,
    gameInit: GameInitPayload,
    view: PlayerView,
    readyPlayers: number = 0,
): string {
    return `
    clientId: ${id} \n
    ${JSON.stringify(view)} \n
    readied: ${readyPlayers}/4
`;
}

export function formatAnnounceTab(
    clientId: PlayerId,
    gameInit: GameInitPayload,
    gameView: PlayerView,
) {
    const team1 = gameInit.teams.team1;
    const team2 = gameInit.teams.team2;
    const ownTeam = team1.includes(clientId)
        ? "team1"
        : team2.includes(clientId)
            ? "team2"
            : "";

    return `
    Team 1: \n
    ${team1.map((p) => {
        if (!p) return;
        p in gameView.round.announcements
            ? `${p}: ${gameView.round.announcements[p].map((a) => formatAnnouncement(a, "team1" === ownTeam)).join(", ")}`
            : "";
    })} \n
    Team 2: \n
    ${team2.map((p) => {
        if (!p) return;
        p in gameView.round.announcements
            ? `${p}: ${gameView.round.announcements[p].map((a) => formatAnnouncement(a, "team2" === ownTeam)).join(", ")}`
            : "";
    })}
`;
}

function formatAnnouncement(announcement: Announcement, ownTeam: boolean) {
    switch (announcement.type) {
        case AnnouncementType.Square: {
            return ownTeam ? `Square ${announcement.rank}` : "Square";
        }
        case AnnouncementType.Tierce:
        case AnnouncementType.Quarte:
        case AnnouncementType.Quinte: {
            return ownTeam
                ? `${announcement.type} ${announcement.suit} up to ${announcement.highestCard}`
                : `${announcement.type}`;
        }
        case AnnouncementType.Belot: {
            return `${announcement.type} ${announcement.suit}`;
        }
    }
}
