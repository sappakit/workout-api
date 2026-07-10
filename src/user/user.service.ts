import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserProfile } from 'db/entities/auth';
import {
  CLOUDINARY_FOLDERS,
  CLOUDINARY_TRANSFORMATIONS,
} from 'src/cloudinary/cloudinary.constants';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { DataSource, Repository } from 'typeorm';
import { UpdateMyProfileDto } from './dto/user-body.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,

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

  async updateMyProfile(
    userId: number,
    dto: UpdateMyProfileDto,
    image?: Express.Multer.File,
  ) {
    if (image) {
      this.validateProfileImage(image);
    }

    const uploadedImage = image
      ? await this.cloudinaryService.uploadImage(
          image,
          CLOUDINARY_FOLDERS.PROFILE_IMAGES,
          CLOUDINARY_TRANSFORMATIONS.PROFILE_IMAGE,
        )
      : null;

    let oldImagePublicId: string | null | undefined = null;

    try {
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

        const profile = user.profile;

        oldImagePublicId = profile.image_public_id;

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

        profile.first_name = dto.firstName;
        profile.last_name = dto.lastName;
        profile.phone_number = dto.phoneNumber?.trim()
          ? dto.phoneNumber.trim()
          : null;

        if (uploadedImage) {
          profile.image_url = uploadedImage.secure_url;
          profile.image_public_id = uploadedImage.public_id;
        }

        await userProfileRepo.save(profile);
      });
    } catch (error) {
      // delete the newly uploaded image if profile update fails
      if (uploadedImage) {
        await this.cloudinaryService.tryDeleteImage(uploadedImage.public_id);
      }

      throw error;
    }

    // clean up old image after a successful update
    if (uploadedImage && oldImagePublicId) {
      await this.cloudinaryService.tryDeleteImage(oldImagePublicId);
    }

    return this.getMyProfile(userId);
  }

  private validateProfileImage(image: Express.Multer.File) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeInBytes = 5 * 1024 * 1024;

    if (!allowedMimeTypes.includes(image.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    if (image.size > maxSizeInBytes) {
      throw new BadRequestException('Profile image must be smaller than 5MB');
    }
  }
}
