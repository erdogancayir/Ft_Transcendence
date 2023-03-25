import { Module } from '@nestjs/common';
import { JwtStrategy } from 'src/auth/strategy';
import { UserController } from './user.controller';
import { UserStates } from './user.states';

@Module({
    controllers: [UserController],
    providers: [JwtStrategy, UserStates],
    exports: [UserStates],
})
export class UserModule { }
