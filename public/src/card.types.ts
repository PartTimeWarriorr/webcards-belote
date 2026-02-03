import type Konva from 'konva';

export interface Card extends Konva.Image {
    dragStartX: number
    dragStartY: number
}