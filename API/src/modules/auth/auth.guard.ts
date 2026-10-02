import {
  createParamDecorator,
  type ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  type CanActivate,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthRepository } from './auth.repository.js';
import { tokenHash } from './credentials.js';

export const Public = () => SetMetadata('publicRoute', true);
export interface Principal {
  id: string;
  sessionHash: string;
}
export type AuthRequest = Request & { principal?: Principal };
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Principal => {
    const principal = ctx.switchToHttp().getRequest<AuthRequest>().principal;
    if (!principal) throw new UnauthorizedException();
    return principal;
  },
);
export const OptionalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Principal | undefined =>
    ctx.switchToHttp().getRequest<AuthRequest>().principal,
);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AuthRepository) private readonly repo: AuthRepository,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const header = req.headers.authorization;
    if (header) {
      const match = /^Bearer ([a-f0-9]{64})$/i.exec(header);
      if (!match?.[1]) throw new UnauthorizedException('Sessão inválida.');
      const hash = tokenHash(match[1]);
      const user = await this.repo.authenticate(hash);
      if (!user) throw new UnauthorizedException('Sessão inválida ou expirada.');
      req.principal = { id: user.id, sessionHash: hash };
      return true;
    }
    if (
      this.reflector.getAllAndOverride<boolean>('publicRoute', [ctx.getHandler(), ctx.getClass()])
    )
      return true;
    throw new UnauthorizedException();
  }
}
