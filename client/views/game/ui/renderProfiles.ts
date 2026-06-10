import { GameInitPayload, PlayerId } from "@shared/types";

export function renderProfiles(profiles: HTMLElement, localConfig: GameInitPayload) {

    localConfig.orderedPlayers.forEach((seat, i) => {
        const { team1, team2 } = localConfig.teams;
        const team = team1.includes(seat) ? "team1" : "team2";

        const profile = localConfig.playerProfiles[seat];
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

        profiles.appendChild(profileTab);
    });
}

export function markPlayerConnection(
    playerId: PlayerId,
    isConnected: boolean,
    localConfig?: GameInitPayload,
) {
    const profiles = document.getElementById("profiles")!;
    const seat = localConfig?.orderedPlayers.indexOf(playerId);
    if (!seat) return;

    const profile = profiles.querySelector(`.profile-${seat}`)!;
    const icon = profile.querySelector(".profile-icon-right") as HTMLElement;
    icon.style.display = isConnected ? "none" : "block";
}
