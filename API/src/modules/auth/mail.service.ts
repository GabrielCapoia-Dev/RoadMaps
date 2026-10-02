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
        text: this.message(token),
        html: `<p>Confirme seu cadastro na BreadCrumbs:</p><p><a href="${this.url(token)}">Confirmar meu e-mail</a></p><p>O link expira em 30 minutos e só pode ser usado uma vez. Se você não solicitou o cadastro, ignore esta mensagem.</p>`,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível enviar o e-mail. Solicite o reenvio da confirmação.',
      );
    } finally {
      transport.close();
    }
  }
  private url(token: string): string {
    return `${this.config.getOrThrow<string>('PUBLIC_APP_URL')}/confirmar-email?token=${encodeURIComponent(token)}`;
  }
  private message(token: string): string {
    return `Confirme seu cadastro na BreadCrumbs acessando este link:\n\n${this.url(token)}\n\nO link expira em 30 minutos e só pode ser usado uma vez. Se você não solicitou o cadastro, ignore esta mensagem.`;
  }
}
