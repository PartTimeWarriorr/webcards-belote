import { Game } from "./game";
import { GameConfig, PlayerId, Result, Team, TeamId } from "./types";

export class Room {
    name: string;
    players: Set<PlayerId> = new Set();
    team1: Team = [null, null];
    team2: Team = [null, null];

    game?: Game;

    constructor(name: string) {
        this.name = name;
    }

    getSeats() {
        return [this.team1[0] as PlayerId, this.team2[0] as PlayerId, this.team1[1] as PlayerId, this.team2[1] as PlayerId];
    }

    initGame() {
        const config : GameConfig = {
            players: [this.team1[0] as PlayerId, this.team2[0] as PlayerId, this.team1[1] as PlayerId, this.team2[1] as PlayerId],
            teams: {
                team1: this.team1,
                team2: this.team2
            }
        };
        this.game = new Game(config);
    } 

    join(player: PlayerId): boolean {
        if (this.isFull()) {
            console.log(`Player ${player} cannot join full room ${this.name}`);
            return false;
        }

        this.players.add(player);
        console.log(`Player ${player} joined room ${this.name}`);

        return true;
    }

    leave(player: PlayerId) {
        if (this.players.delete(player)) {
            console.log(`Player ${player} has left room ${this.name}`);
            const team = this.getPlayerTeam(player);
            if (!team) throw new Error("Player not in any team");
            this.leaveTeam(player, team);
        }
        else {
            throw new Error("No such player in room");
        }
    }

    leaveTeam(player: PlayerId, team: TeamId) {
        const index = this[team].findIndex(i => i === player);
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
            console.log(`Player ${player} cannot join full team ${team} in room ${this.name}`);
            return false;
        }

        const index = this[team].findIndex(i => i !== null);
        this[team][index] = player;
        return true;
    }

    joinRandomTeams() {
        const teams = ["team1", "team1", "team2", "team2"];
        teams.sort(() => Math.random() - 0.5);

        this.players.forEach(p => {
            const next = teams.splice(0, 1);
            this.joinTeam(p, next[0] as TeamId);
        });
    }

    teamFull(team: TeamId): boolean {
        return this[team][0] !== null && this[team][1] !== null;
    }

    isFull() {
        return this.players.size === 4;
    }
}