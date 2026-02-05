import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { isDev } from 'src/libs/common/utils/is-dev.util';

export const getMailerConfig = (config: ConfigService): MailerOptions => ({
  transport: {
    host: config.getOrThrow<string>('MAIL_HOST'),
    port: config.getOrThrow<string>('MAIL_PORT'),
    secure: !isDev(config),
    auth: isDev(config)
      ? undefined
      : {
          user: config.getOrThrow<string>('MAIL_USER'),
          pass: config.getOrThrow<string>('MAIL_PASSWORD'),
        },
  },
  defaults: {
    from: `"Nest Auth" ${config.getOrThrow<string>('MAIL_USER')}`,
  },
});
