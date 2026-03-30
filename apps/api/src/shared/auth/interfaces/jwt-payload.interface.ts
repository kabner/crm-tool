export interface JwtPayload {
  sub: string; // userId
  tenantId: string;
  email: string;
}

export interface RequestUser {
  userId: string;
  tenantId: string;
  email: string;
}
