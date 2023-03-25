CREATE DATABASE omer_db;
CREATE USER hiqermod WITH PASSWORD '123';
GRANT ALL PRIVILEGES ON DATABASE omer_db TO hiqermod;
ALTER ROLE hiqermod CREATEDB;
USE omer_db;
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "hash" TEXT NOT NULL DEFAULT 'empty',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "profilePicture" TEXT NOT NULL DEFAULT 'DefaultPicture',
    "winCount" INTEGER NOT NULL DEFAULT 0,
    "lossCount" INTEGER NOT NULL DEFAULT 0,
    "blockedUsersId" INTEGER[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" SERIAL NOT NULL,
    "roomName" TEXT NOT NULL,
    "roomPass" TEXT,
    "roomOwnerId" INTEGER NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedUsers" (
    "id" SERIAL NOT NULL,
    "chatRoomId" INTEGER NOT NULL,
    "bannedUserId" INTEGER NOT NULL,
    "finishTime" INTEGER NOT NULL,

    CONSTRAINT "BlockedUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomsOnChatUsers" (
    "chatRoomId" INTEGER NOT NULL,
    "chatUserId" INTEGER NOT NULL,
    "power" INTEGER NOT NULL,

    CONSTRAINT "RoomsOnChatUsers_pkey" PRIMARY KEY ("chatRoomId","chatUserId")
);

-- CreateTable
CREATE TABLE "GameHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "myScore" INTEGER NOT NULL,
    "otherUserId" INTEGER NOT NULL,
    "otherUserScore" INTEGER NOT NULL,
    "won" BOOLEAN NOT NULL,
    "matchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friends" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "friendId" INTEGER NOT NULL,
    "state" INTEGER NOT NULL,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_id_key" ON "ChatRoom"("id");

-- AddForeignKey
ALTER TABLE "BlockedUsers" ADD CONSTRAINT "BlockedUsers_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomsOnChatUsers" ADD CONSTRAINT "RoomsOnChatUsers_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomsOnChatUsers" ADD CONSTRAINT "RoomsOnChatUsers_chatUserId_fkey" FOREIGN KEY ("chatUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameHistory" ADD CONSTRAINT "GameHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "Authenticator" BOOLEAN NOT NULL DEFAULT false;
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "secret" TEXT NOT NULL DEFAULT 'empty';
