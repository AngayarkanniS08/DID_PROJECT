import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() signInDto: Record<string, any>) {
        return this.authService.signIn(signInDto.email, signInDto.password);
    }

    // 🚨 TEMPORARY SEED ROUTE — hit GET /api/auth/seed once to create admin
    @Get('seed')
    async seedAdmin() {
        return this.authService.seedInitialAdmin();
    }
}
