import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async createIfNotExists(email: string, name: string, plainPassword: string): Promise<void> {
    const existing = await this.findByEmail(email);
    if (existing) return;
    const password = await bcrypt.hash(plainPassword, 10);
    await this.repo.save({ email, name, password });
  }
}
