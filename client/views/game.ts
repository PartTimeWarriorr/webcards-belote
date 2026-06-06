import Konva from "konva";
import { Board } from "../src/board-new";
import {
    Announcement,
    AnnouncementType,
    Bid,
    Card,
    GameConfig,
    GameInitPayload,
    GameMode,
    GamePhase,
    Modifier,
    Move,
    PlayerId,
    PlayerView,
    Scores,
    Seats,
    Suit,
} from "@shared/types";
import {
    clientError,
    gameMove,
    roomJoin,
    roomReadied,
    roomReady,
    startGame,
    updateGame,
    welcome,
} from "@/socket";
import { getCardId } from "@/utils";
import { userId } from "./room";

interface GameViewElements {
    scoreboard: HTMLElement;
    winScreen: HTMLElement;
    announceTab: HTMLElement;
    passButton: HTMLElement;
    debugBoard: HTMLElement;
    biddingMenu: HTMLElement;
    modeButtons: NodeListOf<Element>;
    errorTab: HTMLElement;
    board: Board;
}

interface GameViewState {
    playerGameView: PlayerView | null;
    localConfig: GameInitPayload | null;
    clientId: PlayerId | undefined;
}

export async function renderGame() {

    const app = document.getElementById("app")!;
    app.innerHTML = `
        <div id="biddingMenu" class="gamemode-modal">
            <div class="mode-btn btn-club" name="C"></div>
            <div class="mode-btn btn-diamond" name="D"></div>
            <div class="mode-btn btn-heart" name="H"></div>
            <div class="mode-btn btn-spade" name="S"></div>
            <div class="mode-btn" name="NT">NT</div>
            <div class="mode-btn" name="AT">AT</div>
            <div class="mode-btn" name="x2">x2</div>
            <div class="mode-btn" name="x4">x4</div>
            <div id="passBtn" class="pass-btn">PASS</div>
        </div>
        <div id="scoreBoard" class="scoreboard-modal">
        </div>
        <div id="winScreen" class="scoreboard-modal">
        </div>
        <div id="announceTab" class="announcements-tab"></div>
        <div id="errors" style="color:red">Errors here</div>
        <div id="debugBoard" class="debug-board"></div>
    <div id="container"></div>
        `;

    const stage = new Konva.Stage({
        container: "container",
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const layer = new Konva.Layer();
    const dragLayer = new Konva.Layer();

    const elements: GameViewElements = {
        scoreboard: document.getElementById("scoreBoard")!,
        winScreen: document.getElementById("winScreen")!,
        announceTab: document.getElementById("announceTab")!,
        passButton: document.getElementById("passBtn")!,
        debugBoard: document.getElementById("debugBoard")!,
        biddingMenu: document.getElementById("biddingMenu")!,
        modeButtons: document.querySelectorAll(".mode-btn")!,
        errorTab: document.getElementById("errors")!,
        board: await Board.init(layer, dragLayer, stage),
    };

    const viewState: GameViewState = {
        playerGameView: null,
        localConfig: null,
        clientId: userId,
    }

    attachDomListeners(elements, viewState);
    attachSocketListeners(elements, viewState);
}

function attachDomListeners(elements: GameViewElements, viewState: GameViewState) {
    elements.modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const name = btn.getAttribute("name");
            if (!name || !viewState.clientId || !viewState.playerGameView) return;
            gameMove({
                type: "BID",
                player: viewState.clientId,
                bid: getSelectedBid(name, viewState.playerGameView),
            });
        });
    });
    elements.passButton.addEventListener("click", () => {
        if (!viewState.clientId) return;
        gameMove({
            type: "PASS",
            player: viewState.clientId,
        });
    });
}

function attachSocketListeners(elements: GameViewElements, viewState: GameViewState) {
    startGame((payload: { gameInit: GameInitPayload; view: PlayerView }) => {
        viewState.localConfig = payload.gameInit;
        viewState.playerGameView = payload.view;
        if (!viewState.clientId) {
            console.error("Missing player id");
            return;
        }
        const rotated = rotateSeats(payload.gameInit.orderedPlayers, viewState.clientId);
        viewState.localConfig.orderedPlayers = rotated;
        elements.board.render(viewState.localConfig.orderedPlayers, viewState.playerGameView);

        if (viewState.playerGameView.phase === GamePhase.Bidding) {
            if (!elements.biddingMenu) {
                console.error("Missing menu");
                return;
            }
            elements.biddingMenu.style.display =
                viewState.playerGameView.currentBidder === viewState.clientId ? "grid" : "none";
        } else {
            if (!elements.biddingMenu) {
                console.error("Missing menu");
                return;
            }
            elements.biddingMenu.style.display = "none";
        }

        if (!elements.debugBoard) return;
        elements.debugBoard.textContent = parseDebugInfo(
            viewState.clientId,
            viewState.localConfig,
            viewState.playerGameView,
        );
    });

    updateGame((payload: PlayerView) => {
        viewState.playerGameView = payload;
        if (!viewState.clientId) {
            console.error("Missing player id");
            return;
        }
        if (!viewState.localConfig) {
            console.error("Missing config");
            return;
        }
        elements.board.render(viewState.localConfig.orderedPlayers, viewState.playerGameView);

        if (elements.biddingMenu) {
            elements.biddingMenu.style.display =
                viewState.playerGameView.phase === GamePhase.Bidding &&
                viewState.playerGameView.currentBidder === viewState.clientId
                    ? "grid"
                    : "none";
        } else {
            console.error("Missing bidding menu");
        }

        if (elements.scoreboard) {
            elements.scoreboard.style.display =
                viewState.playerGameView.phase === GamePhase.Scoring ? "block" : "none";
        } else {
            console.error("Missing scoreboard");
        }

        if (elements.winScreen) {
            elements.winScreen.style.display =
                viewState.playerGameView.phase === GamePhase.Finished ? "block" : "none";
        } else {
            console.error("Missing win screen");
        }

        if (viewState.playerGameView.phase === GamePhase.Scoring) {
            renderScoreboard(viewState.playerGameView);
        } else if (viewState.playerGameView.phase === GamePhase.Finished) {
            renderWinscreen(viewState.playerGameView);
        }

        if (elements.announceTab) {
            elements.announceTab.textContent = parseAnnounceTab(
                viewState.clientId,
                viewState.localConfig,
                viewState.playerGameView,
            );
        } else {
            console.error("Missing announcements tab");
        }

        if (elements.debugBoard) {
            elements.debugBoard.textContent = parseDebugInfo(
                viewState.clientId,
                viewState.localConfig,
                viewState.playerGameView,
            );
        } else {
            console.error("Missing debug board");
        }
    });

    roomReadied((readyPlayers: PlayerId[]) => {
        if (!viewState.clientId || !viewState.localConfig || !viewState.playerGameView) return;
        if (elements.debugBoard) {
            elements.debugBoard.textContent = parseDebugInfo(
                viewState.clientId,
                viewState.localConfig,
                viewState.playerGameView,
                readyPlayers.length,
            );
        } else {
            console.error("Missing debug board");
        }
    });

    clientError((err: string) => {
        if (!elements.errorTab) {
            console.log(err);
            return;
        }
        elements.errorTab.textContent = err;
    });
}

function rotateSeats(seats: Seats, playerId: string): Seats {
    // Rotate the player positions so player is at south
    const playerIndex = seats.findIndex((id) => id === playerId);
    const rotated = [
        ...seats.slice(playerIndex),
        ...seats.slice(0, playerIndex),
    ];
    if (rotated.length !== 4) {
        throw new Error("Invalid seats");
    }

    return rotated as Seats;
}

function getAllyId(teams: Record<string, string>, playerId: string): string {
    const team = teams[playerId];
    const allyId = Object.keys(teams).find(
        (id) => teams[id] === team && id !== playerId,
    );
    if (!allyId) throw new Error("No ally found");
    return allyId;
}

function parseDebugInfo(
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

function parseAnnounceTab(
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
        ${team1[0]}: ${gameView.round.announcements[team1[0]!].map((a) => parseAnnouncement(a, "team1" === ownTeam)).join(", ")} \n
        ${team1[1]}: ${gameView.round.announcements[team1[1]!].map((a) => parseAnnouncement(a, "team1" === ownTeam)).join(", ")} \n

        Team 2: \n
        ${team2[0]}: ${gameView.round.announcements[team2[0]!].map((a) => parseAnnouncement(a, "team2" === ownTeam)).join(", ")} \n
        ${team2[1]}: ${gameView.round.announcements[team2[1]!].map((a) => parseAnnouncement(a, "team2" === ownTeam)).join(", ")} \n
    `;
}

function parseAnnouncement(announcement: Announcement, ownTeam: boolean) {
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

function renderScoreboard(gameView: PlayerView) {
    const scoreboard = document.getElementById("scoreBoard")!;

    if (gameView.phase !== GamePhase.Scoring) return;
    scoreboard.innerHTML = `
                <p class="scoreboard-title">Total scores</p>
                <div class="scores-grid">
                    <div class="scores-column">
                        <div class="scoreboard-subtitle">Team 1</div>
                        <div>${gameView.totalScores.team1}</div>
                    </div>
                    <div class="scores-column">
                        <div class="scoreboard-subtitle">Team 2</div>
                        <div>${gameView.totalScores.team2}</div>
                    </div>
                </div>

                <p class="scoreboard-title">
                Round scores
                </p>
                <p class="scoreboard-title">${gameView.condition}</p>
                <p class="scoreboard-subtitle">Team1</p>
                <p class="scoreboard-text">
                    From cards: ${gameView.round.roundScores.team1}<br />
                    From announcements:
                    ${gameView.round.announcementScores.team2}
                </p>
                <p class="scoreboard-subtitle">Team2</p>
                <p class="scoreboard-text">
                    From cards: ${gameView.round.roundScores.team2}<br />
                    From announcements:
                    ${gameView.round.announcementScores.team2}
                </p>
                <input
                    type="checkbox"
                    name="readyButton"
                    id="readyButton"
                    class="hidden"
                />
                <label for="readyButton" class="scoreboard-button btn-main"
                    >Ready</label
                >
    `;

    const readyButton: HTMLInputElement =
        scoreboard.querySelector("#readyButton")!;

    readyButton.addEventListener("click", () => {
        const isReady = readyButton.checked;
        roomReady(isReady);
    });
}

function renderWinscreen(gameView: PlayerView) {
    const winScreen = document.getElementById("winScreen")!;

    if (gameView.phase !== GamePhase.Finished) return;

    winScreen.innerHTML = `
                <p class="scoreboard-title">${gameView.winningTeam} wins!</p>
                <div class="scores-grid">
                    <div class="scores-column">
                        <div class="scoreboard-subtitle">Team 1</div>
                        <div>${gameView.totalScores.team1}</div>
                    </div>
                    <div class="scores-column">
                        <div class="scoreboard-subtitle">Team 2</div>
                        <div>${gameView.totalScores.team2}</div>
                    </div>
                </div>

                <p class="scoreboard-title">
                Round scores
                </p>
                <p class="scoreboard-title">${gameView.condition}</p>
                <p class="scoreboard-subtitle">Team1</p>
                <p class="scoreboard-text">
                    From cards: ${gameView.round.roundScores.team1}<br />
                    From announcements:
                    ${gameView.round.announcementScores.team1}
                </p>
                <p class="scoreboard-subtitle">Team2</p>
                <p class="scoreboard-text">
                    From cards: ${gameView.round.roundScores.team2}<br />
                    From announcements:
                    ${gameView.round.announcementScores.team2}
                </p>
                <input
                    type="checkbox"
                    name="readyButton"
                    id="readyButton"
                    class="hidden"
                />
                <label for="readyButton" class="scoreboard-button btn-main"
                    >Ready</label
                >
    `;

    const readyButton: HTMLInputElement =
        winScreen.querySelector("#readyButton")!;

    readyButton.addEventListener("click", () => {
        const isReady = readyButton.checked;
        roomReady(isReady);
    });
}

function getSelectedBid(bid: string, gameView: PlayerView): Bid {
    switch (bid) {
        case "C":
        case "D":
        case "H":
        case "S": {
            return { mode: GameMode.TRUMP, trump: bid as Suit };
        }
        case "NT": {
            return { mode: GameMode.NO_TRUMP };
        }
        case "AT": {
            return { mode: GameMode.ALL_TRUMP };
        }
        case "x2": {
            if (gameView.phase !== GamePhase.Bidding)
                throw new Error("Not in bidding phase");
            if (!gameView.highestBid) throw new Error("Cannot x2");
            return {
                ...gameView.highestBid?.[1],
                modifier: Modifier.x2,
            } as Bid;
        }
        case "x4": {
            if (gameView.phase !== GamePhase.Bidding)
                throw new Error("Not in bidding phase");
            if (!gameView.highestBid) throw new Error("Cannot x4");
            return {
                ...gameView.highestBid?.[1],
                modifier: Modifier.x4,
            } as Bid;
        }
    }

    return {} as Bid;
}