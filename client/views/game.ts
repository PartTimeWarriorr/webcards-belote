import Konva from "konva";
import { Board } from "../src/board-new";
import {
    Announcement,
    AnnouncementType,
    Bid,
    Card,
    GameConfig,
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
    socket,
    startGame,
    updateGame,
    welcome,
} from "@/socket";
import { getCardId } from "@/utils";

let playerGameView: PlayerView | null = null;
let localConfig: GameConfig | null = null;
// let clientId: PlayerId | null = null;
let clientId: PlayerId | undefined = undefined;

socket.on("connect", () => {
    clientId = socket.id;
});

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

export async function renderGame() {
    // !SCALE FOR DEMO
    // const GAME_WIDTH = 1920;
    // const GAME_HEIGHT = 1080;

    // const scaleX = window.innerWidth / GAME_WIDTH;
    // const scaleY = window.innerHeight / GAME_HEIGHT;

    // const scale = Math.min(scaleX / 2, scaleY / 2);
    // stage.scale({ x: scale, y: scale });

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

    const scoreboard = document.getElementById("scoreBoard");
    const winScreen = document.getElementById("winScreen");
    const announceTab = document.getElementById("announceTab");
    const passButton = document.getElementById("passBtn");
    const debugBoard = document.getElementById("debugBoard");
    const biddingMenu = document.getElementById("biddingMenu");
    const modeButtons = document.querySelectorAll(".mode-btn");
    modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const name = btn.getAttribute("name");
            if (!name || !clientId || !playerGameView) return;
            gameMove({
                type: "BID",
                player: clientId,
                bid: getSelectedBid(name, playerGameView),
            });
        });
    });
    passButton?.addEventListener("click", () => {
        if (!clientId) return;
        gameMove({
            type: "PASS",
            player: clientId,
        });
    });

    const errorTab = document.getElementById("errors");

    const stage = new Konva.Stage({
        container: "container",
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const layer = new Konva.Layer();
    const dragLayer = new Konva.Layer();

    let board = await Board.init(layer, dragLayer, stage);

    startGame((payload: { config: GameConfig; view: PlayerView }) => {
        localConfig = payload.config;
        playerGameView = payload.view;
        if (!clientId) {
            console.error("Missing player id");
            return;
        }
        const rotated = rotateSeats(payload.config.players, clientId);
        localConfig.players = rotated;
        board.render(localConfig.players, playerGameView);

        if (playerGameView.phase === GamePhase.Bidding) {
            if (!biddingMenu) {
                console.error("Missing menu");
                return;
            }
            biddingMenu.style.display =
                playerGameView.currentBidder === clientId ? "grid" : "none";
        } else {
            if (!biddingMenu) {
                console.error("Missing menu");
                return;
            }
            biddingMenu.style.display = "none";
        }

        if (!debugBoard) return;
        debugBoard.textContent = parseDebugInfo(
            clientId,
            localConfig,
            playerGameView,
        );
    });

    // !!!switch here???
    updateGame((payload: PlayerView) => {
        playerGameView = payload;
        if (!clientId) {
            console.error("Missing player id");
            return;
        }
        if (!localConfig) {
            console.error("Missing config");
            return;
        }
        board.render(localConfig?.players, playerGameView);

        if (biddingMenu) {
            biddingMenu.style.display =
                playerGameView.phase === GamePhase.Bidding &&
                playerGameView.currentBidder === clientId
                    ? "grid"
                    : "none";
        } else {
            console.error("Missing bidding menu");
        }

        if (scoreboard) {
            scoreboard.style.display =
                playerGameView.phase === GamePhase.Scoring ? "block" : "none";
        } else {
            console.error("Missing scoreboard");
        }

        if (winScreen) {
            winScreen.style.display = playerGameView.phase === GamePhase.Finished ? "block" : "none";
        } else {
            console.error("Missing win screen");
        }

        if (playerGameView.phase === GamePhase.Scoring) {
            renderScoreboard(playerGameView);
        } else if (playerGameView.phase === GamePhase.Finished) {
            renderWinscreen(playerGameView);
        }

        if (announceTab) {
            announceTab.textContent = parseAnnounceTab(clientId, localConfig, playerGameView);
        } else {
            console.error("Missing announcements tab");
        }

        if (debugBoard) {
            debugBoard.textContent = parseDebugInfo(
                clientId,
                localConfig,
                playerGameView,
            );
        } else {
            console.error("Missing debug board");
        }
    });

    roomReadied((readyPlayers: PlayerId[]) => {
        if (!clientId || !localConfig || !playerGameView) return;
        if (debugBoard) {
            debugBoard.textContent = parseDebugInfo(
                clientId,
                localConfig,
                playerGameView,
                readyPlayers.length,
            );
        } else {
            console.error("Missing debug board");
        }
    });

    clientError((err: string) => {
        if (!errorTab) {
            console.log(err);
            return;
        }
        errorTab.textContent = err;
    });

    roomJoin("Test");
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
    config: GameConfig,
    view: PlayerView,
    readyPlayers: number = 0,
): string {
    return `
        clientId: ${id} \n
        ${JSON.stringify(view)} \n
        readied: ${readyPlayers}/4
    `;
}

function parseAnnounceTab(clientId: PlayerId, config: GameConfig, gameView: PlayerView) {
    const team1 = config.teams.team1; 
    const team2 = config.teams.team2;
    const ownTeam = team1.includes(clientId) ? "team1" : (team2.includes(clientId) ? "team2" : ""); 

    return `
        Team 1: \n
        ${team1[0]}: ${gameView.round.announcements[team1[0]!].map(a => parseAnnouncement(a, "team1" === ownTeam)).join(', ')} \n
        ${team1[1]}: ${gameView.round.announcements[team1[1]!].map(a => parseAnnouncement(a, "team1" === ownTeam)).join(', ')} \n

        Team 2: \n
        ${team2[0]}: ${gameView.round.announcements[team2[0]!].map(a => parseAnnouncement(a, "team2" === ownTeam)).join(', ')} \n
        ${team2[1]}: ${gameView.round.announcements[team2[1]!].map(a => parseAnnouncement(a, "team2" === ownTeam)).join(', ')} \n
    `;
}

function parseAnnouncement(announcement: Announcement, ownTeam: boolean) {
    switch(announcement.type) {
        case AnnouncementType.Square: {
            return ownTeam ? `Square ${announcement.rank}` : "Square"
        } 
        case AnnouncementType.Tierce:
        case AnnouncementType.Quarte:
        case AnnouncementType.Quinte: {
            return ownTeam ? `${announcement.type} ${announcement.suit} up to ${announcement.highestCard}` : `${announcement.type}`;
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
        winScreen.querySelector("#readyButton")!;

    readyButton.addEventListener("click", () => {
        const isReady = readyButton.checked;
        roomReady(isReady);
    });
}


