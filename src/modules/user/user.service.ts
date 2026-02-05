import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, verify } from 'argon2';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('Bad credentials');

    return user;
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: RegisterDto) {
    return await this.prisma.user.create({
      data: {
        email: dto.email,
        password: await hash(dto.password),
        method: 'CREDENTIALS',
      },
    });
  }

  async setRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: await hash(refreshToken) },
    });
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.findById(userId);
    if (!user.refreshToken) return false;
    return await verify(user.refreshToken, refreshToken);
  }

  async clearRefreshToken(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { ...dto },
    });
  }
}
