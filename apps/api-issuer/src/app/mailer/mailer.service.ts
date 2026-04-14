import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendCredentialEmailOptions {
  to: string;
  name: string;
  rollNumber: string;
  did: string;
  appScheme: string;
}

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587', 10),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendCredentialEmail(
    options: SendCredentialEmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, name, rollNumber, did, appScheme } = options;

    const deepLink = `${appScheme}://claim?did=${encodeURIComponent(did)}&name=${encodeURIComponent(name)}&roll=${encodeURIComponent(rollNumber)}`;

    const mailOptions = {
      from:
        this.configService.get('SMTP_FROM') ||
        '"SecureVerify" <noreply@secureverify.com>',
      to,
      subject: 'Your Student Credential - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Welcome to SecureVerify, ${name}!</h2>
          <p>Your student credential has been issued successfully.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Roll Number:</strong> ${rollNumber}</p>
            <p><strong>DID:</strong> ${did.substring(0, 30)}...</p>
          </div>
          <p>Click the button below to add your credential to the mobile wallet app:</p>
          <a href="${deepLink}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Add to Wallet
          </a>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
            If the button doesn't work, copy this link and open it in your mobile wallet app:<br/>
            ${deepLink}
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af;">
            SecureVerify - Decentralized Identity Verification System
          </p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
