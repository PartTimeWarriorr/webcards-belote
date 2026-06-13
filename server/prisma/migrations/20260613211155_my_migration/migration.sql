-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '1 day';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'BASIC';
