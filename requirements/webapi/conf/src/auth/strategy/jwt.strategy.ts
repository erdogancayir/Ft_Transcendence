import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt',)
{
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: {
    userId: number,
    email: string,
    firstName: string,
    lastName: string,
    userName: string,
  }): Promise<string> {
    const user: any =
      await this.prisma.user.findUnique({
        where: {
          email: payload.email,
        },
      });
    delete user.hash;
    return user;
  }
}
