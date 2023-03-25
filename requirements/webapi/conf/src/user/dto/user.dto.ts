import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserDto {

    id: number;
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    userName: string;
}

export class stateDto {
    @IsBoolean()
    @IsNotEmpty()
    state: boolean;
}