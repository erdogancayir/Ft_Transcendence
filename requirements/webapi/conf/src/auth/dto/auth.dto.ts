import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    hash: string;

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

export class Intra {
    @IsString()
    @IsNotEmpty()
    code: string;
}

export class AuthDtoo {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    hash: string;
}


export class CodeDto {
    @IsString()
    @IsNotEmpty()
    secret: string;

    @IsString()
    @IsNotEmpty()
    encoding: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}

export class QrDto {
    @IsString()
    @IsNotEmpty()
    code: string;
}