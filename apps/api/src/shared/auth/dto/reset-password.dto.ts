import { IsEmail, IsUUID } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsUUID()
  tenantId: string;
}
