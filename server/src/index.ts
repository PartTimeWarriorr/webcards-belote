import express from 'express';
import { createServer } from 'http';
import { setupSocket } from './socket';
import path from 'path';

const app = express();
const server = createServer(app);
const PORT = 8080;

const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));

app.get(/.*/, (_, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
});

setupSocket(server);

server.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});