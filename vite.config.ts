import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "public",
  build: {
    rollupOptions: {
        input: {
            index: path.resolve(__dirname, "public/index.html"),
            board: path.resolve(__dirname, "public/board.html")
        }
    },
    outDir: "../dist/public",
    emptyOutDir: true
  }
});