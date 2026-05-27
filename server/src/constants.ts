import {
    Rank,
} from "@shared/types";

export const VALAT_SCORE = 90;
export const TARGET_SCORE = 151;

export const ALL_TRUMP_POWER: Record<Rank, number> = {
    J: 8,
    "9": 7,
    A: 6,
    T: 5,
    K: 4,
    Q: 3,
    "8": 2,
    "7": 1,
};

export const ALL_TRUMP_SCORE: Record<Rank, number> = {
    J: 20,
    "9": 14,
    A: 11,
    T: 10,
    K: 4,
    Q: 3,
    "8": 0,
    "7": 0,
};

export const NO_TRUMP_POWER: Record<Rank, number> = {
    A: 8,
    T: 7,
    K: 6,
    Q: 5,
    J: 4,
    "9": 3,
    "8": 2,
    "7": 1,
};

export const NO_TRUMP_SCORE: Record<Rank, number> = {
    A: 11,
    T: 10,
    K: 4,
    Q: 3,
    J: 2,
    "9": 0,
    "8": 0,
    "7": 0,
};

export const ANNOUNCE_ORDER: Record<Rank, number> = {
    A: 8,
    K: 7,
    Q: 6,
    J: 5,
    T: 4,
    "9": 3,
    "8": 2,
    "7": 1
};
