import api from './client';
import type {
  CreateUserData,
  UpdateUserData,
  User,
  UserRole,
} from '../types/user';

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users');
  return response.data;
}

export interface UserSearchFilters {
  username?: string;
  email?: string;
  role?: string;
  active?: boolean;
}

interface UserSearchResult {
  user_id: number;
  username: string;
  email: string;
  active: boolean;
  role_id: number;
  role_name: string;
}

export async function searchUsers(
  filters: UserSearchFilters,
): Promise<User[]> {
  const params = new URLSearchParams();

  if (filters.username?.trim()) {
    params.set('username', filters.username.trim());
  }

  if (filters.email?.trim()) {
    params.set('email', filters.email.trim());
  }

  if (filters.role?.trim()) {
    params.set('role', filters.role.trim());
  }

  if (filters.active !== undefined) {
    params.set('active', String(filters.active));
  }

  const query = params.toString();

  const response = await api.get<UserSearchResult[]>(
    `/users/search${query ? `?${query}` : ''}`,
  );

  return response.data.map((user) => ({
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    active: user.active,
    role_id: user.role_id,
    role: {
      name: user.role_name as UserRole,
    },
  }));
}

export async function createUser(
  data: CreateUserData,
): Promise<User> {
  const response = await api.post<User>(
    '/users',
    data,
  );

  return response.data;
}

export async function updateUser(
  id: number,
  data: UpdateUserData,
): Promise<User> {
  const response = await api.patch<User>(
    `/users/${id}`,
    data,
  );

  return response.data;
}

export async function deleteUser(
  id: number,
): Promise<User> {
  const response = await api.delete<User>(
    `/users/${id}`,
  );

  return response.data;
}
