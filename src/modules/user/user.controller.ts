import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from './decorators/user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth()
  @Get('profile')
  findProfile(@CurrentUser('id') id: string) {
    return this.userService.findById(id);
  }

  @Auth(UserRole.ADMIN)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Auth(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Auth()
  @Patch('profile')
  updateProfile(@CurrentUser('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }
}
