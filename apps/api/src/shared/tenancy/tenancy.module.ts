import { Injectable, Module, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // TODO: Extract tenant ID from request header, subdomain, or JWT
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    if (tenantId) {
      (req as any).tenantId = tenantId;
    }
    next();
  }
}

@Module({})
export class TenancyModule {}
