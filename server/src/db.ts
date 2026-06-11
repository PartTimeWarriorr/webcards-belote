import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Replay, Role, Room } from "../prisma/generated/client";
import { User } from "../prisma/generated/client";
import bcrypt from "bcryptjs";
import { GameState, Move } from "@shared/types";

const connectionString = process.env["DATABASE_URL"];
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
    adapter,
});

export async function getRoomPageByName(page: number = 1, limit: number = 10, name: string): Promise<Room[]> {
    const rooms = await prisma.room.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
            name: {
                contains: name,
                mode: "insensitive",
            }
        }
    });
    return rooms;
}

export async function getUserByEmail(email: string, password: string) {
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        return null;
    }

    const isValidPass = await bcrypt.compare(password, user.password);

    if (!isValidPass) {
        return null;
    }

    const {password: _, ...otherInfo} = user;
    return otherInfo;
}

export async function getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
        where: {
            id 
        }
    });

    if (!user) {
        return null;
    }

    const {password, ...other} = user;
    return other;
}

export async function createUser(
    email: string,
    username: string,
    password: string,
) {
    const encrypted = await bcrypt.hash(password, 10);
    return prisma.user.create({
        data: {
            email,
            name: username,
            password: encrypted,
        },
    });
}

export async function createRoom(
    name: string,
    userId: string,
) {
    return prisma.room.create({
        data: {
            name: name,
            userId: userId,
        }
    })
}

export async function createReplay(
    userId: string,
    initState: GameState,
    history: Array<Move>
): Promise<Replay> {
    return prisma.replay.create({
        data: {
            userId: userId,
            initState: JSON.stringify(initState),
            history: JSON.stringify(history)
        }
    });
}