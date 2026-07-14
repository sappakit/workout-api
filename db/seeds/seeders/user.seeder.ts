import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';
import { USER_SEED_DATA } from '../data/auth.seed-data';

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);
  private readonly seedPassword: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.seedPassword =
      this.configService.getOrThrow<string>('SEED_USER_PASSWORD');
  }

  async run(): Promise<void> {
    let createdCount = 0;
    let skippedCount = 0;

    for (const seedUser of USER_SEED_DATA) {
      const username = seedUser.username.trim();
      const email = seedUser.email.trim().toLowerCase();

      try {
        await this.authService.createUser({
          username,
          email,
          password: this.seedPassword,
          roleCode: seedUser.roleCode,
          firstName: seedUser.profile.first_name,
          lastName: seedUser.profile.last_name,
        });

        createdCount++;

        this.logger.log(`Created user: ${username}`);
      } catch (error) {
        if (error instanceof ConflictException) {
          skippedCount++;

          this.logger.warn(
            `Skipped existing user "${username}": ${error.message}`,
          );

          continue;
        }

        throw error;
      }
    }

    this.logger.log(
      `User seed completed: ${createdCount} created, ${skippedCount} skipped`,
    );
  }
}
