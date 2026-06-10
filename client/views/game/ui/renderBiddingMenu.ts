import { emitGameMove } from "@/socket";
import { GamePhase, PlayerId, PlayerView } from "@shared/types";
import { parseBid } from "../utils/parseBid";

export function renderBiddingMenu(
    biddingMenu: HTMLElement,
    gameView: PlayerView,
    clientId: PlayerId,
) {
    biddingMenu.style.display = shouldRender(gameView, clientId) ? "grid" : "none";

    if (!shouldRender(gameView, clientId)) return;

    biddingMenu.innerHTML = `
                            <div class="mode-btn btn-club" name="C"></div>
                            <div class="mode-btn btn-diamond" name="D"></div>
                            <div class="mode-btn btn-heart" name="H"></div>
                            <div class="mode-btn btn-spade" name="S"></div>
                            <div class="mode-btn" name="NT">NT</div>
                            <div class="mode-btn" name="AT">AT</div>
                            <div class="mode-btn" name="x2">x2</div>
                            <div class="mode-btn" name="x4">x4</div>
                            <div id="passBtn" class="pass-btn">PASS</div>
    `;

    const modeButtons = document.querySelectorAll(".mode-btn")!;
    const passButton = document.getElementById("passBtn")!;

    modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const name = btn.getAttribute("name");
            if (!name || !clientId || !gameView) return;
            emitGameMove({
                type: "BID",
                player: clientId,
                bid: parseBid(name, gameView),
            });
        });
    });

    passButton.addEventListener("click", () => {
        if (!clientId) return;
        emitGameMove({
            type: "PASS",
            player: clientId,
        });
    });
}

function shouldRender(gameView: PlayerView, clientId: PlayerId) {
    return gameView.phase === GamePhase.Bidding && gameView.currentBidder === clientId;
}
