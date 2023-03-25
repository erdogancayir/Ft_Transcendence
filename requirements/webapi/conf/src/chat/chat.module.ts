import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ChatService } from './chat.service';
import { Module } from "@nestjs/common";
import { prismaFunc } from './prismafunc';
import { UserModule } from 'src/user/user.module';

@Module({
    providers: [ChatService, JwtStrategy, ConfigService, prismaFunc],
    controllers: [],
    imports: [UserModule]
})
export class ChatModule {}