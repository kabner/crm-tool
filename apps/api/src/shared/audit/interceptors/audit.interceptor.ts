import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';

const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

const AUDITABLE_METHODS = new Set(Object.keys(METHOD_ACTION_MAP));

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method?.toUpperCase();

    if (!AUDITABLE_METHODS.has(method)) {
      return next.handle();
    }

    const url: string = request.url || '';
    const body = request.body;
    const action = METHOD_ACTION_MAP[method];
    const resourceType = this.extractResourceType(url);
    const tenantId: string | undefined = request.user?.tenantId;
    const userId: string | undefined = request.user?.userId ?? request.user?.id;
    const ipAddress: string | undefined =
      request.ip || request.headers?.['x-forwarded-for'];
    const userAgent: string | undefined = request.headers?.['user-agent'];
    const requestId: string | undefined =
      request.headers?.['x-request-id'] ?? request.id;

    return next.handle().pipe(
      tap({
        next: (responseBody: any) => {
          const resourceId = this.extractResourceId(request, responseBody);
          const changes = this.buildChanges(action ?? 'unknown', body);

          if (!tenantId) {
            return;
          }

          this.auditService
            .log({
              tenantId,
              userId,
              action: action ?? 'unknown',
              resourceType: resourceType ?? 'unknown',
              resourceId,
              changes,
              ipAddress,
              userAgent,
              requestId,
            })
            .catch((error) => {
              this.logger.error(
                `Failed to create audit log: ${error.message}`,
                error.stack,
              );
            });
        },
        error: () => {
          // Do not audit failed requests
        },
      }),
    );
  }

  private extractResourceType(url: string): string {
    // Expects URL pattern: /api/v1/{resourceType}/...
    const segments = url.split('/').filter(Boolean);
    // segments: ['api', 'v1', 'resourceType', ...]
    return segments[2] || 'unknown';
  }

  private extractResourceId(
    request: any,
    responseBody: any,
  ): string | undefined {
    // Try URL params first (e.g. /api/v1/contacts/:id)
    if (request.params?.id) {
      return String(request.params.id);
    }
    // Fall back to the response body id (common for POST/create)
    if (responseBody?.id) {
      return String(responseBody.id);
    }
    return undefined;
  }

  private buildChanges(
    action: string,
    body: any,
  ): Record<string, { old: any; new: any }> | undefined {
    if (!body || typeof body !== 'object') {
      return undefined;
    }

    if (action === 'create') {
      // For creates, store each field as a change from null to the new value
      const changes: Record<string, { old: any; new: any }> = {};
      for (const [key, value] of Object.entries(body)) {
        changes[key] = { old: null, new: value };
      }
      return Object.keys(changes).length > 0 ? changes : undefined;
    }

    if (action === 'update') {
      // For updates, store the submitted fields — old values are not available
      // at this layer, so we record the new values only
      const changes: Record<string, { old: any; new: any }> = {};
      for (const [key, value] of Object.entries(body)) {
        changes[key] = { old: undefined, new: value };
      }
      return Object.keys(changes).length > 0 ? changes : undefined;
    }

    return undefined;
  }
}
