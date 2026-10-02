import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}
  async verification(email: string, token: string): Promise<void> {
    const transport = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.getOrThrow<number>('SMTP_PORT'),
      secure: this.config.getOrThrow<boolean>('SMTP_SECURE'),
      requireTLS: this.config.get<string>('NODE_ENV') === 'production',
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.getOrThrow<string>('SMTP_USER'),
            pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
          }
        : undefined,
      connectionTimeout: 5000,
      socketTimeout: 10000,
    });
    try {
      await transport.sendMail({
        from: this.config.getOrThrow<string>('MAIL_FROM'),
        to: email,
        subject: 'Confirme seu e-mail — BreadCrumbs',
        text: `Confirme seu cadastro na BreadCrumbs usando este token:\n\n${token}\n\nEnvie-o em POST /api/v1/auth/verify-email, campo token. Ele expira em 30 minutos e só pode ser usado uma vez. Se não solicitou o cadastro, ignore esta mensagem.`,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível enviar o e-mail. Solicite o reenvio da confirmação.',
      );
    } finally {
      transport.close();
    }
  }
}
