import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository.js';
import { MailService } from './mail.service.js';
import { checkPassword, hashPassword, newToken, tokenHash } from './credentials.js';
import type { LoginDto, RegisterDto } from './auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AuthRepository) private readonly repo: AuthRepository,
    @Inject(MailService) private readonly mail: MailService,
  ) {}
  async register(dto: RegisterDto) {
    const account = await this.repo.register(
      dto.email,
      dto.name.trim(),
      await hashPassword(dto.password),
    );
    if (account) await this.sendVerification(account.id, account.email);
    return this.message();
  }
  async resend(email: string) {
    const account = await this.repo.byEmail(email);
    if (account && !account.verified_at) await this.sendVerification(account.id, account.email);
    return this.message();
  }
  private message() {
    return {
      message:
        'Se a conta precisar de confirmação, você receberá um e-mail. Também é possível solicitar reenvio.',
    };
  }
  private async sendVerification(id: string, email: string) {
    const token = newToken();
    await this.repo.verification(id, tokenHash(token));
    await this.mail.verification(email, token);
  }
  async verify(token: string) {
    if (!(await this.repo.verify(tokenHash(token))))
      throw new BadRequestException('Token inválido ou expirado.');
    return { message: 'E-mail confirmado.' };
  }
  async login(dto: LoginDto) {
    const account = await this.repo.byEmail(dto.email);
    if (!(await checkPassword(dto.password, account?.password_hash)) || !account)
      throw new UnauthorizedException('Credenciais inválidas.');
    if (!account.verified_at) throw new ForbiddenException('Confirme seu e-mail antes de entrar.');
    const token = newToken();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.repo.session(account.id, tokenHash(token), expires);
    return { accessToken: token, tokenType: 'Bearer', expiresAt: expires.toISOString() };
  }
  async logout(hash: string) {
    await this.repo.logout(hash);
  }
}
