import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { verify } from 'argon2';
import { AuthMethod } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailConfigmationService } from './email-configmation/email-configmation.service';
import { TwoFactorAuthService } from './two-factor-auth/two-factor-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailConfigmationService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  async register(dto: RegisterDto) {
    const isExists = await this.userService.findByEmail(dto.email);

    if (isExists) throw new ConflictException('Bad credentials');

    const user = await this.userService.create(dto);

    await this.emailService.sendVerificationToken(user.email);

    return { user };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) throw new UnauthorizedException('Invalid email or password');

    if (!user.password) {
      throw new UnauthorizedException('Password not set');
    }

    const isValid = await verify(user.password, dto.password);

    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    if (!user.isVerified) {
      await this.emailService.sendVerificationToken(user.email);
      throw new UnauthorizedException(
        'Email is not verified. Confirm email and try again',
      );
    }

    if (user.isTwoFactorEnabled) {
      if (!dto.code) {
        await this.twoFactorAuthService.sendTwoFactorToken(user.email);

        throw new UnauthorizedException(
          'Two-factor code required. Check your email.',
        );
      }

      await this.twoFactorAuthService.validateTwoFactorToken(
        user.email,
        dto.code,
      );
    }

    const tokens = await this.generateTokens(user.id, user.role);

    await this.userService.setRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async getNewTokens(userId: string, refreshToken: string) {
    const user = await this.userService.findById(userId);

    const isValid = await this.userService.validateRefreshToken(
      user.id,
      refreshToken,
    );
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.generateTokens(user.id, user.role);

    await this.userService.setRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async clearUserRefreshToken(userId: string) {
    await this.userService.clearRefreshToken(userId);
  }

  async oauthLogin(user: {
    email: string;
    providerId: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    method: AuthMethod;
  }) {
    let finalUser = await this.userService.findByEmail(user.email);

    if (finalUser && finalUser.method === AuthMethod.CREDENTIALS) {
      throw new ConflictException(
        'This email is registered with email/password login',
      );
    }

    if (!finalUser) {
      finalUser = await this.prisma.user.create({
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          picture: user.picture,
          password: null,
          providerId: user.providerId,
          method: user.method,
          isVerified: true,
        },
      });
    }

    const tokens = await this.generateTokens(finalUser.id, finalUser.role);
    await this.userService.setRefreshToken(finalUser.id, tokens.refreshToken);

    return {
      user: finalUser,
      ...tokens,
    };
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role: role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }
}
