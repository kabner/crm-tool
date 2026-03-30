import * as crypto from 'crypto';
import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Tenant } from '../../modules/crm/entities/tenant.entity';
import { User } from '../../modules/crm/entities/user.entity';
import { Session } from '../../modules/crm/entities/session.entity';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface UserProfilePayload {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async getDefaultTenant(): Promise<{ id: string; name: string; domain: string }> {
    const tenant = await this.tenantRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
    if (!tenant) {
      throw new NotFoundException('No tenant found. Run pnpm db:seed first.');
    }
    return { id: tenant.id, name: tenant.name, domain: tenant.domain };
  }

  async validateUser(
    email: string,
    password: string,
    tenantId: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(
    user: User,
    ip: string,
    userAgent: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserProfilePayload;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.sessionRepository.save({
      userId: user.id,
      refreshTokenHash,
      ipAddress: ip,
      userAgent,
      expiresAt,
    });

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
      },
    };
  }

  async refreshTokens(
    refreshToken: string,
    ip: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const sessions = await this.sessionRepository.find({
      where: {
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    let matchedSession: Session | null = null;

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old session
    await this.sessionRepository.update(matchedSession.id, {
      revokedAt: new Date(),
    });

    // Create new session with new refresh token
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.sessionRepository.save({
      userId: matchedSession.userId,
      refreshTokenHash: newRefreshTokenHash,
      ipAddress: ip,
      userAgent,
      expiresAt,
    });

    // Generate new access token
    const user = matchedSession.user;
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.sessionRepository.update(
        { id: sessionId, userId },
        { revokedAt: new Date() },
      );
    } else {
      await this.sessionRepository.update(
        { userId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
    }
  }

  async register(dto: RegisterDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email, tenantId: dto.tenantId },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = this.userRepository.create({
      tenantId: dto.tenantId,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return this.userRepository.save(user);
  }

  async resetPassword(email: string, tenantId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    if (!user) {
      // Do not reveal whether user exists
      this.logger.log(
        `Password reset requested for non-existent user: ${email}`,
      );
      return;
    }

    // TODO: Generate reset token and send email
    this.logger.log(`Password reset requested for user: ${user.id}`);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.userRepository.update(userId, { passwordHash: newPasswordHash });
  }
}
