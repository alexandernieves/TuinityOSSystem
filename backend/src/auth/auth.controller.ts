import { Controller, Post, Body, UnauthorizedException, Get, Req, UseGuards, Ip, Headers, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    @Post('login')
    async login(
        @Body() loginDto: any,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
    ) {
        console.log('[AUTH] Login Attempt Start');
        console.log(`[AUTH] Email: ${loginDto.email}`);
        
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        
        if (!user) {
            console.log(`[AUTH] Login Failed: Invalid credentials for ${loginDto.email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        console.log(`[AUTH] Login Success: User ${user.email} validated`);
        const result = await this.authService.login(user, ip, userAgent);
        console.log(`[AUTH] Session Created: ID ${result.user.sessionId}`);
        
        return result;
    }

    @Post('register')
    async register(@Body() registerDto: any) {
        return this.authService.register(registerDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Req() req: any) {
        return this.authService.logout(req.user.sessionId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout/:sessionId')
    async logoutSession(@Req() req: any, @Param('sessionId') sessionId: string) {
        // Option: Check if user has permission to close other sessions
        // For now, let's keep it simple or check if it's their own or they are admin
        return this.authService.logout(sessionId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('sessions')
    async getSessions(@Req() req: any) {
        return this.authService.getActiveSessions(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout-all')
    async logoutAll(@Req() req: any) {
        await this.authService.invalidateAllUserSessions(req.user.sub);
        return { message: 'All sessions closed' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMe(@Req() req: any) {
        // req.user has the JWT payload. We want the full user from DB
        const user = await this.authService.getFullUser(req.user.sub);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }
}
