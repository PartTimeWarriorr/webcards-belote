import { Card } from "./card";
export class Player {
    id: string;
    hand: Array<Card> = new Array<Card>();

    constructor(id: string) {
        this.id = id;
    }

    dealCards(cards: Array<Card>) {
        this.hand = cards;
    }
}
