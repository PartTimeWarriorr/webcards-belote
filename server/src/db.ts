import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../prisma/generated/client";
import { User } from "../prisma/generated/client";
import bcrypt from "bcryptjs";

const connectionString = process.env["DATABASE_URL"];
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
    adapter,
});

// export async function findUserByEmail(
//     email: string,
// ): Promise<Omit<User, "password"> | null> {
//     const user = await prisma.user.findUnique({
//         where: {
//             email: email,
//         },
//         omit: {
//             password: true,
//         },
//     });

//     return user;
// }
export async function getRoomPage(page: number = 1, limit: number = 10) {
    const rooms = await prisma.room.findMany({
        skip: (page - 1) * limit,
        take: limit
    });
    return rooms;
}

export async function findUser(email: string, password: string) {
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
