import { PlayerRaw } from "../../shared/types";
import { Card } from "./card";
export class Player {
    id: string;
    hand: Array<Card> = new Array<Card>();
    team: string;

    constructor(id: string, team: string) {
        this.id = id;
        this.team = team;
    }

    dealCards(cards: Array<Card>) {
        this.hand = cards;
    }

    toRaw() : PlayerRaw {
        return { id: this.id, hand: this.hand.map((c) => c.toRaw()), team: this.team };
    }
}
