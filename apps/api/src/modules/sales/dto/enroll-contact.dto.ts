import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollContactDto {
  @ApiProperty({ description: 'Contact ID to enroll in the sequence' })
  @IsUUID()
  contactId: string;
}
