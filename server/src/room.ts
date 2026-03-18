import { GameEngine } from "./game-engine";
import { Player } from "./player";
import { Team } from "./team";
import { GameMode,  PlayerId, Seats } from "@shared/types";

const TEAM_NAMES : string[] = ["blue", "yellow"]

function isTeamName(team: string) : boolean {
    return TEAM_NAMES.includes(team);
}

export class Room {
    name: string;
    blueTeam: Team = new Team();
    yellowTeam: Team = new Team();
    players: Map<string, Player> = new Map();

    gameEngine?: GameEngine;

    constructor(name: string) {
        this.name = name;
    }

    startGame(mode: GameMode) {
        this.gameEngine = new GameEngine(mode, this.getSeats());
    }

    join(player: Player, teamPref: "blue" | "yellow") : boolean {
        if (this.isFull()) {
            console.log(`Player ${player.id}: Room ${this.name} is full`);
            return false;
        }

        const teamJoined = this.joinTeam(player.id, teamPref);
        if (!teamJoined) return false;

        this.players.set(player.id, player);
        console.log(`Player ${player.id} joined room ${this.name}`);
        return true;
    }

    leave(pid: PlayerId) {
        if (this.players.delete(pid)) {
            console.log(`Player ${pid} has left room ${this.name}`);
            const team = this.getPlayerTeam(pid);
            this.leaveTeam(pid, team);
        }
        else {
            throw new Error("No such player in room");
        }
    }

    private leaveTeam(pid: PlayerId, teamName: "blue" | "yellow") {
        const team = this.getTeam(teamName);
        team.leave(pid);
    }

    private joinTeam(pid: PlayerId, teamPref: "blue" | "yellow") : boolean {
        if (!isTeamName(teamPref)) {
            throw new Error("No such team");
        }

        const { team, altTeam } = this.getTeams(teamPref);
        const joined = team.join(pid) || altTeam.join(pid);

        if (!joined) {
            console.log(`Player ${pid} could not join any team`);
        }

        return joined;
    }

    private getTeams(teamName: "blue" | "yellow") : { team: Team, altTeam: Team } {
        if (teamName === "blue") {
            return { team: this.blueTeam, altTeam: this.yellowTeam };
        } else if (teamName === "yellow") {
            return { team: this.yellowTeam, altTeam: this.blueTeam };
        }
        throw new Error("No such team name");
    }

    private getTeam(teamName: "blue" | "yellow"): Team {
        if (teamName === "blue") {
            return this.blueTeam;
        } else if (teamName === "yellow") {
            return this.yellowTeam;
        } 
        throw new Error("No such team name");
    }

    isFull() : boolean {
        return this.blueTeam.isFull() && this.yellowTeam.isFull();
    }

    getPlayerTeam(playerId: PlayerId) : "blue" | "yellow" {
        if(this.blueTeam.includes(playerId)) return "blue";
        if(this.yellowTeam.includes(playerId)) return "yellow";

        throw new Error(`Player ${playerId} is not in any team`);
    }

    getSeats() : Seats {
        return [ this.blueTeam.slots[0]!, this.yellowTeam.slots[0]!, this.blueTeam.slots[1]!, this.yellowTeam.slots[1]! ];
    } 

    getAllPlayerIds() : Array<PlayerId> {
        return Array.from(this.players.keys());
    }
}