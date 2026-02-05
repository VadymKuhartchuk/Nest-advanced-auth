import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TokenType } from '@prisma/client';
import { MailService } from 'src/libs/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private async generateTwoFactorToken(email: string) {
    const token = Math.floor(
      Math.random() * (1000000 - 100000) + 100000,
    ).toString();
    const expiresIn = new Date(new Date().getTime() + 300000);

    const existingToken = await this.prisma.token.findFirst({
      where: {
        email,
        type: TokenType.TWO_FACTOR,
      },
    });

    if (existingToken)
      await this.prisma.token.delete({
        where: {
          id: existingToken.id,
          type: TokenType.TWO_FACTOR,
        },
      });

    const twoFactorToken = await this.prisma.token.create({
      data: {
        email,
        token,
        expiresIn,
        type: TokenType.TWO_FACTOR,
      },
    });

    return twoFactorToken;
  }

  async validateTwoFactorToken(email: string, code: string) {
    const existingToken = await this.prisma.token.findFirst({
      where: {
        email,
        type: TokenType.TWO_FACTOR,
      },
    });

    if (!existingToken)
      throw new NotFoundException(
        'Two-factor authentication code is invalid or has expired',
      );

    if (existingToken.token !== code)
      throw new BadRequestException('Invalid two-factor authentication code');

    const isExpired = new Date(existingToken.expiresIn) < new Date();

    if (isExpired)
      throw new BadRequestException(
        'Two-factor authentication code has expired. Please request a new one',
      );

    await this.prisma.token.delete({
      where: { id: existingToken.id, type: TokenType.TWO_FACTOR },
    });

    return true;
  }

  async sendTwoFactorToken(email: string) {
    const verificationToken = await this.generateTwoFactorToken(email);

    await this.mailService.sendTwoFactorEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return true;
  }
}
