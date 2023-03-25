import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class socketDto {
	@IsNotEmpty()
	State: number;

	@IsNotEmpty()
	Bearer: string;

	@IsNotEmpty()
	RoomName: string;

	@IsNotEmpty()
	RoomPass: string;
}

export class RoomsOnChatUsersDto {
	ChatRoomId: number;

	chatUserId: number;

	power: number;
}

export class ChatRoomDto {
	@IsNumber()
	@IsNotEmpty()
	id: number;

	@IsString()
	@IsNotEmpty()
	roomName: string;

	@IsString()
	roomPass?: string | any;

	@IsNotEmpty()
	@IsNumber()
	roomOwnerId: number;

	chatUsers: RoomsOnChatUsersDto[];
}

export class ChatUserDto {
	@IsNumber()
	@IsNotEmpty()
	id: number;

	@IsNotEmpty()
	@IsBoolean()
	isActive: boolean;

	power: number;

	chatRooms: RoomsOnChatUsersDto[];
}