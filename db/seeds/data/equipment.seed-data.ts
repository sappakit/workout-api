import { Equipment } from 'db/entities/workout/shared/equipment.entity';
import { EquipmentCategory } from 'src/workout/enums/workout.enum';
import { SEED_ACTOR } from '../types/seed.types';

type EquipmentSeedData = Pick<
  Equipment,
  'code' | 'name' | 'category' | 'created_by' | 'updated_by'
>;

export const EQUIPMENT_SEED_DATA = [
  {
    code: 'resistance-band',
    name: 'Resistance Band',
    category: EquipmentCategory.RESISTANCE,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'barbell',
    name: 'Barbell',
    category: EquipmentCategory.FREE_WEIGHT,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'body-only',
    name: 'Body Only',
    category: EquipmentCategory.BODYWEIGHT,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'cable',
    name: 'Cable',
    category: EquipmentCategory.CABLE,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'dumbbell',
    name: 'Dumbbell',
    category: EquipmentCategory.FREE_WEIGHT,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'exercise-ball',
    name: 'Exercise Ball',
    category: EquipmentCategory.STABILITY,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'ez-curl-bar',
    name: 'EZ Curl Bar',
    category: EquipmentCategory.FREE_WEIGHT,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'foam-roller',
    name: 'Foam Roller',
    category: EquipmentCategory.RECOVERY,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'kettlebell',
    name: 'Kettlebell',
    category: EquipmentCategory.FREE_WEIGHT,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'machine',
    name: 'Machine',
    category: EquipmentCategory.MACHINE,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'medicine-ball',
    name: 'Medicine Ball',
    category: EquipmentCategory.FREE_WEIGHT,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
  {
    code: 'other',
    name: 'Other Equipment',
    category: EquipmentCategory.OTHER,
    created_by: SEED_ACTOR,
    updated_by: SEED_ACTOR,
  },
] satisfies EquipmentSeedData[];
