import { Module } from '@nestjs/common';
import { EmailConfigmationService } from './email-configmation.service';
import { EmailConfigmationController } from './email-configmation.controller';
import { MailModule } from 'src/libs/mail/mail.module';
import { UserModule } from 'src/modules/user/user.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserService } from 'src/modules/user/user.service';

@Module({
  imports: [MailModule, UserModule, PrismaModule],
  controllers: [EmailConfigmationController],
  providers: [EmailConfigmationService, UserService],
  exports: [EmailConfigmationService],
})
export class EmailConfigmationModule {}
