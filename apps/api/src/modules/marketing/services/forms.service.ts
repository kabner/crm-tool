import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from '../entities/form.entity';
import { FormSubmission } from '../entities/form-submission.entity';
import { Contact } from '../../crm/entities/contact.entity';
import { CreateFormDto } from '../dto/create-form.dto';
import { UpdateFormDto } from '../dto/update-form.dto';
import { SubmitFormDto } from '../dto/submit-form.dto';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepo: Repository<Form>,
    @InjectRepository(FormSubmission)
    private readonly submissionRepo: Repository<FormSubmission>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async create(tenantId: string, dto: CreateFormDto): Promise<Form> {
    const form = this.formRepo.create({
      tenantId,
      name: dto.name,
      fields: dto.fields,
      settings: dto.settings || {},
      status: 'draft',
      submissionCount: 0,
    });

    const saved = await this.formRepo.save(form);

    // Generate embed code after we have the ID
    saved.embedCode = this.generateEmbedCode(saved.id);
    return this.formRepo.save(saved);
  }

  async findAll(
    tenantId: string,
    filters: {
      status?: string;
      search?: string;
      limit?: number;
      page?: number;
    },
  ) {
    const limit = filters.limit || 25;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const qb = this.formRepo
      .createQueryBuilder('form')
      .where('form.tenantId = :tenantId', { tenantId });

    if (filters.status) {
      qb.andWhere('form.status = :status', { status: filters.status });
    }

    if (filters.search) {
      qb.andWhere('form.name ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    qb.orderBy('form.createdAt', 'DESC').skip(offset).take(limit);

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

  async findOne(tenantId: string, id: string): Promise<Form> {
    const form = await this.formRepo.findOne({
      where: { id, tenantId },
    });
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateFormDto,
  ): Promise<Form> {
    const form = await this.findOne(tenantId, id);
    if (form.status === 'archived') {
      throw new BadRequestException('Cannot update an archived form');
    }
    Object.assign(form, dto);
    return this.formRepo.save(form);
  }

  async publish(tenantId: string, id: string): Promise<Form> {
    const form = await this.findOne(tenantId, id);
    if (form.status === 'archived') {
      throw new BadRequestException('Cannot publish an archived form');
    }
    form.status = 'published';
    form.embedCode = this.generateEmbedCode(form.id);
    return this.formRepo.save(form);
  }

  async archive(tenantId: string, id: string): Promise<Form> {
    const form = await this.findOne(tenantId, id);
    form.status = 'archived';
    return this.formRepo.save(form);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const form = await this.findOne(tenantId, id);
    await this.formRepo.remove(form);
  }

  async submitForm(
    formId: string,
    dto: SubmitFormDto,
    ipAddress: string,
  ): Promise<{ success: boolean; contactId: string | null }> {
    // Load form without tenant scoping (public endpoint)
    const form = await this.formRepo.findOne({ where: { id: formId } });
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    if (form.status !== 'published') {
      throw new BadRequestException('Form is not accepting submissions');
    }

    // 1. Validate submission against form field definitions
    const fieldDefs = form.fields as any[];
    for (const field of fieldDefs) {
      if (field.required && !dto.data[field.name]) {
        throw new BadRequestException(
          `Field "${field.label}" is required`,
        );
      }
    }

    // 2. Look up or create contact (match by email field if present)
    let contactId: string | null = null;
    const emailField = fieldDefs.find((f) => f.type === 'email');
    if (emailField && dto.data[emailField.name]) {
      const email = dto.data[emailField.name];
      let contact = await this.contactRepo.findOne({
        where: { tenantId: form.tenantId, email },
      });

      if (!contact) {
        // Create a new contact from form data
        const nameField = fieldDefs.find(
          (f) => f.name === 'name' || f.name === 'full_name',
        );
        const firstNameField = fieldDefs.find(
          (f) => f.name === 'first_name' || f.name === 'firstName',
        );
        const lastNameField = fieldDefs.find(
          (f) => f.name === 'last_name' || f.name === 'lastName',
        );
        const phoneField = fieldDefs.find((f) => f.type === 'phone');

        let firstName = 'Unknown';
        let lastName = '';

        if (firstNameField && dto.data[firstNameField.name]) {
          firstName = dto.data[firstNameField.name];
        } else if (nameField && dto.data[nameField.name]) {
          const parts = dto.data[nameField.name].split(' ');
          firstName = parts[0] || 'Unknown';
          lastName = parts.slice(1).join(' ');
        }

        if (lastNameField && dto.data[lastNameField.name]) {
          lastName = dto.data[lastNameField.name];
        }

        contact = this.contactRepo.create({
          tenantId: form.tenantId,
          email,
          firstName,
          lastName,
          phone: phoneField ? dto.data[phoneField.name] : undefined,
          source: 'form',
        });
        contact = await this.contactRepo.save(contact);
      }

      contactId = contact.id;
    }

    // 3. Create FormSubmission record
    const submission = this.submissionRepo.create({
      tenantId: form.tenantId,
      formId: form.id,
      contactId,
      data: dto.data,
      pageUrl: dto.pageUrl || null,
      referrer: dto.referrer || null,
      utmParams: dto.utmParams || null,
      ipAddress,
      submittedAt: new Date(),
      consentGiven: dto.consentGiven || false,
    });
    await this.submissionRepo.save(submission);

    // 4. Increment form.submissionCount
    form.submissionCount += 1;
    await this.formRepo.save(form);

    // 5. Return result
    return { success: true, contactId };
  }

  async getSubmissions(
    tenantId: string,
    formId: string,
    pagination: { page?: number; limit?: number },
  ) {
    // Verify the form belongs to the tenant
    await this.findOne(tenantId, formId);

    const limit = pagination.limit || 25;
    const page = pagination.page || 1;
    const offset = (page - 1) * limit;

    const [data, total] = await this.submissionRepo.findAndCount({
      where: { formId, tenantId },
      order: { submittedAt: 'DESC' },
      skip: offset,
      take: limit,
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

  getEmbedCode(tenantId: string, formId: string): string {
    return this.generateEmbedCode(formId);
  }

  private generateEmbedCode(formId: string): string {
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    return `<div id="crm-form-${formId}"></div>
<script>
(function() {
  var formId = "${formId}";
  var apiUrl = "${apiUrl}";
  var container = document.getElementById("crm-form-" + formId);

  fetch(apiUrl + "/api/v1/forms/" + formId + "/submit", { method: "OPTIONS" })
    .catch(function() {});

  // Load form definition and render
  var form = document.createElement("form");
  form.setAttribute("data-crm-form", formId);
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var formData = new FormData(form);
    var data = {};
    formData.forEach(function(value, key) { data[key] = value; });
    fetch(apiUrl + "/api/v1/forms/" + formId + "/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId: formId, data: data, pageUrl: window.location.href, referrer: document.referrer })
    }).then(function(res) { return res.json(); })
      .then(function(result) {
        if (result.success) {
          container.innerHTML = "<p>Thank you for your submission!</p>";
        }
      })
      .catch(function(err) { console.error("Form submission error:", err); });
  });
  container.appendChild(form);
})();
</script>`;
  }
}
