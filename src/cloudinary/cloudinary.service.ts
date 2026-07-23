import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'node:stream';
import {
  CLOUDINARY_FOLDERS,
  CLOUDINARY_TRANSFORMATIONS,
} from './cloudinary.constants';

type UploadLocalImageOptions = {
  folder: CLOUDINARY_FOLDERS;
  publicId: string;
  displayName?: string;
  transformation?: CLOUDINARY_TRANSFORMATIONS;
  overwrite?: boolean;
};

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: CLOUDINARY_FOLDERS,
    transformation: CLOUDINARY_TRANSFORMATIONS,
  ): Promise<UploadApiResponse> {
    try {
      return await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder,
            transformation,
          },
          (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(new Error('Cloudinary upload failed'));
              return;
            }

            resolve(result);
          },
        );

        Readable.from(file.buffer).pipe(uploadStream);
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);

      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async uploadLocalImage(
    filePath: string,
    options: UploadLocalImageOptions,
  ): Promise<UploadApiResponse> {
    try {
      return await cloudinary.uploader.upload(filePath, {
        resource_type: 'image',
        folder: options.folder,
        public_id: options.publicId,
        display_name: options.displayName,
        overwrite: options.overwrite ?? true,
        invalidate: true,
        transformation: options.transformation,
      });
    } catch (error) {
      console.error('Cloudinary local image upload error:', {
        filePath,
        publicId: options.publicId,
        error,
      });

      throw new InternalServerErrorException(
        `Failed to upload local image: ${filePath}`,
      );
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        console.warn('Cloudinary delete warning:', {
          publicId,
          result,
        });
      }
    } catch (error) {
      console.error('Cloudinary delete error:', {
        publicId,
        error,
      });

      throw new InternalServerErrorException('Failed to delete image');
    }
  }

  async tryDeleteImage(publicId?: string | null): Promise<void> {
    if (!publicId) return;

    try {
      await this.deleteImage(publicId);
    } catch (error) {
      console.error('Cloudinary cleanup failed:', {
        publicId,
        error,
      });
    }
  }
}
