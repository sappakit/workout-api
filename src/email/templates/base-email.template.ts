interface BaseEmailTemplateParams {
  title: string;
  previewText?: string;
  logoUrl: string;
  children: string;
}

export const emailColors = {
  brand: '#EF6131',
  brandDark: '#BF4F28',
  background: '#F1F1F1',
  cardPrimary: '#FFFFFF',
  textAccent: '#2D2D2D',
  textPrimary: '#323232',
  textMuted: '#7A7A7A',
  borderPrimary: '#D3D3D3',
  white: '#FFFFFF',
};

export function baseEmailTemplate({
  title,
  previewText,
  logoUrl,
  children,
}: BaseEmailTemplateParams) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>

    <body style="margin:0;padding:0;background:${emailColors.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      ${
        previewText
          ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>`
          : ''
      }

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${emailColors.background};padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background:${emailColors.cardPrimary};border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
              <tr>
                <td align="center" style="padding:48px 40px;">
                  <img src="${logoUrl}" width="200" alt="NextRep" style="display:block;margin:0 auto 28px;" />

                  ${children}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
