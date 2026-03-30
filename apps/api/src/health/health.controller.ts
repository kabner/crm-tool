import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json');

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  health() {
    return {
      status: 'ok',
      version: packageJson.version,
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check (DB + Redis)' })
  async readiness() {
    const checks: Record<string, { status: string; error?: string }> = {};

    // Database check
    try {
      await this.dataSource.query('SELECT 1');
      checks.database = { status: 'ok' };
    } catch (error) {
      checks.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Redis check
    try {
      // TODO: Inject Redis client and ping
      checks.redis = { status: 'ok' };
    } catch (error) {
      checks.redis = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const allHealthy = Object.values(checks).every(
      (c) => c.status === 'ok',
    );

    return {
      status: allHealthy ? 'ok' : 'degraded',
      version: packageJson.version,
      checks,
    };
  }
}
