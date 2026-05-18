import { Card, GameConfig } from '@shared/types';
import type Konva from 'konva';
import { Vector2d } from 'konva/lib/types';

export interface CardObject extends Konva.Image {
    dragStart: Vector2d;
    suit: string;
    rank: string;
}

export interface DragOptions {
    stage: Konva.Stage;
    dragLayer: Konva.Layer;
    isValidDrop: (pos: Vector2d) => boolean;
    onValidDrop: (card: Card, node: CardObject) => void;
}
