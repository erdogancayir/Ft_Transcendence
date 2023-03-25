import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { stateDto } from "src/user/dto";

interface ifUser {
	id: number,
	email: string,
	firstName: string,
	lastName: string,
	chatRooms: ifChatRoom[],
}

interface ifChatRoom {
	id: number,
	roomName: string,
	roomPass?: string | null,
	roomOwnerId: number,
	chatUsers: ifUser[],
}

@Injectable()
export class prismaFunc {
	constructor(public prisma: PrismaService) { }

	async GetInfoWithId(id: number) {
		return await this.prisma.user.findUnique({ where: { id: id } })
	}
	
	async updateSecret (id: number, secret: string) {
		await this.prisma.user.update({
			where: {
				id: id,
			},
			data: {
				secret: secret,
			}
		});
	}

	async UpdateUserAuth(id: number, state: boolean) {
		await this.prisma.user.update({
			where: {
				id: id,
			},
			data: {
				Authenticator: state,
			}
		});
	}

	async getRooms() {
		return await this.prisma.chatRoom.findMany({
			include: {
				chatUsers: true,
			}
		});
	}

	async getUserOnRoom(roomid: number, userId: number) {
		const room = await this.findRoom(roomid) as any;
		return room.chatUsers.find((value: any) => value.chatUserId == userId);
	}

	async findRoom(roomid: number) {
		return (await this.prisma.chatRoom.findUnique({
			where: {
				id: roomid
			},
			include: {
				chatUsers: {
					include: { chatUser: true, }
				},
				blockedUsers: true,
				mutedUsers: true,
			},
		}))
	}

	async addChatUser(roomid: number, userid: number) {
		await this.prisma.roomsOnChatUsers.create({
			data: {
				power: 0,
				chatUser: {
					connect: {
						id: userid,
					}
				},
				chatRoom: {
					connect: {
						id: roomid,
					}
				}
			},
		})
	}

	async deleteChatUser(roomid: number, userid: number) {
		await this.prisma.roomsOnChatUsers.deleteMany({
			where: {
				chatUserId: userid,
				chatRoomId: roomid,
			}
		});

		const room = await this.findRoom(roomid);


		if (!room?.chatUsers.length) {
			await this.prisma.chatRoom.delete({
				where: {
					id: roomid
				}
			});
			return false;
		}
		if (room.roomOwnerId == userid) {
			const newOwner = await this.prisma.roomsOnChatUsers.findFirst({
				where: {
					chatUserId: {
						not: userid,
					},
					chatRoomId: roomid,
				},
				orderBy: {
					power: 'desc'
				},
				include: {
					chatUser: true,
				},
			});
			await this.prisma.chatRoom.update({
				where: {
					id: roomid,
				},
				data: {
					roomOwnerId: newOwner?.chatUser.id,
				}
			});

			await this.prisma.roomsOnChatUsers.updateMany({
				where: {
					chatUserId: {
						not: userid,
					},
					chatRoomId: roomid,
				},
				data: {
					power: 100,
				}
			});
		}
		return true;
	}

	async createChatRoom(userid: number, roomname: string, roompass: string) {
		const result = await this.prisma.chatRoom.create({
			data: {
				roomName: roomname,
				roomOwnerId: userid,
				roomPass: roompass,
				chatUsers: {
					create: [
						{
							power: 100,
							chatUser: {
								connect: {
									id: userid,
								}
							}
						}
					]
				}
			},
			include: {
				chatUsers: {
					include: { chatUser: true, }
				}
			},
		})
		return (result);
	}


	async findUserRooms(userid: number) {
		return (await this.prisma.roomsOnChatUsers.findMany({
			where: {
				chatUserId: userid
			},
			include: {
				chatRoom: true,
				chatUser: true,
			}
		}));
	}
}