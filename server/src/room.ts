import { Socket } from "socket.io";
import { Player } from "./player";
import { Team } from "./team";
import { Seats } from "@shared/types";

const TEAM_NAMES : string[] = ["blue", "yellow"]

function isTeamName(team: string) : boolean {
    return TEAM_NAMES.includes(team);
}

export class Room {
    name: string;
    blueTeam: Team = new Team();
    yellowTeam: Team = new Team();

    constructor(name: string) {
        this.name = name;
    }

    join(player: Player, teamPref: "blue" | "yellow", socket: Socket) {
        if (this.blueTeam.isFull() && this.yellowTeam.isFull()) {
            console.log(`Player ${player.id}: Room ${this.name} is full`);
            return;
        }

        const teamJoined = this.joinTeam(player, teamPref);
        if (!teamJoined) return;

        console.log(`Player ${player.id} joined room ${this.name}`);

        socket.join(this.name);
    }

    private joinTeam(player: Player, teamPref: "blue" | "yellow") : boolean {
        if (!isTeamName(teamPref)) {
            throw new Error("No such team");
        }

        const { team, altTeam } = this.getTeams(teamPref);
        const joined = team.join(player) || altTeam.join(player);

        if (!joined) {
            console.log(`Player ${player.id} could not join any team`);
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

    isFull() : boolean {
        return this.blueTeam.isFull() && this.yellowTeam.isFull();
    }

    getPlayerTeam(playerId: string) : "blue" | "yellow" {
        if(this.blueTeam.includes(playerId)) return "blue";
        if(this.yellowTeam.includes(playerId)) return "yellow";

        throw new Error(`Player ${playerId} is not in any team`);
    }

    getSeats() : Seats {
        return [ this.blueTeam.slots[0]!.id, this.yellowTeam.slots[0]!.id, this.blueTeam.slots[1]!.id, this.yellowTeam.slots[1]!.id ];
    } 
}