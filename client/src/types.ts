import type Konva from 'konva';

export interface CardObject extends Konva.Image {
    dragStartX: number;
    dragStartY: number;
    suit: string;
    rank: string;
}