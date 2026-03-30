import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageView } from '../entities/page-view.entity';
import { TrackPageViewDto } from '../dto/track-page-view.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(PageView)
    private readonly pageViewRepo: Repository<PageView>,
  ) {}

  async trackPageView(tenantId: string, dto: TrackPageViewDto): Promise<PageView> {
    const pageView = this.pageViewRepo.create({
      tenantId,
      pageUrl: dto.pageUrl,
      pageTitle: dto.pageTitle ?? null,
      referrer: dto.referrer ?? null,
      utmSource: dto.utmSource ?? null,
      utmMedium: dto.utmMedium ?? null,
      utmCampaign: dto.utmCampaign ?? null,
      utmContent: dto.utmContent ?? null,
      utmTerm: dto.utmTerm ?? null,
      sessionId: dto.sessionId ?? null,
      contactId: dto.contactId ?? null,
      durationMs: dto.durationMs ?? null,
      viewedAt: new Date(),
    });
    return this.pageViewRepo.save(pageView);
  }

  async getPageViews(
    tenantId: string,
    filters: {
      contactId?: string;
      pageUrl?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      page?: number;
    },
  ) {
    const limit = filters.limit || 25;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const qb = this.pageViewRepo
      .createQueryBuilder('pv')
      .where('pv.tenantId = :tenantId', { tenantId });

    if (filters.contactId) {
      qb.andWhere('pv.contactId = :contactId', { contactId: filters.contactId });
    }

    if (filters.pageUrl) {
      qb.andWhere('pv.pageUrl ILIKE :pageUrl', { pageUrl: `%${filters.pageUrl}%` });
    }

    if (filters.startDate) {
      qb.andWhere('pv.viewedAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      qb.andWhere('pv.viewedAt <= :endDate', { endDate: filters.endDate });
    }

    qb.orderBy('pv.viewedAt', 'DESC');

    const [data, total] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  getTrackingScript(tenantId: string): string {
    const apiBase = process.env.API_BASE_URL || 'http://localhost:3001';

    return `
<script>
(function() {
  var TENANT_ID = '${tenantId}';
  var API_URL = '${apiBase}/api/v1/tracking/web/pageview';
  var SESSION_KEY = '_crm_sid';

  function getSessionId() {
    var sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'ses_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmContent: params.get('utm_content') || undefined,
      utmTerm: params.get('utm_term') || undefined,
    };
  }

  function track() {
    var utm = getUtmParams();
    var data = {
      tenantId: TENANT_ID,
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer || undefined,
      sessionId: getSessionId(),
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      utmContent: utm.utmContent,
      utmTerm: utm.utmTerm,
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_URL, JSON.stringify(data));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    }
  }

  if (document.readyState === 'complete') {
    track();
  } else {
    window.addEventListener('load', track);
  }
})();
</script>`.trim();
  }

  async getContactJourney(tenantId: string, contactId: string) {
    const pageViews = await this.pageViewRepo.find({
      where: { tenantId, contactId },
      order: { viewedAt: 'ASC' },
    });

    return {
      contactId,
      totalPageViews: pageViews.length,
      journey: pageViews,
    };
  }
}
