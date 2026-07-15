export type Seeder = { run(): Promise<void> };

export type SeedName = 'all' | 'role' | 'user' | 'exercise-source';
