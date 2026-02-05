import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Request, Response } from 'express';
import { IS_DEV_ENV } from 'src/libs/common/utils/is-dev.util';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import { Auth } from './decorators/auth.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Recaptcha } from '@nestlab/google-recaptcha';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Recaptcha()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    await this.authService.register(dto);

    return {
      message: 'Confirmation email sent',
    };
  }

  @Recaptcha()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { user, accessToken };
  }

  @Auth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request & { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.clearRefreshTokenCookie(res);
    await this.authService.clearUserRefreshToken(req.user.id);
  }

  @Post('refresh')
  @UseGuards(RefreshJwtGuard)
  async refresh(
    @Req() req: Request & { user: { id: string; refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.getNewTokens(req.user.id, req.user.refreshToken);
    this.setRefreshTokenCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('oauth/callback/google')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.oauthLogin(
      req.user,
    );

    this.setRefreshTokenCookie(res, refreshToken);

    return res.redirect(
      `${this.config.get('FRONTEND_URL')}/oauth-success?token=${accessToken}`,
    );
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie(this.config.getOrThrow('REFRESH_COOKIE_NAME'), refreshToken, {
      httpOnly: true,
      secure: !IS_DEV_ENV,
      sameSite: this.config.getOrThrow('REFRESH_COOKIE_SAMESITE'),
      path: this.config.getOrThrow('REFRESH_COOKIE_PATH'),
      maxAge: +this.config.getOrThrow('REFRESH_COOKIE_MAX_AGE'),
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie(this.config.getOrThrow('REFRESH_COOKIE_NAME'), {
      httpOnly: true,
      secure: !IS_DEV_ENV,
      sameSite: this.config.getOrThrow('REFRESH_COOKIE_SAMESITE'),
      path: this.config.getOrThrow('REFRESH_COOKIE_PATH'),
    });
  }
}
