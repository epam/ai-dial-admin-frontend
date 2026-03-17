export interface UserInfo {
  id: string;
  email: string;
  roles: UserRole[];
}

export enum UserRole {
  FULL_ADMIN = 'FULL_ADMIN',
  READ_ONLY_ADMIN = 'READ_ONLY_ADMIN',
}
