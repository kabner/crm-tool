import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { EmailSend } from '../entities/email-send.entity';
import { MarketingEmail } from '../entities/marketing-email.entity';
import { Contact } from '../../crm/entities/contact.entity';

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(EmailSend)
    private readonly emailSendRepo: Repository<EmailSend>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async deliverEmail(
    emailSend: EmailSend,
    marketingEmail: MarketingEmail,
    contact: Contact,
  ): Promise<void> {
    try {
      const apiUrl =
        process.env.API_URL || 'http://localhost:3000';

      // Personalize subject
      const subject = this.personalizeContent(
        marketingEmail.subject,
        contact,
      );

      // Personalize HTML body
      let html = this.personalizeContent(marketingEmail.contentHtml, contact);

      // Wrap links for click tracking
      html = this.wrapLinksForTracking(html, emailSend.id, apiUrl);

      // Add open tracking pixel
      html += `<img src="${apiUrl}/api/v1/tracking/open/${emailSend.id}" width="1" height="1" style="display:none;" alt="" />`;

      // Add unsubscribe footer
      const unsubscribeUrl = `${apiUrl}/api/v1/tracking/unsubscribe/${emailSend.id}`;
      html += `<div style="margin-top:20px;padding-top:10px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center;">`;
      html += `<a href="${unsubscribeUrl}" style="color:#999;">Unsubscribe</a>`;
      html += `</div>`;

      const info = await this.transporter.sendMail({
        from: `"${marketingEmail.fromName}" <${marketingEmail.fromEmail}>`,
        to: contact.email,
        subject,
        html,
        replyTo: marketingEmail.replyTo || undefined,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      // Update send status
      emailSend.status = 'sent';
      emailSend.sentAt = new Date();
      emailSend.deliveredAt = new Date();
      emailSend.messageId = info.messageId || null;
      await this.emailSendRepo.save(emailSend);

      this.logger.log(
        `Email delivered to ${contact.email} (sendId: ${emailSend.id})`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to deliver email to contact ${contact.id}: ${error?.message}`,
      );
      emailSend.status = 'bounced';
      emailSend.bouncedAt = new Date();
      emailSend.bounceType = 'hard';
      await this.emailSendRepo.save(emailSend);
    }
  }

  private personalizeContent(content: string, contact: Contact): string {
    return content
      .replace(/\{\{firstName\}\}/g, contact.firstName || '')
      .replace(/\{\{lastName\}\}/g, contact.lastName || '')
      .replace(/\{\{email\}\}/g, contact.email || '')
      .replace(/\{\{company\}\}/g, (contact.customProps?.company as string) || '');
  }

  private wrapLinksForTracking(
    html: string,
    emailSendId: string,
    apiUrl: string,
  ): string {
    // Replace href URLs with click tracking redirects
    // Match href="..." but not mailto: or # links, and not the tracking/unsubscribe URLs we add
    return html.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const trackingUrl = `${apiUrl}/api/v1/tracking/click/${emailSendId}?url=${encodeURIComponent(url)}`;
        return `href="${trackingUrl}"`;
      },
    );
  }
}
