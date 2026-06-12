import { apiDeleteData, apiGetData, apiPostData, apiPutData } from "@/services/api";
import type { PageQueryParams, PagedResponse } from "@/types/api";
import type { UserCreatePayload, UserItem, UserRolesUpdatePayload, UserUpdatePayload } from "@/types/user";

const USERS_API_BASE = "/api/users";

export interface UserListParams extends PageQueryParams {}

export function getUsers(params?: UserListParams): Promise<PagedResponse<UserItem>> {
  return apiGetData<PagedResponse<UserItem>>(USERS_API_BASE, { params });
}

export function getUserById(id: number): Promise<UserItem> {
  return apiGetData<UserItem>(`${USERS_API_BASE}/${id}`);
}

export function createUser(payload: UserCreatePayload): Promise<UserItem> {
  return apiPostData<UserItem, UserCreatePayload>(USERS_API_BASE, payload);
}

export function updateUser(id: number, payload: UserUpdatePayload): Promise<UserItem> {
  return apiPutData<UserItem, UserUpdatePayload>(`${USERS_API_BASE}/${id}`, payload);
}

export function updateUserRoles(id: number, payload: UserRolesUpdatePayload): Promise<UserItem> {
  return apiPutData<UserItem, UserRolesUpdatePayload>(`${USERS_API_BASE}/${id}/roles`, payload);
}

export function deleteUser(id: number): Promise<null> {
  return apiDeleteData<null>(`${USERS_API_BASE}/${id}`);
}
