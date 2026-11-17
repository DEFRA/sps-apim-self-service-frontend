export interface ActivateAccountRequest {
  userId: string;
  token: string;
  password: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface AccessRequestRequest {
  firstName: string;
  lastName: string;
  email: string;
  requestType: 'Onboard a new API' | 'Manage an existing API' | 'Manage onboarding requests as an ICC administrator';
  reason: string;
}

export interface AccessRequestSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  requestType: string;
  reason: string;
  submittedAtUtc: string;
  status: string;
  decisionNote?: string | null;
  assignedRole?: string | null;
  projectName?: string | null;
  accountUserId?: string | null;
  decidedAtUtc?: string | null;
  decisionEmailSentAtUtc?: string | null;
}

export interface AccessRequestDecision {
  outcome: 'Approved' | 'Rejected' | 'MoreInformationRequested';
  role?: string | null;
  projectId?: string | null;
  decisionNote: string;
}

export interface AdminDashboardSummary {
  portalUserCount: number;
  accessRequestsAwaitingReviewCount: number;
  activeOnboardingRequestsCount: number | null;
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
  role: 'API Developer' | 'API Maintainer' | 'ICC Administrator' | 'Read only';
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
  projects: string[];
}

export interface CreateUserResponse {
  id: string;
  email: string;
  displayName: string;
  status: string;
}

export interface ReissueActivationRequest {
  reason: string;
}

export interface ReissueActivationResponse {
  userId: string;
  expiresAtUtc: string;
}

export interface ProjectOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface AccountAccessHistory {
  action: string;
  reason: string;
  changedBy: string;
  changedAtUtc: string;
}

export interface UserAccessDetails {
  userId: string;
  displayName: string;
  email: string;
  status: string;
  isLocked: boolean;
  role: string;
  projectIds: string[];
  projects: ProjectOption[];
  history: AccountAccessHistory[];
}

export interface UpdateUserAccessRequest {
  role: string;
  projectIds: string[];
  status: string;
  reason: string;
}