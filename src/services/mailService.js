import nodemailer from 'nodemailer';

/**
 * Gmail SMTP orqali xat yuborish transporteri
 * 100% Bepul - Google hisobidagi "App Password" (Ilova paroli) orqali ishlaydi.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_APP_PASSWORD
    }
  });
};

/**
 * Chiroyli va zamonaviy HTML email shabloni (O'zbek tilida)
 */
const getVerificationEmailTemplate = (otpCode) => {
  return `
  <!DOCTYPE html>
  <html lang="uz">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduHub - Emailni Tasdiqlash</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">
            
            <!-- HEADER LOGO -->
            <tr>
              <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                  Edu<span style="color: #cbd5e1;">Hub</span>
                </h1>
                <p style="margin: 4px 0 0 0; color: #e0e7ff; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                  Online Academy
                </p>
              </td>
            </tr>

            <!-- BODY CONTENT -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
                  Elektron pochtangizni tasdiqlang
                </h2>
                <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                  Assalomu alaykum! <b>EduHub</b> ta'lim platformasiga xush kelibsiz. Ro'yxatdan o'tishni yakunlash va profilingizni faollashtirish uchun quyidagi 6 xonali tasdiqlash kodidan foydalaning:
                </p>

                <!-- OTP CODE BOX -->
                <div style="background-color: #eef2ff; border: 2px dashed #6366f1; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
                  <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #4338ca; display: inline-block;">
                    ${otpCode}
                  </span>
                </div>

                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                    ⏳ <b>Eslatma:</b> Ushbu bir martalik tasdiqlash kodi <b>15 daqiqa</b> davomida amal qiladi.
                  </p>
                </div>

                <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                  Agar siz EduHub platformasida ro'yxatdan o'tishni so'ramagan bo'lsangiz, ushbu xatni shunchaki e'tiborsiz qoldiring. Hisobingiz xavfsiz holatda qoladi.
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} EduHub Platformasi. Barcha huquqlar himoyalangan.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

/**
 * 6 xonali tasdiqlash kodini yuboruvchi asosiy funksiya
 */
export const sendVerificationEmail = async (toEmail, otpCode) => {
  const hasSmtpConfig = process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD;

  // Agar SMTP konfiguratsiya hali kiritilmagan bo'lsa, konsolga chiqarish (Development qulayligi)
  if (!hasSmtpConfig) {
    console.log('\n======================================================');
    console.log(`[SMTP ESPOILATMASI] .env faylida SMTP_EMAIL yoki SMTP_APP_PASSWORD kiritilmagan.`);
    console.log(`[EMAIL VERIFICATION OTP] ${toEmail} uchun tasdiqlash kodi: >>> ${otpCode} <<<`);
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"EduHub Academy" <${process.env.SMTP_EMAIL}>`,
      to: toEmail,
      subject: `EduHub - Tasdiqlash kodi: ${otpCode}`,
      html: getVerificationEmailTemplate(otpCode)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Xat muvaffaqiyatli jo'natildi: ${toEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Error] Xat yuborishda xatolik (${toEmail}):`, error.message);
    // Xatolik yuz berganda ham OTP ni konsolga chiqarish (foydalanuvchi bloklanib qolmasligi uchun)
    console.log(`[EMAIL VERIFICATION OTP ZAXIRA] ${toEmail} uchun kod: >>> ${otpCode} <<<`);
    return { success: false, error: error.message };
  }
};
