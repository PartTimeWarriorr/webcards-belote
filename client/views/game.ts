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
    gameAdvance,
    gameInit,
    gameMove,
    gameSync,
    roomJoin,
    roomReadied,
    roomReady,
    socket,
    startGame,
    updateGame,
    welcome,
} from "@/socket";
import { getCardId } from "@/utils";
import { userId } from "./home";
import { View } from "./view";

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

export class GameView extends View<GameViewElements, GameViewState> {
    async render() {
        console.log("Rendering game...");
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

        this.elements = {
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

        this.viewState = {
            playerGameView: null,
            localConfig: null,
            clientId: userId,
        };

        console.log("Gameview built");
    }

    appendProfiles() {
        const app = document.getElementById("app")!;
        this.viewState.localConfig?.orderedPlayers.forEach((seat, i) => {
            const profile = this.viewState.localConfig!.playerProfiles[seat];
            const {team1, team2} = this.viewState.localConfig!.teams;
            const team = team1.includes(seat) ? "team1" : "team2";
            const profileTab = document.createElement("div");
            profileTab.classList.add("profile", `profile-${i}`);
            profileTab.innerHTML = `
                <p class="profile-name">${profile?.username}</p>
                <p class="profile-team">${team}</p>
                <div class="profile-icon-holder">
                    <div class="profile-icon profile-icon-left" style="display:${profile?.isBot ? "block" : "none"}"></div>
                    <div class="profile-icon profile-icon-right"style="display:${profile?.connected ? "none" : "block"}"></div>
                </div>
            `;
            app.appendChild(profileTab);
        });
    }

    attachDomListeners(): void {
        this.elements.modeButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const name = btn.getAttribute("name");
                if (
                    !name ||
                    !this.viewState.clientId ||
                    !this.viewState.playerGameView
                )
                    return;
                gameMove({
                    type: "BID",
                    player: this.viewState.clientId,
                    bid: this.getSelectedBid(
                        name,
                        this.viewState.playerGameView,
                    ),
                });
            });
        });
        this.elements.passButton.addEventListener("click", () => {
            if (!this.viewState.clientId) return;
            gameMove({
                type: "PASS",
                player: this.viewState.clientId,
            });
        });
    }

    attachSocketListeners(): void {
        startGame(
            (payload: { gameInit: GameInitPayload; view: PlayerView }) => {
                this.viewState.localConfig = payload.gameInit;
                this.viewState.playerGameView = payload.view;
                console.log(this.viewState.localConfig);
                if (!this.viewState.clientId) {
                    console.error("Missing player id");
                    return;
                }
                const rotated = this.rotateSeats(
                    payload.gameInit.orderedPlayers,
                    this.viewState.clientId,
                );
                this.viewState.localConfig.orderedPlayers = rotated;
                this.elements.board.render(
                    this.viewState.localConfig.orderedPlayers,
                    this.viewState.playerGameView,
                );

                if (this.viewState.playerGameView.phase === GamePhase.Bidding) {
                    if (!this.elements.biddingMenu) {
                        console.error("Missing menu");
                        return;
                    }
                    this.elements.biddingMenu.style.display =
                        this.viewState.playerGameView.currentBidder ===
                        this.viewState.clientId
                            ? "grid"
                            : "none";
                } else {
                    if (!this.elements.biddingMenu) {
                        console.error("Missing menu");
                        return;
                    }
                    this.elements.biddingMenu.style.display = "none";
                }

                this.appendProfiles();

                if (!this.elements.debugBoard) return;
                this.elements.debugBoard.textContent = this.parseDebugInfo(
                    this.viewState.clientId,
                    this.viewState.localConfig,
                    this.viewState.playerGameView,
                );
            },
        );

        updateGame((payload: PlayerView) => {
            console.log(payload);
            this.viewState.playerGameView = payload;
            if (!this.viewState.clientId) {
                console.error("Missing player id");
                return;
            }
            console.log(this.viewState.localConfig);
            if (!this.viewState.localConfig) {
                console.error("Missing config");
                return;
            }
            this.elements.board.render(
                this.viewState.localConfig.orderedPlayers,
                this.viewState.playerGameView,
            );

            if (this.elements.biddingMenu) {
                this.elements.biddingMenu.style.display =
                    this.viewState.playerGameView.phase === GamePhase.Bidding &&
                    this.viewState.playerGameView.currentBidder ===
                        this.viewState.clientId
                        ? "grid"
                        : "none";
            } else {
                console.error("Missing bidding menu");
            }

            if (this.elements.scoreboard) {
                this.elements.scoreboard.style.display =
                    this.viewState.playerGameView.phase === GamePhase.Scoring
                        ? "block"
                        : "none";
            } else {
                console.error("Missing scoreboard");
            }

            if (this.elements.winScreen) {
                this.elements.winScreen.style.display =
                    this.viewState.playerGameView.phase === GamePhase.Finished
                        ? "block"
                        : "none";
            } else {
                console.error("Missing win screen");
            }

            if (this.viewState.playerGameView.phase === GamePhase.Scoring) {
                this.renderScoreboard(this.viewState.playerGameView);
            } else if (
                this.viewState.playerGameView.phase === GamePhase.Finished
            ) {
                this.renderWinscreen(this.viewState.playerGameView);
            }

            if (this.elements.announceTab) {
                this.elements.announceTab.textContent = this.parseAnnounceTab(
                    this.viewState.clientId,
                    this.viewState.localConfig,
                    this.viewState.playerGameView,
                );
            } else {
                console.error("Missing announcements tab");
            }

            if (this.elements.debugBoard) {
                this.elements.debugBoard.textContent = this.parseDebugInfo(
                    this.viewState.clientId,
                    this.viewState.localConfig,
                    this.viewState.playerGameView,
                );
            } else {
                console.error("Missing debug board");
            }
        });

        roomReadied((readyPlayers: PlayerId[]) => {
            if (
                !this.viewState.clientId ||
                !this.viewState.localConfig ||
                !this.viewState.playerGameView
            )
                return;
            if (this.elements.debugBoard) {
                this.elements.debugBoard.textContent = this.parseDebugInfo(
                    this.viewState.clientId,
                    this.viewState.localConfig,
                    this.viewState.playerGameView,
                    readyPlayers.length,
                );
            } else {
                console.error("Missing debug board");
            }
            if (readyPlayers.length === 4) {
                // gameSync();
                gameAdvance();
            }
        });

        clientError((err: string) => {
            if (!this.elements.errorTab) {
                console.log(err);
                return;
            }
            this.elements.errorTab.textContent = err;
        });

        // gameSync();
        gameInit();
    }

    detachDomListeners(): void {}

    detachSocketListeners(): void {
        socket.off("game:init");
        socket.off("game:state");
        socket.off("room:readied");
        socket.off("client:error");
    }

    private rotateSeats(seats: Seats, playerId: string): Seats {
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

    private parseDebugInfo(
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

    private parseAnnounceTab(
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
                ? `${p}: ${gameView.round.announcements[p].map((a) => this.parseAnnouncement(a, "team1" === ownTeam)).join(", ")}`
                : "";
        })} \n
        Team 2: \n
        ${team2.map((p) => {
            if (!p) return;
            p in gameView.round.announcements
                ? `${p}: ${gameView.round.announcements[p].map((a) => this.parseAnnouncement(a, "team2" === ownTeam)).join(", ")}`
                : "";
        })}
    `;
    }

    private parseAnnouncement(announcement: Announcement, ownTeam: boolean) {
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

    private renderScoreboard(gameView: PlayerView) {
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
    private renderWinscreen(gameView: PlayerView) {
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

    private getSelectedBid(bid: string, gameView: PlayerView): Bid {
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
}
