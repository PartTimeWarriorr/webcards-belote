import type Konva from 'konva';

export interface CardImage extends Konva.Image {
    dragStartX: number;
    dragStartY: number;
    suit: string;
    rank: string;
}