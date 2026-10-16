export type UserRole = 'Administrator' | 'User';

export interface User {
  user_id: number;
  username: string;
  email: string;
  active: boolean;
  role_id: number;
  role: {
    name: UserRole;
  };
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  active?: boolean;
}
