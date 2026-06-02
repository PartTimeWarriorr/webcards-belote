import "dotenv/config";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupSocket } from "./socket";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt, { JwtPayload } from "jsonwebtoken";
import * as db from "./db";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            JWT_SECRET: string;
            DATABASE_URL: string;
        }
    }

    namespace Express {
        interface Request {
            userId: string;
        }
    }
}

type RoomsQuery = {
    page: string;
    limit: string;
};

declare module "jsonwebtoken" {
    export interface JwtPayload {
        userId: string;
    }
}

const router = express.Router();

router.post("/auth/register", async (req, res) => {
    try {
        const { email, username, password } = req.body;

        const user = await db.createUser(email, username, password);

        return res.status(201).json({
            message:
                "You have been registered! You can now log in with the same info.",
        });
    } catch (err: any) {
        if (err.code === "P2002") {
            return res.status(409).json({
                error: "Email already taken.",
            });
        } else {
            return res.status(500).json({
                error: "Server error when creating user.",
            });
        }
    }
});

router.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.getUserByEmail(email, password);

        const token = jwt.sign(
            {
                userId: user?.id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            },
        );
        return res.cookie("token", token, { httpOnly: true }).status(201).end();
    } catch (err) {
        return res.status(404).json({
            error: "Invalid email or password.",
        });
    }
});

const jwtAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(404).json({
            error: "No token.",
        });
    }

    try {
        const decoded = <JwtPayload>jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
    } catch (err) {
        return res.status(404).json({
            error: "Invalid/expired token",
        });
    }

    next();
};

router.get("/auth/me", jwtAuth, async (req, res) => {
    const user = await db.getUserById(req.userId);

    if (!user) {
        return res.status(404).json({
            error: "User not found.",
        });
    }

    return res.status(200).json(user);
});

router.post("/room", jwtAuth, async (req: Request, res) => {
    try {
        const {name, ...other} = req.body;
        const room = await db.createRoom(name, req.userId);

        return res.status(201).json({ data: room});
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
});

router.get(
    "/rooms",
    jwtAuth,
    async (req: Request<{}, {}, {}, RoomsQuery>, res) => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const rooms = await db.getRoomPage(page, limit);

            return res.status(200).json({
                data: rooms,
            });
        } catch (err) {
            return res.status(404).json({
                error: err,
            });
        }
    },
);

const app = express();
const server = createServer(app);
const PORT = 8080;

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);

setupSocket(server);

server.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
