import { Injectable, UnauthorizedException} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { TokenExpiredError } from 'jsonwebtoken';



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt2',)
{
	
    constructor(config : ConfigService, private prisma : PrismaService)
    {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
				(req: any) => {
				  return req.handshake.headers.authorization;
				}]),
            secretOrKey: config.get('JWT_SECRET'),
          });
    }

    async validate(
      payload: {
        userId: number,
        email: string,
        firstName: string,
        lastName: string,
      }
    ): Promise<string> {
      try {
        if (!payload.email) {
          return 'fail!';
        }
  
        const user: any = await this.prisma.user.findUnique({
          where: {
            email: payload.email
          }
        });
        delete user.hash;
        return user;
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          // JWT token expiration süresi dolmuş
          throw new UnauthorizedException('Token expired');
        } else {
          // JWT doğrulama başarısız
          throw new UnauthorizedException('Unauthorized');
        }
      }
    }
}

