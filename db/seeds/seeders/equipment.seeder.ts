import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equipment } from 'db/entities/workout';
import { Repository } from 'typeorm';
import { EQUIPMENT_SEED_DATA } from '../data/equipment.seed-data';
import { runUpsertSeed } from '../utils/seed.util';

@Injectable()
export class EquipmentSeeder {
  private readonly logger = new Logger(EquipmentSeeder.name);

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

  async run(): Promise<void> {
    await runUpsertSeed({
      repository: this.equipmentRepo,
      data: EQUIPMENT_SEED_DATA,
      conflictPaths: ['code'],
      entityName: 'equipment records',
      logger: this.logger,
    });
  }
}
