import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserProfile } from 'db/entities/auth';
import { DataSource, Repository } from 'typeorm';
import { UpdateMyProfileDto } from './dto/user-body.dto';

@Injectable()
export class UserService {
  constructor(
    private dataSource: DataSource,

    // Repository
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
  ) {}

  async getMyProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMyProfile(userId: number, dto: UpdateMyProfileDto) {
    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const userProfileRepo = manager.getRepository(UserProfile);

      const user = await userRepo.findOne({
        where: { id: userId },
        relations: {
          profile: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update user
      if (dto.email !== user.email) {
        const existingUser = await userRepo.findOne({
          where: { email: dto.email },
          select: {
            id: true,
          },
        });

        if (existingUser && existingUser.id !== user.id) {
          throw new ConflictException('Email is already in use');
        }

        user.email = dto.email;
      }

      await userRepo.save(user);

      // Update user profile
      const profile = user.profile;

      profile.first_name = dto.firstName;
      profile.last_name = dto.lastName;
      profile.phone_number = dto.phoneNumber?.trim()
        ? dto.phoneNumber.trim()
        : null;

      await userProfileRepo.save(profile);
    });

    return this.getMyProfile(userId);
  }
}
