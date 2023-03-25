import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Server } from 'socket.io'
import { io } from "socket.io-client";
import { verify } from 'jsonwebtoken';
import { UserStates } from "src/user/user.states";

enum RoomJoinType {
    RandomJoin,
    JustLink
}

enum Me {
    firstUser,
    lastUser,
    viewer
}

enum WinnerUser {
    firstUser,
    lastUser,
    undefined
}

function GenerateToken(length: number) {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var token = '';
    for (var i = 0; i < length; i++)
        token += chars[Math.floor(Math.random() * chars.length)];
    return token;
}

function GenerateUniqueId() {
    while (true) {
        var token = GenerateToken(30)
        if (rooms.get(token) == null)
            return token;
    }
}

export async function verifyJwt(token: string) {
    try {
        return await verify(token, process.env.JWT_SECRET as string) as any;
    }
    catch (err) {
        return null as any;
    }
}

const defaultHealth = 5;
class Room {
    constructor(userSocketToken: string, roomJoinType: RoomJoinType, userId: number, speedBoost: boolean) {
        this.id = GenerateUniqueId();
        this.roomJoinType = roomJoinType;
        this.firstUserSocketToken = userSocketToken;
        this.firstUserId = userId;
        this.speedBoost = speedBoost;
        if (roomJoinType = RoomJoinType.JustLink)
            this.password = GenerateToken(20);
    }

    RandomAngle(dir: boolean = (Math.random() > 0.5)) {
        var angle = (Math.random() * Math.PI / 2) - (Math.PI / 4);
        angle += (dir ? 0 : Math.PI);
        this.ballDirX = Math.cos(angle);
        this.ballDirY = Math.sin(angle);
    }

    Start() {
        this.RandomAngle();
        this.gameStarted = true;
    }

    async SaveDatabase(prisma: PrismaService) {
        if (this.winnerUser == WinnerUser.undefined)
            return;

        const firstUserScore = defaultHealth - this.firstUserHealth;
        const lastUserScore = defaultHealth - this.lastUserHealth;

        //first user
        const gameHistoryFirstUser = await prisma.gameHistory.create({
            data: {
                myScore: firstUserScore,
                otherUserId: this.lastUserId,
                otherUserScore: lastUserScore,
                won: (this.winnerUser == WinnerUser.firstUser),
                user: { connect: { id: this.firstUserId } },
            },
        });
        await prisma.user.update({
            where: { id: this.firstUserId },
            data: { gameHistoryes: { connect: { id: gameHistoryFirstUser.id }, } },
        });

        //last user
        const gameHistoryLastUser = await prisma.gameHistory.create({
            data: {
                myScore: lastUserScore,
                otherUserId: this.firstUserId,
                otherUserScore: firstUserScore,
                won: (this.winnerUser == WinnerUser.lastUser),
                user: { connect: { id: this.lastUserId } },
            },
        });
        await prisma.user.update({
            where: { id: this.lastUserId },
            data: { gameHistoryes: { connect: { id: gameHistoryLastUser.id } } },
        });

        //points
        const winUserId = this.winnerUser == WinnerUser.firstUser ? this.firstUserId : this.lastUserId;
        const lossUserId = this.winnerUser != WinnerUser.firstUser ? this.firstUserId : this.lastUserId;

        const winCount = (await prisma.user.findUnique({ where: { id: winUserId, }, }) as any).winCount;
        const lossCount = (await prisma.user.findUnique({ where: { id: lossUserId, }, }) as any).lossCount;

        await prisma.user.update({
            where: { id: winUserId, },
            data: { winCount: winCount + 1 },
        });

        await prisma.user.update({
            where: { id: lossUserId, },
            data: { lossCount: lossCount + 1 },
        });
    }

    id: string;
    password: string;
    firstUserHealth: number = defaultHealth;
    lastUserHealth: number = defaultHealth;
    gameStarted: boolean = false;
    roomJoinType: RoomJoinType;
    winnerUser: WinnerUser = WinnerUser.undefined;
    speedBoost: boolean;

    firstUserPos = 210;
    lastUserPos = 210;
    ballPosX = 400;
    ballPosY = 250;
    ballDirX: number;
    ballDirY: number;

    firstUserSocketToken: any = undefined;
    lastUserSocketToken: any = undefined;
    viewersSocketToken: string[] = new Array();

    firstUserId: number;
    lastUserId: number;
    viewersUserId: number[] = new Array();
};

var rooms: Map<string, Room> = new Map();

function JoinOrCreateRandomRoom(userSocketToken: string, userId: number, speedBoost: boolean) {
    // search empty room
    var foundRoomId = "";
    rooms.forEach((room, key) => {
        if (room.lastUserSocketToken == undefined && room.roomJoinType == RoomJoinType.RandomJoin && room.speedBoost == speedBoost) {
            room.lastUserSocketToken = userSocketToken;
            room.lastUserId = userId;
            room.Start();
            rooms.set(key, room);
            foundRoomId = key;
        }
    });
    if (foundRoomId != "")
        return { roomId: foundRoomId, me: Me.lastUser };

    // create new room
    var newRoom = new Room(userSocketToken, RoomJoinType.RandomJoin, userId, speedBoost);
    rooms.set(newRoom.id, newRoom);
    return { roomId: newRoom.id, me: Me.firstUser };
}

var clientLoop: any;
async function StartClientSocket() {
    const socketOptions = { transportOptions: { polling: { extraHeaders: { Authorization: process.env.BACKEND_GENERAL_SECRET_KEY, } } } };
    clientLoop = await io(process.env.BACKEND_URL as string, socketOptions);
}

function RunBackendFinishGameSocket(roomId: string): void {
    clientLoop.emit("game_finishGame", { secureKey: process.env.BACKEND_GENERAL_SECRET_KEY as string, roomId: roomId });
}

function RunBackendRenderSocket() {
    clientLoop.emit("game_render", { secureKey: process.env.BACKEND_GENERAL_SECRET_KEY as string });
}

@WebSocketGateway({ cors: { origin: "*" } })
export class GameService {
    @WebSocketServer() server: Server;

    constructor(private prisma: PrismaService, @Inject(UserStates) private readonly userSates: UserStates) {

    }

    async afterInit() {
        await StartClientSocket();
        setInterval(this.Loop, 1000 / 30); // 30fps
    }

    handleDisconnect(client: any) {
        const socketToken = client.id;
        rooms.forEach((room, key) => {
            if (socketToken == room.firstUserSocketToken) {
                if (room.gameStarted) {
                    room.winnerUser = WinnerUser.lastUser;
                    rooms.set(key, room);
                }
                RunBackendFinishGameSocket(room.id);
            }
            if (socketToken == room.lastUserSocketToken) {
                if (room.gameStarted) {
                    room.winnerUser = WinnerUser.firstUser;
                    rooms.set(key, room);
                }
                RunBackendFinishGameSocket(room.id);
            }
        });
    }

    @SubscribeMessage("game_joinRandomRoom")
    async onJoinRamdomRoom(@MessageBody() data: any, @ConnectedSocket() client: any) {
        const jwtData = await verifyJwt(data.jwtToken);
        if (jwtData == null) {
            client.disconnect();
            return;
        }
        const socketToken = client.id;
        const roomInfo = JoinOrCreateRandomRoom(socketToken, jwtData.id, data.speedBoost);
        this.userSates.inGameUsers.set(client.id, jwtData.id);
        return ({ roomId: rooms.get(roomInfo.roomId)?.id, me: roomInfo.me })
    }

    @SubscribeMessage("game_createRoom")
    async onCreateRoom(@MessageBody() data: any, @ConnectedSocket() client: any) {
        const jwtData = await verifyJwt(data.jwtToken);
        if (jwtData == null) {
            client.disconnect();
            return;
        }
        

        const socketToken = client.id;
        var newRoom = new Room(socketToken, RoomJoinType.JustLink, jwtData.id, data.speedBoost);
        rooms.set(newRoom.id, newRoom);
        this.userSates.inGameUsers.set(client.id, jwtData.id);
        
        if (data.myid && data.userid)
            client.emit("chat_invitein", { roomId: newRoom.id, roomPassword: newRoom.password, myid : data.myid, userid : data.userid});
        else
            return ({ roomId: newRoom.id, roomPassword: newRoom.password })
    }

    @SubscribeMessage("game_joinRoom")
    async onJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: any) {
        const jwtData = await verifyJwt(data.jwtToken);
        if (jwtData == null) {
            client.disconnect();
            return;
        }
        const socketToken = client.id;
        var room = rooms.get(data.roomId) as Room;
        if (room == null || room.password != data.roomPassword)
            return { error: "Wrong id or password!" };
        if (room.gameStarted)
            return { error: "Room is full!" };

        room.lastUserSocketToken = socketToken;
        room.lastUserId = jwtData.id;
        room.Start();
        rooms.set(room.id, room);
        this.userSates.inGameUsers.set(client.id, jwtData.id);
        return { error: "" };
    }

    @SubscribeMessage("game_viewRoom")
    async onViewRoom(@MessageBody() data: any, @ConnectedSocket() client: any) {
        const jwtData = await verifyJwt(data.jwtToken);
        if (jwtData == null) {
            client.disconnect();
            return;
        }
        const socketToken = client.id;
        var room = rooms.get(data.roomId);
        if (room == null)
            return { error: "Room not found!" };

        room.viewersSocketToken.push(socketToken);
        room.viewersUserId.push(jwtData.id);

        return { error: "" };
    }

    @SubscribeMessage("game_setFirstUserPos")
    onSetFirstUserPos(@MessageBody() data: any) {
        if (!rooms.has(data.roomId))
            return;
        var room = rooms.get(data.roomId) as Room;
        room.firstUserPos = data.firstUserPos;
        rooms.set(data.roomId, room);
    }

    @SubscribeMessage("game_setLastUserPos")
    onSetLastUserPos(@MessageBody() data: any) {
        if (!rooms.has(data.roomId))
            return;
        var room = rooms.get(data.roomId) as Room;
        room.lastUserPos = data.lastUserPos;
        rooms.set(data.roomId, room);
    }

    @SubscribeMessage("game_finishGame")
    FinishGame(@MessageBody() data: any) {
        if (data.secureKey != process.env.BACKEND_GENERAL_SECRET_KEY as string)
            return;
        const room = rooms.get(data.roomId) as Room;
        rooms.get(data.roomId)?.SaveDatabase(this.prisma);
        rooms.delete(data.roomId);

        this.userSates.inGameUsers.delete(room.firstUserSocketToken);
        this.userSates.inGameUsers.delete(room.lastUserSocketToken);

        this.server.to(room.firstUserSocketToken).emit('game_finishGame', { winnerUser: room.winnerUser });
        this.server.to(room.lastUserSocketToken).emit('game_finishGame', { winnerUser: room.winnerUser });
        room.viewersSocketToken.forEach(viewerSocketToken => {
            this.server.to(viewerSocketToken).emit('game_finishGame', { winnerUser: room.winnerUser });
        });
    }

    @SubscribeMessage("game_leaveGame")
    outGame(@ConnectedSocket() client: any) {
        const socketToken = client.id;
        rooms.forEach((room, key) => {
            if (socketToken == room.firstUserSocketToken) {
                if (room.gameStarted) {
                    room.winnerUser = WinnerUser.lastUser;
                    rooms.set(key, room);
                }
                RunBackendFinishGameSocket(room.id);
                return;
            }
            if (socketToken == room.lastUserSocketToken) {
                if (room.gameStarted) {
                    room.winnerUser = WinnerUser.firstUser;
                    rooms.set(key, room);
                }
                RunBackendFinishGameSocket(room.id);
                return;
            }
        });
    }

    Loop() {
        const ballSpeed = 8;
        rooms.forEach((room, key) => {
            if (!room.gameStarted)
                return;
            const speedBoost = room.speedBoost ? 2 : 1;
            room.ballPosX += room.ballDirX * ballSpeed * speedBoost;
            room.ballPosY += room.ballDirY * ballSpeed * speedBoost;
            //Up control
            if (room.ballPosY < 10 && room.ballDirY < 0)
                room.ballDirY *= -1;

            //Down control
            if (room.ballPosY > 490 && room.ballDirY > 0)
                room.ballDirY *= -1;

            //Left constrol
            if (room.ballPosX < 45) {
                if (Math.abs((room.firstUserPos + 50) - room.ballPosY) > 60) {
                    room.firstUserHealth--;
                    room.ballPosX = 400;
                    room.ballPosY = 250;
                    room.RandomAngle();
                    if (room.firstUserHealth == 0) {
                        room.ballDirX = 0;
                        room.ballDirY = 0;
                        room.winnerUser = WinnerUser.lastUser;
                        rooms.set(key, room);
                        RunBackendFinishGameSocket(room.id);
                    }
                } else {
                    room.RandomAngle(true);
                }
            }
            //Right constrol
            if (room.ballPosX > 755) {
                if (Math.abs((room.lastUserPos + 50) - room.ballPosY) > 60) {
                    room.lastUserHealth--;
                    room.ballPosX = 400;
                    room.ballPosY = 250;
                    room.RandomAngle();
                    room.ballDirX *= -1;
                    if (room.lastUserHealth == 0) {
                        room.ballDirX = 0;
                        room.ballDirY = 0;
                        room.winnerUser = WinnerUser.firstUser;
                        rooms.set(key, room);
                        RunBackendFinishGameSocket(room.id);
                    }
                } else {
                    room.RandomAngle(false);
                }
            }
            if (room.ballPosX)
                rooms.set(key, room);
        });
        RunBackendRenderSocket();
    }

    @SubscribeMessage("game_render")
    Render(@MessageBody() data: any) {
        if (data.secureKey != process.env.BACKEND_GENERAL_SECRET_KEY as string)
            return;
        rooms.forEach((room) => {
            if (!room.gameStarted)
                return;
            var renderData = {
                firstUserPos: room.firstUserPos,
                lastUserPos: room.lastUserPos,
                ballPosX: room.ballPosX,
                ballPosY: room.ballPosY,
                firstUserHealth: room.firstUserHealth,
                lastUserHealth: room.lastUserHealth,
                firstUserId: room.firstUserId,
                lastUserId: room.lastUserId,
                viewersUserId: room.viewersUserId,
            };
            this.server.to(room.firstUserSocketToken).emit("game_render", renderData);
            this.server.to(room.lastUserSocketToken).emit("game_render", renderData);
            room.viewersSocketToken.forEach(viewerSocketToken => {
                this.server.to(viewerSocketToken).emit("game_render", renderData);
            });
        });
    }
}
