import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PageQuery } from '../../common/dto/page.dto.js';
import type { UpdateProfileDto } from './users.dto.js';
import { UsersRepository } from './users.repository.js';
@Injectable()
export class UsersService {
  constructor(@Inject(UsersRepository) private readonly repo: UsersRepository) {}
  me(id: string) {
    return this.repo.me(id);
  }
  update(id: string, dto: UpdateProfileDto) {
    return this.repo.update(id, dto);
  }
  complete(id: string) {
    return this.repo.complete(id);
  }
  people(q: PageQuery) {
    return this.repo.people(q);
  }
  async profile(id: string) {
    const user = await this.repo.profile(id);
    if (!user) throw new NotFoundException('Perfil não encontrado.');
    return user;
  }
  async follow(from: string, to: string) {
    if (from === to.toLowerCase())
      throw new BadRequestException('Não é possível seguir a si mesmo.');
    await this.profile(to);
    await this.repo.follow(from, to);
  }
  unfollow(from: string, to: string) {
    return this.repo.unfollow(from, to);
  }
}
