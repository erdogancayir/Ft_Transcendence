import { AuthDtoo } from './dto/auth.dto';
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto, Intra } from "./dto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { app } from "../main"
import { QrDto, CodeDto } from './dto';

@Injectable({})
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) { }

    async signup(dto: AuthDto) {
        try {
            const user: string | any = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash: dto.hash,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    userName: dto.userName,
                },
            });

            user.winCount = 0;
            user.lossCount = 0;
            return "success";
        }
        catch (error) {
            if (error.code === "P2002")
                return ("Mail Duplicate!");
            return ("Unknown Error!");
        }
    }
    async signin(dto: AuthDtoo) {
        const user: string | any = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        if (!user || user.hash != dto.hash)
            return ("Wrong Email Or Password!");
        return await this.signToken(user.id, user.email, user.firstName, user.lastName, user.userName, user.winCount, user.lossCount);
    }
    async qrCode(dto: QrDto): Promise<{secret: string, qrData: string}> {
        var speakesay = require('speakeasy');
        var qrcode = require('qrcode');
        var secret = speakesay.generateSecret({
            name: "Dis"
        })
        var _obje = {
            secret: "",
            qrData: "",
        };
        _obje.secret = secret.ascii;
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
    async code(dto: CodeDto) : Promise<string> {
            var speakeasy = require('speakeasy');
            var verified = speakeasy.totp.verify({
                secret: dto.secret,
                encoding: dto.encoding,
                token: dto.code
            })
        return (verified);
    }

    /*
    code: frontend dönen token
    uid: u-s4t2ud-676a2e6abf41dd2cb239be2dbeaa4e5fd13f9e6d24f05d328da83b20cde05cf0
    secret: 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
    collback_url: http://localhost:8080/singIn

    token alma:
    curl -F grant_type=authorization_code \
    -F client_id=u-s4t2ud-676a2e6abf41dd2cb239be2dbeaa4e5fd13f9e6d24f05d328da83b20cde05cf0 \
    -F client_secret=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 \
    -F code=<frontend_dönen_token> \
    -F redirect_uri=http://localhost:8080/singIn \
    -X POST https://api.intra.42.fr/oauth/token

    bilgi alma:
    curl -H "Authorization: Bearer <ilk_istekten_dönen_token>" https://api.intra.42.fr/v2/me
    */

    async signin_intra(intra: Intra) {
        const form = new FormData();
        form.append('grant_type', 'authorization_code');
        form.append('client_id', process.env.INTRA_UID as string);
        form.append('client_secret', process.env.INTRA_SECRET as string);
        form.append('code', intra.code);
        form.append('redirect_uri', process.env.INTRA_REDIRECT_URI as string);

        const responseToken = await fetch('https://api.intra.42.fr/oauth/token', {
            method: 'POST',
            body: form
        });
        const dataToken = await responseToken.json();

        const responseInfo = await fetch('https://api.intra.42.fr/v2/me', {
            headers: {
                'Authorization': 'Bearer ' + dataToken.access_token
            }
        });
        const dataInfo = await responseInfo.json();
        
        // dataInfo içinden istenilen datalar çekilebilir
        var dto: AuthDto = {
            email: dataInfo.email,
            hash: process.env.BACKEND_GENERAL_SECRET_KEY as string,
            firstName: dataInfo.first_name,
            lastName: dataInfo.last_name,
            userName: dataInfo.login
        }

        var firstSingIn = false;
        var user: string | any = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        if (!user) {
            await this.signup(dto);

            user = await this.prisma.user.findUnique({
                where: {
                    email: dto.email,
                },
            });
            firstSingIn = true;
        }


        const jwtToken = await this.signToken(user.id, user.email, user.firstName, user.lastName, user.userName, user.winCount, user.lossCount);
        if (firstSingIn) {
            await fetch( process.env.BACKEND_URL + "/users/uploadImageWithUrl?link=" + dataInfo.image.link, {
                method: "POST",
                headers: {
                    'Authorization': 'Bearer ' + jwtToken
                }
            });
        }
        return jwtToken;
    }

    async signToken(
        userId: number,
        email: string,
        firstName: string,
        lastName: string,
        userName: string,
        winCount: number,
        lossCount: number,
    ): Promise<string> {
        const payload = {
            id: userId,
            email: email,
            firstName: firstName,
            lastName: lastName,
            userName: userName,
            winCount: winCount,
            lossCount: lossCount,
        };
        const secret = await this.config.get('JWT_SECRET');
        const token = await this.jwt.signAsync(
            payload,
            {
                expiresIn: '45m',
                secret: secret,
            }
        );
        return token;
    }
}


