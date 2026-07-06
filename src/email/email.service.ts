import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { passwordResetTemplate } from './templates/password-reset.template';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly brandLogoUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');

    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.getOrThrow<string>('RESEND_FROM_EMAIL');
    this.brandLogoUrl = this.configService.getOrThrow<string>('BRAND_LOGO_URL');
  }

  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    options: { expiresInMinutes: number },
  ) {
    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Reset your password',
      html: passwordResetTemplate({
        resetUrl,
        expiresInMinutes: options.expiresInMinutes,
        logoUrl: this.brandLogoUrl,
      }),
    });

    if (error) {
      throw new InternalServerErrorException('Failed to send reset email');
    }
  }
}
