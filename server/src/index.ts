import express from 'express';
import path from 'path';

const app = express();
const PORT = 8080;

const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));

app.get(/.*/, (_, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});