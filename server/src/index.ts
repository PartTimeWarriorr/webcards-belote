import "dotenv/config";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupSocket } from "./socket";
import path from "path";
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
            userId?: string;
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

router.post("/register", async (req, res) => {
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

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.findUser(email, password);

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
    const header = req.headers["authorization"];

    if (!header) {
        return res.status(404).json({
            error: "No token.",
        });
    }

    if (!header.startsWith("Bearer ")) {
        return res.status(404).json({
            error: "Invalid token",
        });
    }

    const token = header.substring(7);

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

router.post("/room", jwtAuth, (req: Request, res) => {
    console.log(`Success: ${JSON.stringify(req.userId)}`);
    res.end();
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

app.use(express.json());
app.use("/api", router);

// setupSocket(server);

server.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
