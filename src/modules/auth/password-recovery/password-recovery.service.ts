import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TokenType } from '@prisma/client';
import { MailService } from 'src/libs/mail/mail.service';
import { UserService } from 'src/modules/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { hash } from 'argon2';

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  private async generateResetPasswordToken(email: string) {
    const token = uuidv4();
    const expiresIn = new Date(new Date().getTime() + 3600 * 1000);

    const existingToken = await this.prisma.token.findFirst({
      where: {
        email,
        type: TokenType.PASSWORD_RESET,
      },
    });

    if (existingToken)
      await this.prisma.token.delete({
        where: {
          id: existingToken.id,
          type: TokenType.PASSWORD_RESET,
        },
      });

    const resetPasswordToken = await this.prisma.token.create({
      data: {
        email,
        token,
        expiresIn,
        type: TokenType.PASSWORD_RESET,
      },
    });

    return resetPasswordToken;
  }

  async reset(dto: ResetPasswordDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (!existingUser)
      throw new NotFoundException(
        'Account associated with this password reset request was not found',
      );

    const resetPasswordToken = await this.generateResetPasswordToken(
      existingUser.email,
    );

    await this.mailService.sendResetPasswordEmail(
      resetPasswordToken.email,
      resetPasswordToken.token,
    );

    return true;
  }

  async newPassword(dto: NewPasswordDto, token: string) {
    const existingToken = await this.prisma.token.findFirst({
      where: {
        token,
        type: TokenType.PASSWORD_RESET,
      },
    });

    if (!existingToken)
      throw new NotFoundException(
        'Password reset link is invalid or has already been used',
      );

    const isExpired = new Date(existingToken.expiresIn) < new Date();

    if (isExpired)
      throw new BadRequestException(
        'Password reset link has expired. Please request a new one',
      );

    const existingUser = await this.userService.findByEmail(
      existingToken.email,
    );

    if (!existingUser)
      throw new NotFoundException(
        'Account associated with this password reset request was not found',
      );

    await this.prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        password: await hash(dto.password),
      },
    });

    await this.prisma.token.delete({
      where: {
        id: existingToken.id,
        type: TokenType.PASSWORD_RESET,
      },
    });

    return true;
  }
}
