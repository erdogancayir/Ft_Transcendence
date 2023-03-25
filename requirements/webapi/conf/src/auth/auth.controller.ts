import { Controller, Get, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, AuthDtoo, Intra, CodeDto, QrDto } from "./dto";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {
    }

    @Post('signup')
    signup(@Body() dto: AuthDto) {
        return (this.authService.signup(dto));
    }

    @Post('qrcode')
    qrCode(@Body() dto: QrDto) {
        return (this.authService.qrCode(dto));
    }

    @Post('Code')
    code(@Body() dto: CodeDto) {
        return (this.authService.code(dto));
    }
    
    @Post('signin')
    signin(@Body() dto: AuthDtoo) {
        return (this.authService.signin(dto));
    }

    @Post('signin_intra')
    signin_intra(@Body() intra: Intra) {
        if (!intra)
            return ('404NotFound');
        return (this.authService.signin_intra(intra));
    }

}
