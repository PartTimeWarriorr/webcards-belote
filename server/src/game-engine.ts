import {
    CardRaw,
    GameMode,
    ModeSelection,
    Modifier,
    Play,
    PlayerId,
    Rank,
    Seats,
    Suit,
    SUIT_ORDER,
} from "@shared/types";
import {
    ALL_TRUMP_POWER,
    ALL_TRUMP_SCORE,
    NO_TRUMP_POWER,
    NO_TRUMP_SCORE,
} from "./game-rules";
import { Player } from "./player";

export class GameEngine {
    seats: Seats;
    playedCards: Array<Play>;
    deck: CardRaw[] = [];
    hands: Record<PlayerId, CardRaw[]>;
    turn: PlayerId = "";

    mode?: GameMode;
    modifier?: Modifier;
    trump?: Suit;

    modePicks?: Map<PlayerId, ModeSelection>;
    currMode?: ModeSelection;

    constructor(seats: Seats, trump?: Suit, modifier?: Modifier) {
        this.seats = seats;
        this.playedCards = [];
        this.turn = seats[0];

        this.hands = {};
        this.setupNewRound(trump, modifier);
    }

    private setupNewRound(trump?: Suit, modifier?: Modifier) {
        this.trump = trump;
        this.modifier = modifier;

        this.loadDeck();
        this.dealInitial();
    }

    private loadDeck() {
        for (let s of Object.values(Suit)) {
            for (let r of Object.values(Rank)) {
                this.deck.push({ rank: r, suit: s });
            }
        }
        this.deck.sort(() => Math.random() - 0.5);
    }

    setMode(selection: ModeSelection) {
        this.mode = selection.mode;
        if ("trump" in selection) this.trump = selection.trump;
        if ("modifier" in selection) this.modifier = selection.modifier;
    }

    pickMode(pid: PlayerId, pick: ModeSelection): boolean {
        if (!this.modePicks) this.modePicks = new Map();

        if (!this.currMode || this.compareSelections(this.currMode, pick)) {
            this.currMode = pick;
            this.modePicks.set(pid, pick);
            return true;
        } 

        return false;
    }

    private deal() {
        this.seats.forEach((pid) => {
            this.hands[pid] = this.deck.splice(0, 8);
        });
    }

    private dealInitial() {
        this.seats.forEach((pid) => {
            this.hands[pid] = this.deck.splice(0, 5);
        });
    }

    private dealFinal() {
        this.seats.forEach((pid) => {
            this.hands[pid] = this.hands[pid].concat(this.deck.splice(0, 3));
        });
    }

    playCard(pid: PlayerId, card: CardRaw): boolean {
        if (!this.hasCard(pid, card)) {
            throw new Error(`Player ${pid} does not hold this card`);
        }

        if (!this.canPlay(pid, card)) {
            return false;
        }

        const hand = this.hands[pid];
        const index = hand.findIndex(
            (c) => c.rank === card.rank && c.suit === card.suit,
        );
        hand.splice(index, 1);

        this.playedCards.push({ player: pid, card: card });
        this.advanceTurn();
        return true;
    }

    private advanceTurn() {
        const turnIndex = this.seats.findIndex(s => s === this.turn);
        if (turnIndex === this.seats.length - 1) {
            this.turn = this.seats[0];
        } else {
            this.turn = this.seats[turnIndex + 1];
        }
    }

    private canPlay(playerId: PlayerId, card: CardRaw): boolean {
        if (this.turn !== playerId) return false;
        if (!this.hasCard(playerId, card)) return false;

        if (this.playedCards.length === 0) return true;

        const { player: trickPlayer, card: trickCard } = this.playedCards[0];
        const ownTeamTrick = this.isSameTeam(playerId, trickPlayer);
        const trickSuit = trickCard.suit;

        switch (this.mode) {
            case GameMode.ALL_TRUMP: {
                if (
                    this.hasSuit(playerId, trickSuit) &&
                    card.suit !== trickSuit
                )
                    return false;

                const highest = this.getHighestCard();
                if (
                    this.getCardPower(highest) > this.getCardPower(card) &&
                    this.hasHigherSameSuit(playerId, highest)
                )
                    return false;

                return true;
            }
            case GameMode.NO_TRUMP: {
                if (
                    this.hasSuit(playerId, trickSuit) &&
                    card.suit !== trickSuit
                )
                    return false;

                return true;
            }
            case GameMode.TRUMP: {
                if (
                    this.hasSuit(playerId, trickSuit) &&
                    card.suit !== trickSuit 
                )
                    return false;

                // Must play trump if opponent is winning the hand
                const trickWinner = this.getTrickWinner();
                if (
                    !this.isSameTeam(trickWinner, playerId) &&
                    !this.hasSuit(playerId, trickSuit) &&
                    this.hasTrump(playerId) &&
                    card.suit !== this.trump
                )
                    return false;

                // Must play higher trump if opponent played trump
                const highestOppTrump = this.getHighestOppTrump(playerId);
                if (
                    highestOppTrump &&
                    this.getCardPower(highestOppTrump) > this.getCardPower(card) &&
                    this.hasHigherSameSuit(playerId, highestOppTrump) 
                ) 
                    return false;

                return true;
            }

            default:
                return false;
        }
    }

    isTrickOver(): boolean {
        return this.playedCards.length === 4;
    }

    finishTrick() {
        if (this.playedCards.length !== 4) {
            throw new Error("Not everyone has played");
        }

        this.turn = this.getTrickWinner();
        this.playedCards = [];
    }

    private getTrickWinner(): PlayerId {

        const { player: trickPlayer, card: trickCard } = this.playedCards[0];
        const trickSuit = trickCard.suit;

        switch (this.mode) {
            case GameMode.ALL_TRUMP: 
            case GameMode.NO_TRUMP: {
                const playsOfSuit = this.getPlaysOfSuit(trickSuit);
                const highestOfSuit = this.getHighestPlay(playsOfSuit);        

                return highestOfSuit.player;
            }
            case GameMode.TRUMP: {
                if (!this.trump) {
                    throw new Error("Trump suit is not set in TRUMP mode");
                }

                if (this.isTrumpPlayed()) {
                    const playsOfSuit = this.getPlaysOfSuit(this.trump);
                    const highestOfSuit = this.getHighestPlay(playsOfSuit);        

                    return highestOfSuit.player;
                } else {
                    const playsOfSuit = this.getPlaysOfSuit(trickSuit);
                    const highestOfSuit = this.getHighestPlay(playsOfSuit);        

                    return highestOfSuit.player;
                }
            }
        }

        return "";
    }

    private isTrumpPlayed(): boolean {
        return this.playedCards.some(play => play.card.suit === this.trump);
    }

    private getPlaysOfSuit(suit: Suit): Play[] {
        return this.playedCards.filter(p => p.card.suit === suit);
    }

    private getHighestPlay(plays: Play[]): Play {
        plays.sort((a, b) => this.getCardPower(b.card) - this.getCardPower(a.card));
        return plays[0];
    }

    private getHighestCard(): CardRaw {
        const cards = this.playedCards.map((p) => p.card);
        cards.sort((a, b) => this.getCardPower(b) - this.getCardPower(a));
        return cards[0];
    }

    private getHighestFromArr(cards: CardRaw[]): CardRaw {
        cards.sort((a, b) => this.getCardPower(b) - this.getCardPower(a));
        return cards[0];
    }

    private getHighestOppTrump(playerId: PlayerId): CardRaw {
        const playedTrumps = this.playedCards.filter(play => play.card.suit === this.trump && !this.isSameTeam(play.player, playerId))
            .map(play => play.card);
        return this.getHighestFromArr(playedTrumps);
    }

    private isSameTeam(pid_1: PlayerId, pid_2: PlayerId): boolean {
        const ind_1 = this.seats.indexOf(pid_1);
        const ind_2 = this.seats.indexOf(pid_2);

        if (ind_1 === -1 || ind_2 === -1) {
            throw new Error("Invalid player id");
        }

        return Math.abs(ind_1 - ind_2) === 2;
    }

    private hasCard(pid: PlayerId, card: CardRaw): boolean {
        return this.hands[pid].some(
            (c) => c.rank === card.rank && c.suit === card.suit,
        );
    }

    private hasSuit(playerId: PlayerId, suit: Suit): boolean {
        return this.hands[playerId].some((c) => c.suit === suit);
    }

    private hasHigherSameSuit(playerId: PlayerId, card: CardRaw): boolean {
        return this.hands[playerId].some(
            (c) => this.getCardPower(c) > this.getCardPower(card) && c.suit === card.suit 
        );
    }

    private hasTrump(playerId: PlayerId): boolean {
        return this.hands[playerId].some(
            c => c.suit === this.trump
        );
    }

    private getCardPower(card: CardRaw): number {
        switch (this.mode) {
            case GameMode.ALL_TRUMP:
                return ALL_TRUMP_POWER[card.rank];
            case GameMode.NO_TRUMP:
                return NO_TRUMP_POWER[card.rank];
            case GameMode.TRUMP:
                if (card.suit === this.trump) {
                    return ALL_TRUMP_POWER[card.rank];
                } else {
                    return NO_TRUMP_POWER[card.rank];
                }
            default:
                return 0;
        }
    }

    private getCardScore(card: CardRaw): number {
        switch (this.mode) {
            case GameMode.ALL_TRUMP:
                return ALL_TRUMP_SCORE[card.rank];
            case GameMode.NO_TRUMP:
                return NO_TRUMP_SCORE[card.rank];
            case GameMode.TRUMP:
                if (card.suit === this.trump) {
                    return ALL_TRUMP_SCORE[card.rank];
                } else {
                    return NO_TRUMP_SCORE[card.rank];
                }
            default:
                return 0;
        }
    }

    private compareSuits(left: Suit, right: Suit) {
        return SUIT_ORDER.indexOf(left) - SUIT_ORDER.indexOf(right);
    }

    private compareSelections(left: ModeSelection, right: ModeSelection) {
        const modeDiff = left.mode - right.mode;
        if (modeDiff !== 0) return modeDiff;

        if (left.mode === GameMode.TRUMP && right.mode === GameMode.TRUMP) {
            return this.compareSuits(left.trump, right.trump);
        }

        const mod_left = "modifier" in left ? left.modifier ?? 1 : 1;
        const mod_right = "modifier" in right ? right.modifier ?? 1 : 1;

        return mod_left - mod_right;
    }
}
