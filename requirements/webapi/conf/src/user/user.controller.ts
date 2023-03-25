import { JwtGuard } from './../auth/guard/jwt.guard';
import { Body, Controller, Get, Injectable, Post, Req, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { UserDto, stateDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { createWriteStream, unlinkSync, mkdir, promises, stat, existsSync } from 'fs';
import * as https from 'https';
import { UserStates } from './user.states';
import { MessageBody } from '@nestjs/websockets';
import { prismaFunc } from '../chat/prismafunc';
import { CodeDto, QrDto } from 'src/auth/dto';

function GenerateToken(length: number) {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var token = '';
    for (var i = 0; i < length; i++)
        token += chars[Math.floor(Math.random() * chars.length)];
    return token;
}

enum FriendProcessType {
    addInvite,
    acceptInvite,
    deleteFriend,
}

enum FriendState {
    none,
    waitingRequest,
    decision,
    accepted,
}

@UseGuards(JwtGuard)
@Controller('users')
@Injectable({})
export class UserController {
    constructor(private prisma: PrismaService, private userSates: UserStates) {
    }
    @Post('uploadImage')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
        const originalFileName: string = file.originalname as string;
        const imageType = "." + originalFileName.split(".").reverse()[0];
        const userJwt: UserDto | any = req.user;
        const fileName = userJwt.id + "_" + GenerateToken(20) + imageType;
        const path = process.cwd() + '/assets/';

        await promises.mkdir(path, { recursive: true });
        const writeStream = createWriteStream(path + fileName);
        writeStream.write(file.buffer);
        writeStream.end();

        //delete old image
        var user: string | any = await this.prisma.user.findUnique({
            where: {
                id: userJwt.id,
            },
        });

        const oldPath = process.cwd() + '/assets/' + user.profilePicture;
        if (user.profilePicture != "DefaultPicture" && existsSync(oldPath))
            unlinkSync(oldPath);

        await this.prisma.user.update({
            where: {
                id: userJwt.id,
            },
            data: { profilePicture: fileName },
        });
    }

    @Post('uploadImageWithUrl')
    async uploadImageWithUrl(@Req() req: Request) {
        const link: string = req.query.link as string;
        const imageType = "." + link.split(".").reverse()[0];
        const userJwt: UserDto | any = req.user;
        const fileName = userJwt.id + "_" + GenerateToken(20) + imageType;
        const path = process.cwd() + '/assets/';

        await promises.mkdir(path, { recursive: true });
        const writeStream = createWriteStream(path + fileName);
        https.get(link, function (response) {
            response.pipe(writeStream);
            writeStream.on('finish', function () {
                writeStream.end();
            });
        })
        await new Promise(r => setTimeout(r, 1000));

        //delete old image
        var user: string | any = await this.prisma.user.findUnique({
            where: {
                id: userJwt.id,
            },
        });
        const oldPath = process.cwd() + '/assets/' + user.profilePicture;
        if (user.profilePicture != "DefaultPicture" && existsSync(oldPath))
            unlinkSync(oldPath);

        await this.prisma.user.update({
            where: {
                id: userJwt.id,
            },
            data: { profilePicture: fileName },
        });
    }

    @Get('me')
    async getMe(@Req() req: Request) {
        var user: any = req.user;
        user.state = this.userSates.GetState(user.id);
        user.me = true;
        user.blockedUsersId = undefined;
        return user;
    }

    @Get('search')
    async searchUsers(@Req() req: Request, @Body() bdy: any) {
        const userJwt: UserDto | any = req.user;
        const userName: string = req.query.name as string
        var users: string | any[] = await this.prisma.user.findMany({
            where: {
                userName: {
                    contains: userName
                },
            },
        })
        users = users.filter((user: any) => !userJwt.blockedUsersId.includes(user.id));
        users = users.filter((user: any) => !user.blockedUsersId.includes(userJwt.id));
        return users;
    }

    @Get('deleteAccount')
    async getDeleteAccount(@Req() req: Request) {
        const userJwt: UserDto | any = req.user;

        //delete old image
        var user: string | any = await this.prisma.user.findUnique({
            where: {
                id: userJwt.id,
            },
        });
        const path = process.cwd() + '/assets/' + user.profilePicture;
        if (user.profilePicture != "DefaultPicture" && existsSync(path))
            unlinkSync(path);

        await this.prisma.user.delete({
            where: {
                id: userJwt.id,
            },
        })
    }

    @Get('user')
    async userInfo(@Req() req: Request) {
        const userJwt: UserDto | any = req.user;
        const otherId: number = +(req.query.id as string);

        const user: any = await this.prisma.user.findUnique({
            where: {
                id: otherId,
            },

        });
        if (user == null)
            return null;

        user.state = this.userSates.GetState(user.id);
        user.friendState = await this.GetFriendState(userJwt.id, +(req.query.id as string));
        user.me = (userJwt.id == +(req.query.id as string));
        user.blocked = userJwt.blockedUsersId.includes(otherId);
        user.blockedYou = user.blockedUsersId.includes(userJwt.id);
        user.blockedUsersId = undefined;
        return user;
    }

    @Get('gameHistory')
    async GameHistory(@Req() req: Request) {
        var result = [];
        const userJwt: UserDto | any = req.user;
        const games: string | any = await this.prisma.gameHistory.findMany({
            where: {
                userId: userJwt.id,
            },
        });

        for (const game of games) {
            game.otherUserInfo = await this.GetUserDataWithId(userJwt.id, game.otherUserId);
            result.push(game);
        }
        return (result);
    }

    async GetUserDataWithId(myId: number, userId: number) {
        const user: any = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (user == null)
            return null;
        user.state = this.userSates.GetState(user.id);
        user.friendState = await this.GetFriendState(myId, userId);
        user.me = (myId == userId);
        if (user.blockedUsersId.includes(myId))
            return null;
        user.blockedUsersId = undefined;
        return user;
    }

    @Get('myBlockedUsers')
    async BlockedUsers(@Req() req: Request) {
        var result = [];
        const userJwt: UserDto | any = req.user;

        const blockedUsersId = userJwt.blockedUsersId;
        for (const blockedUserId of blockedUsersId)
            result.push(await this.GetUserDataWithId(userJwt.id, blockedUserId));
        return (result);
    }

    @Get('myFriends')
    async Friends(@Req() req: Request) {
        var result = [];
        const userJwt: UserDto | any = req.user;
        const friends: string | any = await this.prisma.friends.findMany({
            where: {
                userId: userJwt.id,
            },
        });
        for (const friend of friends)
            result.push(await this.GetUserDataWithId(userJwt.id, friend.friendId));
        return (result);
    }

    @Get('blockProcess')
    async BlockedProcess(@Req() req: Request) {
        const userJwt: UserDto | any = req.user;
        const blockId: number = +(req.query.blockId as string);
        const block: boolean = req.query.block == "true";

        if (block) {
            if (!userJwt.blockedUsersId.includes(blockId)) {
                await this.prisma.user.update({
                    where: { id: userJwt.id },
                    data: { blockedUsersId: { push: blockId } },
                });
            }
        }
        else {
            await this.prisma.user.update({
                where: {
                    id: userJwt.id
                },
                data: {
                    blockedUsersId: userJwt.blockedUsersId.filter((id: any) => id !== blockId),
                },
            });
        }
    }

    async SaveDatabaseFriend(id: number, friendId: number, state: FriendState) {
        //my process
        {
            const friends = await this.prisma.friends.create({
                data: {
                    user: { connect: { id: id } },
                    friendId: friendId,
                    state: state,
                },
            });
            await this.prisma.user.update({
                where: { id: id },
                data: { friends: { connect: { id: friends.id }, } },
            });
        }
        //other process
        {
            const otherState = (state == FriendState.waitingRequest ? FriendState.decision : FriendState.accepted);
            const me = await this.prisma.friends.create({
                data: {
                    user: { connect: { id: friendId } },
                    friendId: id,
                    state: otherState,
                },
            });
            await this.prisma.user.update({
                where: { id: friendId },
                data: { friends: { connect: { id: me.id }, } },
            });
        }
    }

    async DeleteDatabaseFriend(id: number, friendId: number) {
        //my process
        await this.prisma.friends.deleteMany({
            where: {
                userId: id,
                friendId: friendId
            },
        });
        //other process
        await this.prisma.friends.deleteMany({
            where: {
                userId: friendId,
                friendId: id
            },
        });
    }

    async GetFriendState(id: number, friendId: number) {
        const foundFriend: any = await this.prisma.friends.findMany({
            where: {
                userId: id,
                friendId: friendId
            },
        });
        if (foundFriend.length == 0)
            return FriendState.none;
        return foundFriend[0].state;
    }

    @Get('friendProcess')
    async FriendRequest(@Req() req: Request) {
        const userJwt: UserDto | any = req.user;
        const id = userJwt.id;
        const friendId: number = +(req.query.friendId as string);
        const type = +(req.query.friendProcessType as string);

        if (id == friendId)
            return;

        switch (type) {
            case FriendProcessType.addInvite:
                if (await this.GetFriendState(id, friendId) == FriendState.none) {
                    await this.SaveDatabaseFriend(id, friendId, FriendState.waitingRequest);
                }
                break;
            case FriendProcessType.acceptInvite:
                if (await this.GetFriendState(id, friendId) == FriendState.decision) {
                    await this.DeleteDatabaseFriend(id, friendId);
                    await this.SaveDatabaseFriend(id, friendId, FriendState.accepted);
                }
                break;
            case FriendProcessType.deleteFriend:
                await this.DeleteDatabaseFriend(id, friendId);
                break;
        }
    }

    @Post('twofactory')
    async UpdateTwoFactory(@Req() req: Request, @Body() dto: stateDto) {
        const userJwt: UserDto | any = req.user;
        const _prisma: any = new prismaFunc(this.prisma)
        await _prisma.UpdateUserAuth(userJwt.id, dto.state);
        return (dto.state);
    }

    @Post('getfactory')
    async GetFactory(@Req() req: Request, @Body() dto: stateDto) {
        const userJwt: UserDto | any = req.user;
        const _prisma: any = new prismaFunc(this.prisma);
        const user = await _prisma.GetInfoWithId(userJwt.id);
        return user.Authenticator;
    }
    @Post('qrcode')
    async qrCode(@Req() req: Request, dto: QrDto): Promise<{secret: string, qrData: string}> {
        var speakesay = require('speakeasy');
        var qrcode = require('qrcode');

        const userJwt: UserDto | any = req.user;
        const _prisma: any = new prismaFunc(this.prisma);

        var secret = speakesay.generateSecret({
            name: "Dis"
        })
        var _obje = {
            secret: "",
            qrData: "",
        };
        _obje.secret = secret.ascii;
        _prisma.updateSecret(userJwt.id, _obje.secret)
        return new Promise((resolve, reject) => {
            qrcode.toDataURL(secret.otpauth_url, (err: Error, data: string) => {
                if (err) {
                    reject(err);
                } else {
                    _obje.qrData = data;
                    resolve(_obje);
                }
            });
        });
    }

    @Post('Code')
    async code(@Req() req: Request, @Body() dto: CodeDto) : Promise<string> {
        var speakeasy = require('speakeasy');
        const userJwt: UserDto | any = req.user;
        const _prisma: any = new prismaFunc(this.prisma);
        const user = await _prisma.GetInfoWithId(userJwt.id);

        var verified = speakeasy.totp.verify({
            secret:   user.secret,
            encoding: dto.encoding,
            
            token: dto.code
        })
    return (verified);
    }
}
