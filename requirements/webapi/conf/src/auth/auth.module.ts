import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategy";

@Module({
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy], 
    imports: [JwtModule.register({})],
})
export class AuthModule{}