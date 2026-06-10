import { PlayerView, GamePhase } from "@shared/types";
import { emitRoomReady } from "@/socket";

export function renderScoreboard(scoreboard: HTMLElement, gameView: PlayerView) {

    scoreboard.style.display =
        shouldRender(gameView) ? "block" : "none";

    if (!shouldRender(gameView)) return;

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
        emitRoomReady(isReady);
    });
}

function shouldRender(gameView: PlayerView) {
    return gameView.phase === GamePhase.Scoring; 
}