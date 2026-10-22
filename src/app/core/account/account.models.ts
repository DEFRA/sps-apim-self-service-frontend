export interface ActivateAccountRequest {
  userId: string;
  token: string;
  password: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface RequestPasswordResetResponse {
  // POC only.
  // Production will deliver this through the
  // approved notification mechanism.
  resetUrl?: string;
  expiresAtUtc?: string;
}

export interface CompletePasswordResetRequest {
  userId: string;
  token: string;
  newPassword: string;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  role: 'User' | 'Administrator';
  projectIds: string[];
  reason: string;
  approvalReference: string;
}

export interface UserSummary {
  id: string;
  displayName: string;
  email: string;
  status: string;
  roles: string[];
}

export interface CreateUserResponse {
  id: string;
  email: string;
  displayName: string;
  status: string;

  // POC only.
  activationUrl?: string;
}

export interface ReissueActivationRequest {
  reason: string;
}

export interface ReissueActivationResponse {
  userId: string;
  expiresAtUtc: string;
  activationUrl: string;
}