import { baseEmailTemplate, emailColors } from './base-email.template';

interface PasswordResetTemplateParams {
  resetUrl: string;
  expiresInMinutes: number;
  logoUrl: string;
}

export function passwordResetTemplate({
  resetUrl,
  expiresInMinutes,
  logoUrl,
}: PasswordResetTemplateParams) {
  return baseEmailTemplate({
    title: 'Reset your password',
    previewText: 'Reset your NextRep password.',
    logoUrl,
    children: `
      <h1 style="margin:0;font-size:26px;color:${emailColors.textAccent};font-weight:700;text-align:center;">
        Reset your password
      </h1>

      <p style="margin:16px 0 0;color:${emailColors.textMuted};line-height:1.7;font-size:15px;text-align:center;">
        We received a request to reset the password for your <strong style="color:${emailColors.textPrimary};">NextRep</strong> account.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0;">
        <tr>
          <td bgcolor="${emailColors.brand}" style="border-radius:10px;text-align:center;">
            <a href="${resetUrl}" style="display:block;padding:15px 24px;color:${emailColors.white};text-decoration:none;font-weight:700;font-size:15px;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>

      <p style="color:${emailColors.textMuted};line-height:1.7;font-size:14px;margin:0;text-align:center;">
        This link expires in <strong style="color:${emailColors.textPrimary};">${expiresInMinutes} minutes</strong>.
      </p>

      <p style="color:${emailColors.textMuted};line-height:1.7;font-size:14px;margin:18px 0 0;text-align:center;">
        If you didn't request this, you can safely ignore this email.
      </p>

      <p style="margin:28px 0 0;color:${emailColors.textMuted};font-size:12px;line-height:1.6;text-align:center;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p style="margin:10px 0 0;word-break:break-all;font-size:12px;line-height:1.6;color:${emailColors.brandDark};text-align:center;">
        ${resetUrl}
      </p>
    `,
  });
}
