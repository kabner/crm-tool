import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sequence } from '../entities/sequence.entity';
import { SequenceStep } from '../entities/sequence-step.entity';
import { SequenceEnrollment } from '../entities/sequence-enrollment.entity';
import { Contact } from '../../crm/entities/contact.entity';
import { CreateSequenceDto } from '../dto/create-sequence.dto';
import { UpdateSequenceDto } from '../dto/update-sequence.dto';

@Injectable()
export class SequencesService {
  constructor(
    @InjectRepository(Sequence)
    private readonly sequenceRepository: Repository<Sequence>,
    @InjectRepository(SequenceStep)
    private readonly stepRepository: Repository<SequenceStep>,
    @InjectRepository(SequenceEnrollment)
    private readonly enrollmentRepository: Repository<SequenceEnrollment>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateSequenceDto,
  ): Promise<Sequence> {
    const sequence = this.sequenceRepository.create({
      tenantId,
      name: dto.name,
      status: 'draft',
      createdBy: userId,
      settings: dto.settings ?? {},
    });
    return this.sequenceRepository.save(sequence);
  }

  async findAll(
    tenantId: string,
    filters: { page?: number; limit?: number; status?: string } = {},
  ): Promise<{
    data: (Sequence & { stepsCount: number; enrolledCount: number })[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 20, status } = filters;

    const qb = this.sequenceRepository
      .createQueryBuilder('seq')
      .where('seq.tenantId = :tenantId', { tenantId });

    if (status) {
      qb.andWhere('seq.status = :status', { status });
    }

    qb.orderBy('seq.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [sequences, total] = await qb.getManyAndCount();

    // Get step counts and enrollment counts
    const data = await Promise.all(
      sequences.map(async (seq) => {
        const stepsCount = await this.stepRepository.count({
          where: { sequenceId: seq.id },
        });
        const enrolledCount = await this.enrollmentRepository.count({
          where: { sequenceId: seq.id },
        });
        return { ...seq, stepsCount, enrolledCount };
      }),
    );

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

  async findOne(tenantId: string, id: string): Promise<Sequence & { steps: SequenceStep[] }> {
    const sequence = await this.sequenceRepository.findOne({
      where: { id, tenantId },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID "${id}" not found`);
    }

    const steps = await this.stepRepository.find({
      where: { sequenceId: id },
      order: { position: 'ASC' },
    });

    return { ...sequence, steps };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateSequenceDto,
  ): Promise<Sequence & { steps: SequenceStep[] }> {
    const sequence = await this.sequenceRepository.findOne({
      where: { id, tenantId },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID "${id}" not found`);
    }

    const { steps, ...updateData } = dto;

    if (updateData.name !== undefined) {
      sequence.name = updateData.name;
    }
    if (updateData.settings !== undefined) {
      sequence.settings = updateData.settings;
    }

    await this.sequenceRepository.save(sequence);

    // If steps provided, replace all steps
    if (steps !== undefined) {
      await this.stepRepository.delete({ sequenceId: id });

      if (steps.length > 0) {
        const stepEntities = steps.map((s) =>
          this.stepRepository.create({
            sequenceId: id,
            position: s.position,
            type: s.type,
            delayDays: s.delayDays ?? 0,
            delayHours: s.delayHours ?? 0,
            config: s.config,
          }),
        );
        await this.stepRepository.save(stepEntities);
      }
    }

    return this.findOne(tenantId, id);
  }

  async activate(tenantId: string, id: string): Promise<Sequence> {
    const sequence = await this.sequenceRepository.findOne({
      where: { id, tenantId },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID "${id}" not found`);
    }

    sequence.status = 'active';
    return this.sequenceRepository.save(sequence);
  }

  async pause(tenantId: string, id: string): Promise<Sequence> {
    const sequence = await this.sequenceRepository.findOne({
      where: { id, tenantId },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID "${id}" not found`);
    }

    sequence.status = 'paused';
    return this.sequenceRepository.save(sequence);
  }

  async archive(tenantId: string, id: string): Promise<Sequence> {
    const sequence = await this.sequenceRepository.findOne({
      where: { id, tenantId },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID "${id}" not found`);
    }

    sequence.status = 'archived';
    return this.sequenceRepository.save(sequence);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const sequence = await this.sequenceRepository.findOne({
      where: { id, tenantId },
    });

    if (!sequence) {
      throw new NotFoundException(`Sequence with ID "${id}" not found`);
    }

    if (sequence.status !== 'draft') {
      throw new BadRequestException('Only draft sequences can be deleted');
    }

    await this.stepRepository.delete({ sequenceId: id });
    await this.enrollmentRepository.delete({ sequenceId: id });
    await this.sequenceRepository.remove(sequence);
  }

  async enroll(
    tenantId: string,
    sequenceId: string,
    contactId: string,
    enrolledBy: string,
  ): Promise<SequenceEnrollment> {
    // Verify sequence exists and is active
    const sequence = await this.sequenceRepository.findOne({
      where: { id: sequenceId, tenantId },
    });
    if (!sequence) {
      throw new NotFoundException(`Sequence with ID "${sequenceId}" not found`);
    }
    if (sequence.status !== 'active') {
      throw new BadRequestException('Can only enroll contacts in active sequences');
    }

    // Verify contact exists
    const contact = await this.contactRepository.findOne({
      where: { id: contactId, tenantId },
    });
    if (!contact) {
      throw new NotFoundException(`Contact with ID "${contactId}" not found`);
    }

    // Check for existing active enrollment
    const existing = await this.enrollmentRepository.findOne({
      where: { sequenceId, contactId, status: 'active' },
    });
    if (existing) {
      throw new BadRequestException('Contact is already enrolled in this sequence');
    }

    const enrollment = this.enrollmentRepository.create({
      sequenceId,
      contactId,
      enrolledBy,
      currentStep: 0,
      status: 'active',
      enrolledAt: new Date(),
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async unenroll(
    tenantId: string,
    enrollmentId: string,
    reason: string,
  ): Promise<SequenceEnrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['sequence'],
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID "${enrollmentId}" not found`,
      );
    }

    enrollment.status = 'manual_exit';
    enrollment.exitReason = reason;
    enrollment.completedAt = new Date();

    return this.enrollmentRepository.save(enrollment);
  }

  async getEnrollments(
    tenantId: string,
    sequenceId: string,
    filters: { page?: number; limit?: number; status?: string } = {},
  ): Promise<{
    data: SequenceEnrollment[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    // Verify sequence exists
    await this.findOne(tenantId, sequenceId);

    const { page = 1, limit = 20, status } = filters;

    const qb = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .where('enrollment.sequenceId = :sequenceId', { sequenceId });

    if (status) {
      qb.andWhere('enrollment.status = :status', { status });
    }

    qb.orderBy('enrollment.enrolledAt', 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

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

  async getStats(
    tenantId: string,
    sequenceId: string,
  ): Promise<{
    totalEnrolled: number;
    active: number;
    completed: number;
    replied: number;
    bounced: number;
  }> {
    // Verify sequence exists
    await this.findOne(tenantId, sequenceId);

    const totalEnrolled = await this.enrollmentRepository.count({
      where: { sequenceId },
    });
    const active = await this.enrollmentRepository.count({
      where: { sequenceId, status: 'active' },
    });
    const completed = await this.enrollmentRepository.count({
      where: { sequenceId, status: 'completed' },
    });
    const replied = await this.enrollmentRepository.count({
      where: { sequenceId, status: 'replied' },
    });
    const bounced = await this.enrollmentRepository.count({
      where: { sequenceId, status: 'bounced' },
    });

    return { totalEnrolled, active, completed, replied, bounced };
  }
}
