# webcards-belote
Browser-based multiplayer card game based on the game [belote](https://en.wikipedia.org/wiki/Belote). Written in TypeScript, built with Node.js, Socket.io, Express, Prisma, Vite and Konva.

---

### Requirements
- npm
- PostgreSQL

---

### Setup
1. `git clone https://github.com/PartTimeWarriorr/webcards-belote.git`
2. `npm install`
3. Setup .env files based on .env.example for server/ and client/.
4. `cd server/prisma`
5. `npx prisma generate`
6. In root: `npm run dev` to run.

### Gallery

![Searching for a room to play in](/screenshots/screen1.png)
![Waiting for players to get ready](/screenshots/screen2.png)
![Playing the game (with bots)](/screenshots/screen3.png)
