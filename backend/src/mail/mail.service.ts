import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationCode(email: string, code: string): Promise<void> {
    this.logger.log(`Verification code for ${email}: ${code}`);
    await this.send(email, 'Код подтверждения email', `Ваш код подтверждения: ${code}`);
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    this.logger.log(`Password reset code for ${email}: ${code}`);
    await this.send(
      email,
      'Код восстановления пароля',
      `Ваш код для сброса пароля: ${code}. Если вы не запрашивали восстановление, проигнорируйте это письмо.`,
    );
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
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

      await transporter.sendMail({ from, to, subject, text });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${(error as Error).message}`,
      );
    }
  }
}
