import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadScoreModel } from '../entities/lead-score-model.entity';
import { LeadScoreRule } from '../entities/lead-score-rule.entity';
import { LeadScore } from '../entities/lead-score.entity';
import { Contact } from '../../crm/entities/contact.entity';
import { PageView } from '../entities/page-view.entity';
import { CreateLeadScoreModelDto, LeadScoreRuleDto } from '../dto/create-lead-score-model.dto';
import { UpdateLeadScoreModelDto } from '../dto/update-lead-score-model.dto';

export interface ScoreBreakdownEntry {
  ruleId: string;
  attribute: string;
  type: string;
  basePoints: number;
  finalPoints: number;
  matched: boolean;
  decay?: number;
}

@Injectable()
export class LeadScoringService {
  constructor(
    @InjectRepository(LeadScoreModel)
    private readonly modelRepo: Repository<LeadScoreModel>,
    @InjectRepository(LeadScoreRule)
    private readonly ruleRepo: Repository<LeadScoreRule>,
    @InjectRepository(LeadScore)
    private readonly scoreRepo: Repository<LeadScore>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(PageView)
    private readonly pageViewRepo: Repository<PageView>,
  ) {}

  async createModel(
    tenantId: string,
    dto: CreateLeadScoreModelDto,
  ): Promise<LeadScoreModel & { rules: LeadScoreRule[] }> {
    // If setting as default, unset existing default
    if (dto.isDefault) {
      await this.modelRepo.update(
        { tenantId, isDefault: true },
        { isDefault: false },
      );
    }

    const model = this.modelRepo.create({
      tenantId,
      name: dto.name,
      mqlThreshold: dto.mqlThreshold ?? 50,
      sqlThreshold: dto.sqlThreshold ?? 80,
      isDefault: dto.isDefault ?? false,
    });
    const savedModel = await this.modelRepo.save(model);

    let rules: LeadScoreRule[] = [];
    if (dto.rules && dto.rules.length > 0) {
      rules = await this.saveRules(savedModel.id, dto.rules);
    }

    return { ...savedModel, rules };
  }

  async findAllModels(tenantId: string) {
    const models = await this.modelRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    // Attach rule counts
    const modelsWithCounts = await Promise.all(
      models.map(async (model) => {
        const ruleCount = await this.ruleRepo.count({
          where: { modelId: model.id },
        });
        return { ...model, ruleCount };
      }),
    );

    return modelsWithCounts;
  }

  async findOneModel(
    tenantId: string,
    id: string,
  ): Promise<LeadScoreModel & { rules: LeadScoreRule[] }> {
    const model = await this.modelRepo.findOne({
      where: { id, tenantId },
    });
    if (!model) {
      throw new NotFoundException(`Lead score model ${id} not found`);
    }

    const rules = await this.ruleRepo.find({
      where: { modelId: model.id },
      order: { createdAt: 'ASC' },
    });

    return { ...model, rules };
  }

  async updateModel(
    tenantId: string,
    id: string,
    dto: UpdateLeadScoreModelDto,
  ): Promise<LeadScoreModel & { rules: LeadScoreRule[] }> {
    const model = await this.modelRepo.findOne({
      where: { id, tenantId },
    });
    if (!model) {
      throw new NotFoundException(`Lead score model ${id} not found`);
    }

    // If setting as default, unset existing default
    if (dto.isDefault) {
      await this.modelRepo.update(
        { tenantId, isDefault: true },
        { isDefault: false },
      );
    }

    if (dto.name !== undefined) model.name = dto.name;
    if (dto.mqlThreshold !== undefined) model.mqlThreshold = dto.mqlThreshold;
    if (dto.sqlThreshold !== undefined) model.sqlThreshold = dto.sqlThreshold;
    if (dto.isDefault !== undefined) model.isDefault = dto.isDefault;

    const savedModel = await this.modelRepo.save(model);

    // Replace rules if provided
    let rules: LeadScoreRule[];
    if (dto.rules !== undefined) {
      await this.ruleRepo.delete({ modelId: model.id });
      rules = dto.rules.length > 0
        ? await this.saveRules(model.id, dto.rules)
        : [];
    } else {
      rules = await this.ruleRepo.find({
        where: { modelId: model.id },
        order: { createdAt: 'ASC' },
      });
    }

    return { ...savedModel, rules };
  }

  async removeModel(tenantId: string, id: string): Promise<void> {
    const model = await this.modelRepo.findOne({
      where: { id, tenantId },
    });
    if (!model) {
      throw new NotFoundException(`Lead score model ${id} not found`);
    }

    // Delete rules and scores first
    await this.ruleRepo.delete({ modelId: id });
    await this.scoreRepo.delete({ modelId: id });
    await this.modelRepo.remove(model);
  }

  async calculateScore(
    tenantId: string,
    contactId: string,
    modelId?: string,
  ): Promise<{ score: number; breakdown: ScoreBreakdownEntry[]; qualificationLevel: string }> {
    // 1. Get model (default if not specified)
    let model: LeadScoreModel | null;
    if (modelId) {
      model = await this.modelRepo.findOne({ where: { id: modelId, tenantId } });
    } else {
      model = await this.modelRepo.findOne({ where: { tenantId, isDefault: true } });
    }
    if (!model) {
      throw new NotFoundException('No lead score model found');
    }

    // 2. Load contact
    const contact = await this.contactRepo.findOne({
      where: { id: contactId, tenantId },
    });
    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} not found`);
    }

    // 3. Load rules
    const rules = await this.ruleRepo.find({
      where: { modelId: model.id },
    });

    // 4. Evaluate each rule
    const breakdown: ScoreBreakdownEntry[] = [];
    let totalScore = 0;

    for (const rule of rules) {
      const entry: ScoreBreakdownEntry = {
        ruleId: rule.id,
        attribute: rule.attribute,
        type: rule.type,
        basePoints: rule.points,
        finalPoints: 0,
        matched: false,
      };

      const matched = this.evaluateRule(rule, contact);
      entry.matched = matched;

      if (matched) {
        let points = rule.points;

        // Apply decay for behavioral rules
        if (rule.type === 'behavioral' && rule.decayPerDay > 0) {
          const daysSinceActivity = this.getDaysSinceLastActivity(contact);
          const decay = rule.decayPerDay * daysSinceActivity;
          points = Math.max(0, points - decay);
          entry.decay = decay;
        }

        entry.finalPoints = Math.round(points * 100) / 100;
        totalScore += entry.finalPoints;
      }

      breakdown.push(entry);
    }

    const score = Math.round(totalScore);

    // 5. Upsert LeadScore record
    let leadScore = await this.scoreRepo.findOne({
      where: { contactId, modelId: model.id },
    });

    if (leadScore) {
      leadScore.score = score;
      leadScore.lastCalculatedAt = new Date();
      leadScore.scoreBreakdown = { breakdown };
    } else {
      leadScore = this.scoreRepo.create({
        contactId,
        modelId: model.id,
        score,
        lastCalculatedAt: new Date(),
        scoreBreakdown: { breakdown },
      });
    }
    await this.scoreRepo.save(leadScore);

    // 6. Determine qualification level
    let qualificationLevel = 'none';
    if (score >= model.sqlThreshold) {
      qualificationLevel = 'sql';
    } else if (score >= model.mqlThreshold) {
      qualificationLevel = 'mql';
    }

    return { score, breakdown, qualificationLevel };
  }

  async recalculateAll(
    tenantId: string,
    modelId: string,
  ): Promise<{ message: string; contactCount: number }> {
    // Verify model exists
    const model = await this.modelRepo.findOne({
      where: { id: modelId, tenantId },
    });
    if (!model) {
      throw new NotFoundException(`Lead score model ${modelId} not found`);
    }

    // Get all contacts for tenant
    const contacts = await this.contactRepo.find({
      where: { tenantId },
      select: ['id'],
    });

    // In production this would be an async job/queue.
    // For now, calculate synchronously in batches.
    for (const contact of contacts) {
      await this.calculateScore(tenantId, contact.id, modelId);
    }

    return {
      message: 'Recalculation complete',
      contactCount: contacts.length,
    };
  }

  // ---- Private helpers ----

  private async saveRules(
    modelId: string,
    ruleDtos: LeadScoreRuleDto[],
  ): Promise<LeadScoreRule[]> {
    const rules = ruleDtos.map((r) =>
      this.ruleRepo.create({
        modelId,
        type: r.type,
        attribute: r.attribute,
        condition: r.condition,
        points: r.points,
        decayPerDay: r.decayPerDay ?? 0,
      }),
    );
    return this.ruleRepo.save(rules);
  }

  private evaluateRule(rule: LeadScoreRule, contact: Contact): boolean {
    const { attribute, condition } = rule;

    // Get value from contact fields or customProps
    let value: any = (contact as any)[attribute];
    if (value === undefined && contact.customProps) {
      value = contact.customProps[attribute];
    }

    if (value === undefined || value === null) {
      // Check if condition expects empty/null
      if (condition.operator === 'is_empty') return true;
      return false;
    }

    const { operator, operand } = condition;

    switch (operator) {
      case 'equals':
        return String(value).toLowerCase() === String(operand).toLowerCase();
      case 'not_equals':
        return String(value).toLowerCase() !== String(operand).toLowerCase();
      case 'contains':
        return String(value).toLowerCase().includes(String(operand).toLowerCase());
      case 'not_contains':
        return !String(value).toLowerCase().includes(String(operand).toLowerCase());
      case 'greater_than':
        return Number(value) > Number(operand);
      case 'less_than':
        return Number(value) < Number(operand);
      case 'in':
        if (Array.isArray(operand)) {
          return operand.map((o: any) => String(o).toLowerCase()).includes(String(value).toLowerCase());
        }
        return false;
      case 'not_in':
        if (Array.isArray(operand)) {
          return !operand.map((o: any) => String(o).toLowerCase()).includes(String(value).toLowerCase());
        }
        return true;
      case 'is_set':
        return true; // value exists (we already checked for null/undefined)
      case 'is_empty':
        return false; // value exists
      default:
        return false;
    }
  }

  private getDaysSinceLastActivity(contact: Contact): number {
    if (!contact.lastActivityAt) return 30; // default if no activity
    const now = new Date();
    const diff = now.getTime() - new Date(contact.lastActivityAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
