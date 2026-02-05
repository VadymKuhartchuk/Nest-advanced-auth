import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from './libs/common/utils/is-dev.util';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './libs/mail/mail.module';
import { EmailConfigmationModule } from './modules/auth/email-configmation/email-configmation.module';
import { PasswordRecoveryModule } from './modules/auth/password-recovery/password-recovery.module';
import { TwoFactorAuthModule } from './modules/auth/two-factor-auth/two-factor-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: !IS_DEV_ENV,
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    PrismaModule,
    MailModule,
    EmailConfigmationModule,
    PasswordRecoveryModule,
    TwoFactorAuthModule,
  ],
})
export class AppModule {}
