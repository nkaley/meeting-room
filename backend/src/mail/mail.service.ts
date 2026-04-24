import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationCode(email: string, code: string): Promise<void> {
    this.logger.log(`Verification code for ${email}: ${code}`);

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 465);
    const secure = String(process.env.SMTP_SECURE ?? 'true') === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    const isConfigured =
      host &&
      user &&
      pass &&
      from &&
      user !== 'your-mail@yandex.ru' &&
      pass !== 'your-password';

    if (!isConfigured) {
      this.logger.warn(
        'SMTP is not configured or using default placeholders, skipping real email send',
      );
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from,
        to: email,
        subject: 'Код подтверждения email',
        text: `Ваш код подтверждения: ${code}`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${(error as Error).message}`,
      );
    }
  }
}
