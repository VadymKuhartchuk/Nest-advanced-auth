import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EmailConfigmationService } from './email-configmation.service';
import { ConfirmationDto } from './dto/confirmation.dto';

@Controller('auth/email-confirmation')
export class EmailConfigmationController {
  constructor(
    private readonly emailConfigmationService: EmailConfigmationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  newVerification(@Body() dto: ConfirmationDto) {
    return this.emailConfigmationService.newVerification(dto);
  }
}
