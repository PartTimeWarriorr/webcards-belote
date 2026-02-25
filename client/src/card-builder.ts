import { CardRaw } from "@shared/types";
import { Vector2d } from "konva/lib/types";
import { CardObject, DragOptions } from "./types";
import { getCardImagePath } from "./utils";
import Konva from "konva";

const CARD_BACK = "/cards/1B.svg";

export class CardBuilder {
    imageScale: number;

    constructor(imageScale: number) {
        this.imageScale = imageScale;
    }

    async buildFrontCard(
        card: CardRaw,
        position: Vector2d,
        options?: {
            draggable?: boolean;
            rotation?: number;
            dragOptions: DragOptions;
        },
    ): Promise<CardObject> {
        const image = await this.loadImage(
            getCardImagePath(card.suit, card.rank),
        );

        const obj = new Konva.Image({
            x: position.x,
            y: position.y,
            image: image,
            width: image.width / this.imageScale,
            height: image.height / this.imageScale,
            draggable: options?.draggable ?? false,
            rotation: options?.rotation ?? 0,
            dragStart: { x: 0, y: 0 },
            suit: card.suit,
            rank: card.rank,
        }) as CardObject;

        if (obj.draggable() && options?.dragOptions) {
            this.attachDragEvents(card, obj, options?.dragOptions);
        }

        return obj;
    }

    async buildBackCard(
        position: Vector2d,
        rotation: number,
    ): Promise<Konva.Image> {
        const image = await this.loadImage(CARD_BACK);

        const obj = new Konva.Image({
            x: position.x,
            y: position.y,
            image: image,
            width: image.width / this.imageScale,
            height: image.height / this.imageScale,
            draggable: false,
            rotation: rotation,
        });

        return obj;
    }

    private attachDragEvents(
        card: CardRaw,
        obj: CardObject,
        options: DragOptions,
    ) {
        obj.on("mouseover", () => {
            document.body.style.cursor = "pointer";
        });

        obj.on("mouseout", () => {
            document.body.style.cursor = "default";
        });

        obj.on("dragstart", () => {
            obj.moveTo(options.dragLayer);
            obj.dragStart = { x: obj.x(), y: obj.y() };
        });

        obj.on("dragend", () => {
            const position = options.stage.getPointerPosition();
            if (!position) return;

            const isValid = options.isValidDrop(position);

            if (isValid) {
                options.onValidDrop(card, obj);
            } else {
                obj.setPosition(obj.dragStart);
            }
        });
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = src;
            image.onload = () => resolve(image);
        });
    }
}
