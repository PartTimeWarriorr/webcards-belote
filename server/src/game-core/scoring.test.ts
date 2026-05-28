import { describe, expect, test } from "@jest/globals";
import { createPlayingState } from "./state-builders";

describe("Immutability when scoring", () => {
    test("Adding round scores", () => {
        const state = createPlayingState();
        const newTotal = {...state.totalScores};

        newTotal.team1 += 1;
        expect(newTotal.team1).toBe(1);
        expect(state.totalScores.team1).toBe(0);
    });
})