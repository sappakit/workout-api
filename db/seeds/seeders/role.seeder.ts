import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'db/entities/auth/role.entity';
import { Repository } from 'typeorm';
import { ROLE_SEED_DATA } from '../data/auth.seed-data';
import { runUpsertSeed } from '../utils/seed.util';

@Injectable()
export class RoleSeeder {
  private readonly logger = new Logger(RoleSeeder.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async run(): Promise<void> {
    await runUpsertSeed({
      repository: this.roleRepo,
      data: ROLE_SEED_DATA,
      conflictPaths: ['code'],
      entityName: 'roles',
      logger: this.logger,
    });
  }
}
