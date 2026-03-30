import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../modules/crm/entities/role.entity';
import { Session } from '../../modules/crm/entities/session.entity';
import { Tenant } from '../../modules/crm/entities/tenant.entity';
import { User } from '../../modules/crm/entities/user.entity';
import { UserRole } from '../../modules/crm/entities/user-role.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RbacGuard } from './rbac/rbac.guard';
import { RbacService } from './rbac/rbac.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, Tenant, Role, UserRole]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RbacService, RbacGuard],
  exports: [AuthService, JwtModule, RbacService, RbacGuard],
})
export class AuthModule {}
