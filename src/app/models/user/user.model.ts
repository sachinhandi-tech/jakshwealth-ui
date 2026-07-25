export interface UserSessionData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  department: string;
  lanId: string;
  globalGroups: string[];
}
