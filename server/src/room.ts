import { Game } from "./game-core/game";
import {
    FullTeam,
    GameConfig,
    GameInitPayload,
    GamePhase,
    GameState,
    PlayerId,
    PlayerProfile,
    Seats,
    Team,
    TeamId,
} from "@shared/types";

export class Room {
    name: string;
    // players: Set<PlayerId> = new Set();
    players: Map<PlayerId, PlayerProfile> = new Map();
    team1: Team = [null, null];
    team2: Team = [null, null];

    botCount: number = 0;
    isBotRoom: boolean = false;

    game?: Game;

    readyPlayers: Set<PlayerId> = new Set();

    ready(player: PlayerId) {
        if (!this.players.has(player))
            throw new Error("Player is not in this room");
        this.readyPlayers.add(player);
        if (this.isBotRoom) this.readyBots();
    }

    unready(player: PlayerId) {
        if (!this.players.has(player))
            throw new Error("Player is not in this room");
        this.readyPlayers.delete(player);
    }

    readyBots() {
        this.players.forEach(p => {
            if (p.isBot) {
                this.readyPlayers.add(p.userId);
            }
        });
    }

    allReady(): boolean {
        return this.readyPlayers.size === 4;
    }

    resetReady() {
        this.readyPlayers = new Set();
    }

    getGameConfig(): GameConfig {
        return {
            players: this.orderedSeats(),
            teams: {
                team1: this.team1,
                team2: this.team2,
            },
        };
    }

    getGameInitPayload(): GameInitPayload {
        return {
            orderedPlayers: this.orderedSeats(),
            playerProfiles: Array.from(this.players).reduce<Record<string, PlayerProfile>>((acc, [id, profile]) => {
                acc[id] = profile;
                return acc;
            }, {}),
            teams: {
                team1: this.team1,
                team2: this.team2,
            },
        };
    }

    getGameState(): GameState {
        if (!this.game) throw new Error("No game currently started");

        return this.game.getState();
    }

    isGameFinished(): boolean {
        if (!this.game) throw new Error("No game started");
        return this.game.getState().phase === GamePhase.Finished;
    }

    isGameScoring(): boolean {
        if (!this.game) throw new Error("No game started");
        return this.game.getState().phase === GamePhase.Scoring;
    }


    constructor(name: string, isBotRoom: boolean = false) {
        this.name = name;

        this.isBotRoom = isBotRoom;
        if (this.isBotRoom) {
            for (let i = 0; i < 3; i++) {
                this.addBot();
            }
        }
    }

    initGame() {
        if (!this.isReady()) throw new Error("Room isn't ready");

        const config: GameConfig = this.getGameConfig();
        this.game = new Game(config);
    }

    abandonGame() {
        this.resetTeams();
        this.game = undefined;
        this.botCount = 0;
    }

    resetTeams() {
        this.team1 = [null, null];
        this.team2 = [null, null];
    }

    isFull() {
        return this.players.size === 4;
    }

    isReady(): this is {
        team1: FullTeam;
        team2: FullTeam;
    } {
        return this.team1.every(Boolean) && this.team2.every(Boolean);
    }

    private orderedSeats(): Seats {
        if (!this.isReady()) throw new Error("Room isn't ready");

        return [this.team1[0], this.team2[0], this.team1[1], this.team2[1]];
    }

    join(pid: PlayerId, username: string, isBot: boolean = false): boolean {
        if (this.isFull()) {
            console.log(`Player ${pid} cannot join full room ${this.name}`);
            return false;
        }

        const playerProfile: PlayerProfile = {
            userId: pid,
            username: username,
            connected: true,
            ready: false,
            isBot: isBot
        };
        this.players.set(pid, playerProfile);
        console.log(`Player ${pid} joined room ${this.name}`);

        return true;
    }

    leave(player: PlayerId) {
        if (this.players.delete(player)) {
            console.log(`Player ${player} has left room ${this.name}`);
            const team = this.getPlayerTeam(player);
            if (!team) throw new Error("Player not in any team");
            this.leaveTeam(player, team);
        } else {
            throw new Error("No such player in room");
        }
    }

    leaveTeam(player: PlayerId, team: TeamId) {
        const index = this[team].findIndex((i) => i === player);
        if (index === -1) return;
        this[team][index] = null;
    }

    getPlayerTeam(player: PlayerId): TeamId | undefined {
        if (this.team1.includes(player)) {
            return "team1";
        } else if (this.team2.includes(player)) {
            return "team2";
        } else {
            console.log("Player not in any team");
        }
    }

    joinTeam(player: PlayerId, team: TeamId): boolean {
        if (this.teamFull(team)) {
            console.log(
                `Player ${player} cannot join full team ${team} in room ${this.name}`,
            );
            return false;
        }

        const index = this[team].findIndex((i) => i === null);
        this[team][index] = player;
        return true;
    }

    joinRandomTeams() {
        const teams = ["team1", "team1", "team2", "team2"];
        teams.sort(() => Math.random() - 0.5);

        this.players.forEach((p) => {
            const next = teams.splice(0, 1);
            this.joinTeam(p.userId, next[0] as TeamId);
        });
    }

    teamFull(team: TeamId): boolean {
        return this[team][0] !== null && this[team][1] !== null;
    }

    addBot() {
        const botId = this.getNextBotId();
        this.join(botId, botId.toUpperCase(), true);
    }

    getNextBotId() {
        return "bot_" + this.botCount++; 
    }
}
