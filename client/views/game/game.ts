import Konva from "konva";
import { Board } from "./ui/board/board";
import { GameInitPayload, PlayerId, PlayerView, RoomJoinedPayload } from "@shared/types";
import {
    emitGameMove,
    onGameError,
    onGameInit,
    onGameState,
    onRoomJoined,
    onRoomLeft,
    onRoomReadied,
    requestGameAdvance,
    requestGameInit,
    socket,
} from "@/socket";
import { View } from "../view";
import { formatAnnounceTab, formatDebugInfo } from "./utils/format";
import { parseBid } from "./utils/parseBid";
import { renderScoreboard } from "./ui/renderScoreboard";
import { renderWinscreen } from "./ui/renderWinScreen";
import { rotateSeats } from "./utils/rotateSeats";
import { markPlayerConnection, renderProfiles } from "./ui/renderProfiles";
import { renderBiddingMenu } from "./ui/renderBiddingMenu";
import { userId } from "../home";

interface GameViewElements {
    scoreboard: HTMLElement;
    winScreen: HTMLElement;
    announceTab: HTMLElement;
    debugBoard: HTMLElement;
    biddingMenu: HTMLElement;
    profiles: HTMLElement;
    errorTab: HTMLElement;
    board: Board;
}

interface GameViewState {
    playerGameView?: PlayerView;
    localConfig?: GameInitPayload;
    clientId?: PlayerId;
}

export class GameView extends View<GameViewElements, GameViewState> {
    async setupPage() {
        const app = document.getElementById("app")!;

        app.innerHTML = `
                        <div id="biddingMenu" class="gamemode-modal"></div>
                        <div id="profiles"></div>
                        <div id="scoreBoard" class="scoreboard-modal"></div>
                        <div id="winScreen" class="scoreboard-modal"></div>
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

        this.viewState = {
            playerGameView: undefined,
            localConfig: undefined,
            clientId: userId,
        }

        this.elements = {
            board: await Board.init(layer, dragLayer, stage),
            announceTab: document.getElementById("announceTab")!,
            debugBoard: document.getElementById("debugBoard")!,
            profiles: document.getElementById("profiles")!,
            biddingMenu: document.getElementById("biddingMenu")!,
            scoreboard: document.getElementById("scoreBoard")!,
            winScreen: document.getElementById("winScreen")!,
            errorTab: document.getElementById("errors")!,
        };
    }

    attachDomListeners(): void {}

    attachSocketListeners(): void {
        onGameInit((payload: { gameInit: GameInitPayload; view: PlayerView }) => {
            this.viewState.localConfig = payload.gameInit;
            this.viewState.playerGameView = payload.view;
            if (!this.viewState.clientId) return;

            this.viewState.localConfig.orderedPlayers = rotateSeats(
                payload.gameInit.orderedPlayers,
                this.viewState.clientId,
            );

            this.elements.board.render(
                this.viewState.localConfig.orderedPlayers,
                this.viewState.playerGameView,
            );

            renderBiddingMenu(this.elements.biddingMenu, payload.view, this.viewState.clientId);
            renderProfiles(this.elements.profiles, this.viewState.localConfig);

            this.elements.debugBoard.textContent = formatDebugInfo(
                this.viewState.clientId,
                this.viewState.localConfig,
                this.viewState.playerGameView,
            );

            console.log("Game has been init");
        });

        onGameState((payload: PlayerView) => {
            console.log("State received...");
            this.viewState.playerGameView = payload;
            if (!this.viewState.clientId || !this.viewState.localConfig) return;

            this.elements.board.render(
                this.viewState.localConfig.orderedPlayers,
                this.viewState.playerGameView,
            );

            renderBiddingMenu(this.elements.biddingMenu, payload, this.viewState.clientId);
            renderScoreboard(this.elements.scoreboard, payload);
            renderWinscreen(this.elements.winScreen, payload);

            this.elements.announceTab.textContent = formatAnnounceTab(
                this.viewState.clientId,
                this.viewState.localConfig,
                this.viewState.playerGameView,
            );

            this.elements.debugBoard.textContent = formatDebugInfo(
                this.viewState.clientId,
                this.viewState.localConfig,
                this.viewState.playerGameView,
            );

            console.log("State has been resolved");
        });

        onRoomReadied((readyPlayers: PlayerId[]) => {
            if (
                !this.viewState.clientId ||
                !this.viewState.localConfig ||
                !this.viewState.playerGameView
            )
                return;
            this.elements.debugBoard.textContent = formatDebugInfo(
                this.viewState.clientId,
                this.viewState.localConfig,
                this.viewState.playerGameView,
                readyPlayers.length,
            );
            if (readyPlayers.length === 4) {
                // gameSync();
                requestGameAdvance();
            }
        });

        onGameError((err: string) => {
            this.elements.errorTab.textContent = err;
        });

        onRoomLeft((payload: RoomJoinedPayload) => {
            markPlayerConnection(payload.player, false, this.viewState.localConfig);
        });

        onRoomJoined((payload: RoomJoinedPayload) => {
            markPlayerConnection(payload.player, true, this.viewState.localConfig);
        });

        // gameSync();
        requestGameInit();
    }

    detachDomListeners(): void {}

    detachSocketListeners(): void {
        socket.off("game:init");
        socket.off("game:state");
        socket.off("room:readied");
        socket.off("game:error");
        socket.off("room:left");
        socket.off("room:joined");
    }
}
