import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../modules/crm/entities/role.entity';
import { UserRole } from '../../../modules/crm/entities/user-role.entity';
import { DefaultRoles } from './default-roles';

interface CacheEntry {
  permissions: string[];
  expiresAt: number;
}

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private readonly permissionsCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const cached = this.permissionsCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    const permissionsSet = new Set<string>();
    for (const userRole of userRoles) {
      const rolePermissions = userRole.role?.permissions;
      if (Array.isArray(rolePermissions)) {
        for (const perm of rolePermissions) {
          permissionsSet.add(perm);
        }
      }
    }

    const permissions = Array.from(permissionsSet);

    this.permissionsCache.set(userId, {
      permissions,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return permissions;
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  async hasAnyPermission(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.some((p) => userPermissions.includes(p));
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });
    return userRoles.map((ur) => ur.role);
  }

  async assignRole(
    userId: string,
    roleId: string,
    grantedBy: string,
  ): Promise<UserRole> {
    const userRole = this.userRoleRepository.create({
      userId,
      roleId,
      grantedBy,
    });
    this.invalidateCache(userId);
    return this.userRoleRepository.save(userRole);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.userRoleRepository.delete({ userId, roleId });
    this.invalidateCache(userId);
  }

  async createDefaultRoles(tenantId: string): Promise<Role[]> {
    const roles: Role[] = [];

    for (const [, template] of Object.entries(DefaultRoles)) {
      const role = this.roleRepository.create({
        tenantId,
        name: template.name,
        description: template.description,
        permissions: template.permissions as unknown as Record<string, any>,
        recordAccessLevel: template.recordAccessLevel,
        isSystem: true,
      });
      roles.push(role);
    }

    const saved = await this.roleRepository.save(roles);
    this.logger.log(
      `Created ${saved.length} default roles for tenant ${tenantId}`,
    );
    return saved;
  }

  private invalidateCache(userId: string): void {
    this.permissionsCache.delete(userId);
  }
}
