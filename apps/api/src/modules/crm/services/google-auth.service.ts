import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { GoogleConnection } from '../entities/google-connection.entity';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(GoogleConnection)
    private readonly connectionRepo: Repository<GoogleConnection>,
  ) {}

  getOAuth2Client(): any {
    return new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(tenantId: string, userId: string): string {
    const client = this.getOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      state: `${tenantId}:${userId}`,
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
  }

  async handleCallback(
    tenantId: string,
    userId: string,
    code: string,
  ): Promise<GoogleConnection> {
    const client = this.getOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user's Google email
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email!;

    // Upsert connection
    let connection = await this.connectionRepo.findOne({
      where: { userId },
    });
    if (connection) {
      connection.accessToken = tokens.access_token!;
      connection.refreshToken =
        tokens.refresh_token || connection.refreshToken;
      connection.tokenExpiry = new Date(tokens.expiry_date!);
      connection.scopes = tokens.scope || '';
      connection.googleEmail = googleEmail;
    } else {
      connection = this.connectionRepo.create({
        tenantId,
        userId,
        googleEmail,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        tokenExpiry: new Date(tokens.expiry_date!),
        scopes: tokens.scope || '',
      });
    }
    return this.connectionRepo.save(connection);
  }

  async getAuthenticatedClient(userId: string): Promise<{ client: any; connection: GoogleConnection } | null> {
    const connection = await this.connectionRepo.findOne({
      where: { userId },
    });
    if (!connection) return null;

    const client = this.getOAuth2Client();
    client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: connection.tokenExpiry.getTime(),
    });

    // Auto-refresh if expired
    if (connection.tokenExpiry.getTime() < Date.now()) {
      const { credentials } = await client.refreshAccessToken();
      connection.accessToken = credentials.access_token!;
      connection.tokenExpiry = new Date(credentials.expiry_date!);
      await this.connectionRepo.save(connection);
      client.setCredentials(credentials);
    }

    return { client, connection };
  }

  async getConnection(userId: string): Promise<GoogleConnection | null> {
    return this.connectionRepo.findOne({ where: { userId } });
  }

  async disconnect(userId: string): Promise<void> {
    await this.connectionRepo.delete({ userId });
  }
}
