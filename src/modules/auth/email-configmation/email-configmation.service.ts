import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenType } from '@prisma/client';
import { ConfirmationDto } from './dto/confirmation.dto';
import { MailService } from 'src/libs/mail/mail.service';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class EmailConfigmationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  private async generateVerificationToken(email: string) {
    const token = uuidv4();
    const expiresIn = new Date(new Date().getTime() + 3600 * 1000);

    const existingToken = await this.prisma.token.findFirst({
      where: {
        email,
        type: TokenType.VERIFICATION,
      },
    });

    if (existingToken)
      await this.prisma.token.delete({
        where: {
          id: existingToken.id,
          type: TokenType.VERIFICATION,
        },
      });

    const verificationToken = await this.prisma.token.create({
      data: {
        email,
        token,
        expiresIn,
        type: TokenType.VERIFICATION,
      },
    });

    return verificationToken;
  }

  async newVerification(dto: ConfirmationDto) {
    const existingToken = await this.prisma.token.findUnique({
      where: {
        token: dto.token,
        type: TokenType.VERIFICATION,
      },
    });

    if (!existingToken)
      throw new NotFoundException(
        'Verification link is invalid or has already been used',
      );

    const isExpired = new Date(existingToken.expiresIn) < new Date();

    if (isExpired)
      throw new BadRequestException(
        'Verification link has expired. Please request a new confirmation email',
      );

    const existingUser = await this.userService.findByEmail(
      existingToken.email,
    );

    if (!existingUser)
      throw new NotFoundException(
        'Account associated with this email was not found',
      );

    if (existingUser.isVerified)
      throw new BadRequestException(
        'This email address has already been verified',
      );

    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        isVerified: true,
      },
    });

    await this.prisma.token.delete({
      where: { id: existingToken.id, type: TokenType.VERIFICATION },
    });

    return true;
  }

  async sendVerificationToken(email: string) {
    const verificationToken = await this.generateVerificationToken(email);

    await this.mailService.sendConfirmationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return true;
  }
}
