const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:8080/api";
const DEFAULT_PRODUCTION_API_BASE_URL = "https://soyla-api.onrender.com/api";

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? DEFAULT_LOCAL_API_BASE_URL
    : DEFAULT_PRODUCTION_API_BASE_URL);

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
}

interface ErrorPayload {
  message?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface SessionUser {
  fullName: string;
  email: string;
  token: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  createdAt: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  createdByEmail: string;
  createdAt: string;
  memberCount: number;
}

export interface GroupMember {
  email: string;
  fullName: string;
  role: "Administrador" | "Coadministrador" | "Colaborador";
  joinedAt: string;
}

export interface InviteRecord {
  code: string;
  groupId: string;
  groupName: string;
  createdAt: string;
  expiresAt: string;
}

export interface JoinInviteResponse {
  alreadyMember: boolean;
  group: FamilyGroup;
}

export interface Task {
  id: string;
  groupId: string;
  name: string;
  description?: string | null;
  deadline?: string | null;
  frequency: string;
  assignedToEmail?: string | null;
  assignedToName?: string | null;
  priority?: "alta" | "media" | "baja" | null;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
}

function getAuthToken(): string | null {
  const rawSession = localStorage.getItem("currentSession");
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as { user?: { token?: string } };
    return parsed?.user?.token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken();
  const defaultHeaders: Record<string, string> = {};
  if (options.body !== undefined) {
    defaultHeaders["Content-Type"] = "application/json";
  }
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: Object.keys(defaultHeaders).length ? defaultHeaders : undefined,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = "Ocurri\u00f3 un error al procesar la solicitud.";

    try {
      const payload = (await response.json()) as ErrorPayload;
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore malformed error bodies and surface the fallback message.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function registerUser(payload: {
  fullName: string;
  email: string;
  password: string;
}): Promise<SessionUser> {
  return request<SessionUser>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<SessionUser> {
  return request<SessionUser>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function getUserProfile(email: string): Promise<UserProfile> {
  return request<UserProfile>(`/users/${encodeURIComponent(email)}`);
}

export async function updateUserProfile(
  email: string,
  payload: { email: string; phone?: string }
): Promise<UserProfile> {
  return request<UserProfile>(`/users/${encodeURIComponent(email)}`, {
    method: "PUT",
    body: payload,
  });
}

export async function createGroup(payload: {
  name: string;
  createdByEmail: string;
}): Promise<FamilyGroup> {
  return request<FamilyGroup>("/groups", {
    method: "POST",
    body: payload,
  });
}

export async function listGroups(memberEmail: string): Promise<FamilyGroup[]> {
  return request<FamilyGroup[]>(`/groups?memberEmail=${encodeURIComponent(memberEmail)}`);
}

export async function getGroup(groupId: string): Promise<FamilyGroup> {
  return request<FamilyGroup>(`/groups/${groupId}`);
}

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  return request<GroupMember[]>(`/groups/${groupId}/members`);
}

export async function updateGroupMemberRole(
  groupId: string,
  memberEmail: string,
  payload: { role: GroupMember["role"]; requestedByEmail: string }
): Promise<GroupMember> {
  return request<GroupMember>(
    `/groups/${groupId}/members/${encodeURIComponent(memberEmail)}/role`,
    {
      method: "PUT",
      body: payload,
    }
  );
}

export async function getActiveInvite(groupId: string): Promise<InviteRecord> {
  return request<InviteRecord>(`/groups/${groupId}/invite`);
}

export async function createInvite(groupId: string): Promise<InviteRecord> {
  return request<InviteRecord>(`/groups/${groupId}/invite`, {
    method: "POST",
  });
}

export async function lookupInvite(code: string): Promise<InviteRecord> {
  return request<InviteRecord>(`/invites/${encodeURIComponent(code)}`);
}

export async function joinInvite(
  code: string,
  payload: { userEmail: string }
): Promise<JoinInviteResponse> {
  return request<JoinInviteResponse>(`/invites/${encodeURIComponent(code)}/join`, {
    method: "POST",
    body: payload,
  });
}

export async function listTasks(groupId: string): Promise<Task[]> {
  return request<Task[]>(`/groups/${groupId}/tasks`);
}

export async function createTask(
  groupId: string,
  payload: {
    name: string;
    description?: string;
    deadline?: string;
    frequency: string;
    priority?: "alta" | "media" | "baja";
  }
): Promise<Task> {
  return request<Task>(`/groups/${groupId}/tasks`, {
    method: "POST",
    body: payload,
  });
}

export async function assignTask(
  taskId: string,
  payload: { assignedToEmail: string }
): Promise<Task> {
  return request<Task>(`/tasks/${taskId}/assignee`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  return request<void>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}
