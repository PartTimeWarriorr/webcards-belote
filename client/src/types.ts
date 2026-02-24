import { GameConfig } from '@shared/types';
import type Konva from 'konva';

export interface CardObject extends Konva.Image {
    dragStartX: number;
    dragStartY: number;
    suit: string;
    rank: string;
}

export type LocalGameConfig = GameConfig & {
    allyId: string
}