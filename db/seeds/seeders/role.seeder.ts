import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'db/entities/auth';
import { Repository } from 'typeorm';
import { ROLE_SEED_DATA } from '../data/auth.seed-data';

@Injectable()
export class RoleSeeder {
  private readonly logger = new Logger(RoleSeeder.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async run(): Promise<void> {
    await this.roleRepo.upsert(ROLE_SEED_DATA, {
      conflictPaths: ['code'],
      skipUpdateIfNoValuesChanged: true,
    });

    this.logger.log(`Seeded ${ROLE_SEED_DATA.length} roles`);
  }
}
