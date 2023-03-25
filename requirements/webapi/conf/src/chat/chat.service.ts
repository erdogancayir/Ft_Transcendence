import { ExceptionFilter, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Catch } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { ChatRoomDto, ChatUserDto } from './dto/socket.dto';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket, Server } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { prismaFunc } from './prismafunc';
import { verifyJwt } from "../game/game.service"
import { UserStates } from 'src/user/user.states';
import { addMinutes, getTime } from 'date-fns';

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
    catch(exception: UnauthorizedException, host: any) {
        const client: Socket = host.switchToWs().getClient();
        client.emit('ErrorMsgSock', { error: exception.message });
    }
}

interface userVal {
    userId: number,
}

interface roomVal {
    roomId: number,
    roomOwnerId: number,
    roomName: string,
    roomPass?: string,
    roomUsers: userVal[],
};

interface userReq {
    id: number,
    email: string,
    firstName: string,
    lastName: string,
};

interface joinRoomVal {
    state: number,
    roomOwnerId: number,
    roomName: string,
    roomPass: string,
    roomId: number,
}

@WebSocketGateway({ cors: { origin: "*" } })
export class ChatService implements OnModuleInit, OnGatewayDisconnect, OnGatewayConnection {
    @WebSocketServer()
    server: Server;
    private banMap = new Map<string, NodeJS.Timeout>();
    constructor(private prisma: prismaFunc, private userSates: UserStates) { }

    onModuleInit() { }

    async handleConnection(@ConnectedSocket() socket: any) {
        const token = socket.handshake.headers.authorization;
        if (token == process.env.BACKEND_GENERAL_SECRET_KEY)
            return;
        try {
            const decoded: any = await verify(token, process.env.JWT_SECRET as string);
            //socket.user = await this.prisma.updateChatUserSocket(decoded, socket.id);
            socket.user = await this.prisma.GetInfoWithId(decoded.id);
            this.userSates.activeUsers.set(socket.id, decoded.id);
        } catch (err) {
            socket.disconnect();
        }
    }

    async handleDisconnect(client: any) {
        this.userSates.activeUsers.delete(client.id)
    }

    @SubscribeMessage("chat_dm")
    async DmChat(@MessageBody() data: any, @ConnectedSocket() client: any) {
        const jwtData = await verifyJwt(data.jwtToken);
        if (jwtData == null) {
            client.disconnect();
            return "error";
        }
        const socketsId = this.userSates.GetSocketsIdWithUserId(data.targetId);
        if (socketsId.length > 0) {
            this.server.to(socketsId).emit("chat_dm", { message: data.message, id: jwtData.id });
            return "ok";
        }
        return "error";
    }


    @SubscribeMessage("chat_changeRoomPassword")
    async changeRoomPassword(@MessageBody() data: any, @ConnectedSocket() client: any) {
        const jwtData = await verifyJwt(data.jwtToken);
        if (jwtData == null) {
            client.disconnect();
            return "error";
        }
        const myPower = (await this.prisma.getUserOnRoom(data.roomId, jwtData.id)).power;
        if (myPower != 100)
            return;
        //omer burası
        const newPassword = data.newPassword;
        const roomId = data.roomId;

        await this.prisma.prisma.chatRoom.update({
            where: { id: roomId, },
            data: { roomPass: newPassword, }
        });
    }


    @SubscribeMessage("chat_ShowChatRoom")
    async ShowChatRooms(@ConnectedSocket() req: any) {
        const rooms: any = await this.prisma.getRooms();

        let cntrl: number = 0;
        rooms.forEach(async (room: any) => {
            let myarray: any = [];

            cntrl = 0;
            for (const user of room.chatUsers) {
                myarray.push({
                    userId: user.chatUserId,
                    power: user.power,
                })
                if (user.chatUserId == req.user.id)
                    cntrl++;
            }
            if (cntrl) {
                await req.emit("chat_joinRoom", {
                    roomId: room.id,
                    roomOwnerId: room.roomOwnerId,
                    roomName: room.roomName,
                    roomUsers: myarray,
                });
                this.UpdateRoomUsers(room.id);
            }
            else {
                const state = room.roomPass == "" ? 1 : 0;
                req.emit("chat_ShowChatRoom", { state: state, roomId: room.id, roomOwnerId: room.roomOwnerId, roomName: room.roomName });
            }
        });
    }

    @SubscribeMessage("chat_SendMessage")
    async sendMessage(req: any, val: { roomName: string, roomOwnerId: number, message: string, roomId: number }) {
        const room: any = await this.prisma.findRoom(val.roomId);
        const reqUser: ChatUserDto = req.user;
        let cntr: number = 0;
        while (room.mutedUsers[cntr]) {
            if (room.mutedUsers[cntr].mutedUserId == reqUser.id) {
                req.emit("chat_socketAlert", { msg: "You Are Still Muted!" });
                return;
            }
            cntr++;
        }

        room.chatUsers.forEach(async (user: any) => {
            const activeSockets = this.userSates.GetSocketsIdWithUserId(user.chatUser.id);
            if (activeSockets.length != 0) {
                await this.server.to(activeSockets).emit("chat_SendMessage", {
                    State: 3,
                    roomId: room.id,
                    roomName: room.roomName,
                    roomOwnerId: room.roomOwnerId,
                    message: val.message,
                    senderId: reqUser.id,
                });
            }
        })
    }

    @SubscribeMessage("chat_davet")
    async chatDavet(@MessageBody() data: any, @ConnectedSocket() client: any) {
        if (data._customer == "true") {
            const _socketsId = this.userSates.GetSocketsIdWithUserId(data.inviter);
            if (_socketsId.length > 0) {
                this.server.to(_socketsId).emit("canodis", { GameroomId: data.GameroomId, GameRoomPass: data.GameRoomPass, inviter: data.inviter, _customer: "true", userid: data.userid })
                return "ok";
            }
            return "error";
        }
        const socketsId = this.userSates.GetSocketsIdWithUserId(data.userid);
        if (socketsId.length > 0) {
            this.server.to(socketsId).emit("chat_davet", { GameroomId: data.GameroomId, GameRoomPass: data.GameRoomPass, inviter: data.myid, _customer: "false", userid: data.userid })
            return "ok";
        }
        return "error";
    }

    @SubscribeMessage("chat_joinRoom")
    async handleJoinRoom(req: any, jval: joinRoomVal) {
        const reqUser: userReq = req.user;
        const val: joinRoomVal = jval;
        var pushlanacakuser: any = [];

        const room: any = await this.prisma.findRoom(val.roomId);

        let cntr: number = 0;
        while (room.blockedUsers[cntr]) {
            if (room.blockedUsers[cntr].bannedUserId == reqUser.id) {
                const time = Math.floor(getTime(new Date()) / 60000);
                if (room.blockedUsers[cntr].finishTime >= time) {
                    req.emit("chat_socketAlert", { msg: "You Are Still Banned!" });
                    return;
                }
                await this.prisma.prisma.blockedUsers.delete({
                    where: {
                        id: room.blockedUsers[cntr].id,
                    }
                });
                break;
            }
            cntr++;
        }

        room.chatUsers.forEach((user: any) => {
            pushlanacakuser.push({
                userId: user.chatUser.id,
                power: user.power,
            })
        })

        if (room) {
            if (val.roomName == room.roomName && (val.roomPass == room.roomPass || val.state == 1)) {
                await this.prisma.addChatUser(room.id, reqUser.id);
                const activeSockets = this.userSates.GetSocketsIdWithUserId(req.user.id);
                if (activeSockets.length != 0) {
                    await this.server.to(activeSockets).emit("chat_joinRoom", {
                        roomId: room.id,
                        roomOwnerId: room.roomOwnerId,
                        roomName: room.roomName,
                        roomUsers: pushlanacakuser
                    });
                }
            }
        }
        this.UpdateRoomUsers(jval.roomId);
    }

    @SubscribeMessage("chat_GetRoomUsers")
    async takeRoomUsers(@MessageBody() data: any) {
        const room: any = await this.prisma.findRoom(data.roomId);
        return room;
    }

    async UpdateRoomUsers(roomId: number, targetId: number = -1) {
        const room: any = await this.prisma.findRoom(roomId);

        if (room == null)
            return;

        room.chatUsers.forEach((user: any) => {
            if (targetId == -1 || targetId == user.chatUserId) {
                const sockets = this.userSates.GetSocketsIdWithUserId(user.chatUserId);
                if (sockets.length != 0)
                    this.server.to(sockets).emit("chat_roomUserUpdate", room);
            }
        })
    }

    @SubscribeMessage("chat_QuitRoom")
    async quitRoom(@MessageBody() data: any, @ConnectedSocket() client: any) {
        if (await this.prisma.deleteChatUser(data.roomid, client.user.id)) {

            const rooms: any = await this.prisma.getRooms();
            const room = rooms.find((room: any) => room.id == data.roomid);
            const state = room.roomPass == "" ? 1 : 0;
            client.emit("chat_ShowChatRoom", { state: state, roomId: room.id, roomOwnerId: room.roomOwnerId, roomName: room.roomName });

            this.UpdateRoomUsers(data.roomid);
        }
        else {
            this.server.emit("chat_RoomDeleted", { roomId: data.roomid });
        }
    }

    @SubscribeMessage("chat_GivePower")
    async GivePower(@MessageBody() data: any, @ConnectedSocket() client: any) {
        const jwtData = await verifyJwt(data.jwtToken);
        if (jwtData == null) {
            client.disconnect();
            return "error";
        }
        const myPower = (await this.prisma.getUserOnRoom(data.roomId, jwtData.id)).power;
        const otherPower = (await this.prisma.getUserOnRoom(data.roomId, data.userId)).power;

        if (myPower <= otherPower || myPower <= data.power)
            return;

        await this.prisma.prisma.roomsOnChatUsers.updateMany({
            where: {
                chatUserId: data.userId,
                chatRoomId: data.roomId,
            },
            data: {
                power: data.power,
            }
        });
        this.UpdateRoomUsers(data.roomId);
    }

    @SubscribeMessage("chat_CreateRoom")
    async handleCreateRoom(req: any, rval: roomVal) {
        const reqUser: ChatUserDto = req.user;
        const val: roomVal = rval;
        let ret_val: any | ChatRoomDto;
        let state: number = 0;

        if (val.roomPass)
            ret_val = await this.prisma.createChatRoom(reqUser.id, val.roomName, val.roomPass);
        else {
            ret_val = await this.prisma.createChatRoom(reqUser.id, val.roomName, "");
            val.roomPass = "";
            state = 1;
        }

        this.userSates.activeUsers.forEach(async (id: any, socketId: any) => {
            if (id != reqUser.id)
                this.server.to(socketId).emit("chat_ShowChatRoom", { state: state, roomId: ret_val.id, roomOwnerId: reqUser.id, roomName: val.roomName });
            else {
                await this.server.to(socketId).emit("chat_CreateRoom", {
                    state: state,
                    roomId: ret_val.id,
                    roomOwnerId: reqUser.id,
                    roomName: val.roomName,
                    roomPass: val.roomPass,
                    roomUsers: [{
                        userId: ret_val.chatUsers[0].chatUser.id,
                        power: ret_val.chatUsers[0].chatUser.power
                    }],
                });
            }
        })
        this.UpdateRoomUsers(ret_val.id);
    }

    @SubscribeMessage("chat_kick")
    async chatKick(req: any, rval: {
        kickUserId: number,
        roomId: number
    }) {
        const room = await this.prisma.prisma.chatRoom.findUnique({
            where: { id: rval.roomId },
            include: { blockedUsers: true },
        });
        const socketsId = this.userSates.GetSocketsIdWithUserId(rval.kickUserId);
        if (socketsId.length > 0) {
            this.server.to(socketsId).emit("chat_kickServer", { roomName: room?.roomName, roomId: room?.id });

        }
    }

    @SubscribeMessage("chat_ban")
    async chatBan(req: any, rval: {
        banUserId: number,
        banTime: number,
        roomId: number,
    }) {

        const room = await this.prisma.prisma.chatRoom.findUnique({
            where: { id: rval.roomId },
            include: { blockedUsers: true },
        });

        const isBlocked = room?.blockedUsers.some((user) => user.bannedUserId === rval.banUserId);

        if (isBlocked) {
            req.emit("chat_socketAlert", { msg: "This User Already Banned!" });
        }
        else {
            const finishTime = Math.floor(getTime(addMinutes(new Date(), rval.banTime)) / 60000);
            const blockedUser = await this.prisma.prisma.blockedUsers.create({
                data: {
                    chatRoom: { connect: { id: rval.roomId } },
                    bannedUserId: rval.banUserId,
                    finishTime: finishTime,
                }
            });

            await this.prisma.prisma.chatRoom.update({
                where: { id: rval.roomId },
                data: { blockedUsers: { connect: { id: blockedUser.id }, } },
            });
            const socketsId = this.userSates.GetSocketsIdWithUserId(rval.banUserId);
            if (socketsId.length > 0) {
                this.server.to(socketsId).emit("chat_bannedServer", { banTime: rval.banTime, roomName: room?.roomName, roomId: room?.id });
            }
        }
    }

    @SubscribeMessage("chat_Mute")
    async chatMute(req: any, rval: {
        userId: number,
        roomId: number,
    }) {
        const room = await this.prisma.prisma.chatRoom.findUnique({
            where: { id: rval.roomId },
            include: { mutedUsers: true },

        });
        const isMuted = room?.mutedUsers.some((user) => user.mutedUserId === rval.userId);
        if (isMuted) {
            req.emit("chat_socketAlert", { msg: "This User Already Muted!" });
        }
        else {
            const mutedUser = await this.prisma.prisma.mutedUsers.create({
                data: {
                    chatRoom: { connect: { id: rval.roomId } },
                    mutedUserId: rval.userId,
                }
            });
            await this.prisma.prisma.chatRoom.update({
                where: { id: rval.roomId },
                data: { mutedUsers: { connect: { id: mutedUser.id }, } },
            });
            const socketsId = this.userSates.GetSocketsIdWithUserId(rval.userId);
            if (socketsId.length > 0) {
                this.server.to(socketsId).emit("chat_socketAlert", { msg: "You Are Muted From " + room?.roomName });
            }
        }

    }

    @SubscribeMessage("chat_unMute")
    async chatunMute(req: any, rval: {
        userId: number,
        roomId: number,
    }) {
        await this.prisma.prisma.mutedUsers.deleteMany({
            where: {
                mutedUserId: rval.userId,
                chatRoomId: rval.roomId,
            }
        })

        const socketsId = this.userSates.GetSocketsIdWithUserId(rval.userId);
        if (socketsId.length > 0) {
            this.server.to(socketsId).emit("chat_socketAlert", { msg: "You Are Unmuted!" });
        }
    }
}
