import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Workflow } from '../entities/workflow.entity';
import { WorkflowNode } from '../entities/workflow-node.entity';
import { WorkflowEdge } from '../entities/workflow-edge.entity';
import { WorkflowEnrollment } from '../entities/workflow-enrollment.entity';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private readonly nodeRepo: Repository<WorkflowNode>,
    @InjectRepository(WorkflowEdge)
    private readonly edgeRepo: Repository<WorkflowEdge>,
    @InjectRepository(WorkflowEnrollment)
    private readonly enrollmentRepo: Repository<WorkflowEnrollment>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateWorkflowDto,
  ): Promise<Workflow> {
    const workflow = this.workflowRepo.create({
      tenantId,
      createdBy: userId,
      name: dto.name,
      description: dto.description ?? null,
      triggerConfig: dto.triggerConfig,
      status: 'draft',
      version: 1,
      statsCache: {},
    });
    return this.workflowRepo.save(workflow);
  }

  async findAll(
    tenantId: string,
    filters: { status?: string; search?: string; limit?: number; page?: number },
  ) {
    const { status, search, limit = 20, page = 1 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (search) where.name = ILike(`%${search}%`);

    const [data, total] = await this.workflowRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    // Get enrollment counts for each workflow
    const workflowsWithCounts = await Promise.all(
      data.map(async (wf) => {
        const enrolledCount = await this.enrollmentRepo.count({
          where: { workflowId: wf.id, tenantId },
        });
        return { ...wf, enrolledCount };
      }),
    );

    return {
      data: workflowsWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const workflow = await this.workflowRepo.findOne({
      where: { id, tenantId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const nodes = await this.nodeRepo.find({
      where: { workflowId: id },
      order: { positionY: 'ASC' },
    });

    const edges = await this.edgeRepo.find({
      where: { workflowId: id },
    });

    const stats = await this.getStats(tenantId, id);

    return { ...workflow, nodes, edges, stats };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateWorkflowDto,
  ): Promise<Workflow> {
    const workflow = await this.workflowRepo.findOne({
      where: { id, tenantId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Update scalar fields
    if (dto.name !== undefined) workflow.name = dto.name;
    if (dto.description !== undefined) workflow.description = dto.description ?? null;
    if (dto.triggerConfig !== undefined) workflow.triggerConfig = dto.triggerConfig;

    await this.workflowRepo.save(workflow);

    // If nodes/edges provided, replace all
    if (dto.nodes !== undefined) {
      await this.edgeRepo.delete({ workflowId: id });
      await this.nodeRepo.delete({ workflowId: id });

      const savedNodes: WorkflowNode[] = [];
      const idMap = new Map<string, string>();

      for (const nodeDto of dto.nodes) {
        const node = this.nodeRepo.create({
          workflowId: id,
          type: nodeDto.type,
          config: nodeDto.config,
          positionX: nodeDto.positionX,
          positionY: nodeDto.positionY,
        });
        const saved = await this.nodeRepo.save(node);
        savedNodes.push(saved);
        if (nodeDto.id) {
          idMap.set(nodeDto.id, saved.id);
        }
      }

      if (dto.edges) {
        for (const edgeDto of dto.edges) {
          const fromNodeId = idMap.get(edgeDto.fromNodeId) ?? edgeDto.fromNodeId;
          const toNodeId = idMap.get(edgeDto.toNodeId) ?? edgeDto.toNodeId;

          const edge = this.edgeRepo.create({
            workflowId: id,
            fromNodeId,
            toNodeId,
            conditionBranch: edgeDto.conditionBranch ?? null,
          });
          await this.edgeRepo.save(edge);
        }
      }
    }

    return this.findOne(tenantId, id);
  }

  async publish(tenantId: string, id: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findOne({
      where: { id, tenantId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Validate that workflow has at least a trigger node
    const nodeCount = await this.nodeRepo.count({ where: { workflowId: id } });
    if (nodeCount === 0) {
      throw new BadRequestException(
        'Workflow must have at least one node before publishing',
      );
    }

    workflow.status = 'active';
    workflow.publishedAt = new Date();
    workflow.version = workflow.version + 1;
    return this.workflowRepo.save(workflow);
  }

  async pause(tenantId: string, id: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findOne({
      where: { id, tenantId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    if (workflow.status !== 'active') {
      throw new BadRequestException('Only active workflows can be paused');
    }
    workflow.status = 'paused';
    return this.workflowRepo.save(workflow);
  }

  async archive(tenantId: string, id: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findOne({
      where: { id, tenantId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    workflow.status = 'archived';
    return this.workflowRepo.save(workflow);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const workflow = await this.workflowRepo.findOne({
      where: { id, tenantId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    if (workflow.status !== 'draft') {
      throw new BadRequestException('Only draft workflows can be deleted');
    }

    await this.edgeRepo.delete({ workflowId: id });
    await this.nodeRepo.delete({ workflowId: id });
    await this.enrollmentRepo.delete({ workflowId: id });
    await this.workflowRepo.remove(workflow);
  }

  async enrollContact(
    tenantId: string,
    workflowId: string,
    contactId: string,
  ): Promise<WorkflowEnrollment> {
    const workflow = await this.workflowRepo.findOne({
      where: { id: workflowId, tenantId },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    if (workflow.status !== 'active') {
      throw new BadRequestException(
        'Can only enroll contacts in active workflows',
      );
    }

    // Check if contact is already enrolled and active
    const existing = await this.enrollmentRepo.findOne({
      where: {
        workflowId,
        contactId,
        tenantId,
        status: 'active',
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Contact is already enrolled in this workflow',
      );
    }

    // Find the first node (trigger) to set as current
    const firstNode = await this.nodeRepo.findOne({
      where: { workflowId, type: 'trigger' },
    });

    const enrollment = this.enrollmentRepo.create({
      tenantId,
      workflowId,
      contactId,
      status: 'active',
      enrolledAt: new Date(),
      currentNodeId: firstNode?.id ?? null,
    });
    return this.enrollmentRepo.save(enrollment);
  }

  async getEnrollments(
    tenantId: string,
    workflowId: string,
    filters: { status?: string; limit?: number; page?: number },
  ) {
    const { status, limit = 20, page = 1 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { workflowId, tenantId };
    if (status) where.status = status;

    const [data, total] = await this.enrollmentRepo.findAndCount({
      where,
      order: { enrolledAt: 'DESC' },
      take: limit,
      skip,
    });

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

  async getStats(tenantId: string, workflowId: string) {
    const baseWhere = { workflowId, tenantId };

    const [totalEnrolled, active, completed, goalMet, errors] =
      await Promise.all([
        this.enrollmentRepo.count({ where: baseWhere }),
        this.enrollmentRepo.count({
          where: { ...baseWhere, status: 'active' },
        }),
        this.enrollmentRepo.count({
          where: { ...baseWhere, status: 'completed' },
        }),
        this.enrollmentRepo.count({
          where: { ...baseWhere, status: 'goal_met' },
        }),
        this.enrollmentRepo.count({
          where: { ...baseWhere, status: 'error' },
        }),
      ]);

    return { totalEnrolled, active, completed, goalMet, errors };
  }
}
