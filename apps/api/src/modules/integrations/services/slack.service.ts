import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  async sendNotification(
    webhookUrl: string,
    message: { text: string; blocks?: any[] },
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        this.logger.warn(`Slack notification failed: ${text}`);
        return { ok: false, error: text };
      }

      return { ok: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Slack notification error: ${errorMessage}`);
      return { ok: false, error: errorMessage };
    }
  }

  formatDealAlert(deal: any): { text: string; blocks: any[] } {
    const text = `Deal "${deal.name}" moved to stage: ${deal.stage}`;
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Deal Stage Changed',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Deal:*\n${deal.name || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Stage:*\n${deal.stage || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Value:*\n$${deal.value ?? 0}`,
          },
          {
            type: 'mrkdwn',
            text: `*Owner:*\n${deal.ownerName || 'Unassigned'}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Updated at: ${new Date().toISOString()}`,
          },
        ],
      },
    ];

    return { text, blocks };
  }

  formatTicketAlert(ticket: any): { text: string; blocks: any[] } {
    const text = `New ticket: "${ticket.subject}"`;
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'New Support Ticket',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Subject:*\n${ticket.subject || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Priority:*\n${ticket.priority || 'Normal'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Contact:*\n${ticket.contactName || 'Unknown'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Category:*\n${ticket.category || 'General'}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${(ticket.description || '').substring(0, 300)}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Created at: ${new Date().toISOString()}`,
          },
        ],
      },
    ];

    return { text, blocks };
  }
}
