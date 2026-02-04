import express from 'express';
import path from 'path';

const app = express();
const PORT = 8080;
const __dirname = import.meta.dirname;
const publicPath = path.join(__dirname, 'dist', 'public');

app.use(express.static(publicPath))
app.use("/cards", express.static(path.join(__dirname, "cards")));

app.get('/', (req, res) => {
    const homePage = path.join(publicPath, 'index.html');
    res.sendFile(homePage);
});

app.get('/board', (req, res) => {
    const boardPage = path.join(publicPath, 'board.html');
    res.sendFile(boardPage);
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});