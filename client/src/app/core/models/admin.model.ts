export interface AdminPhoto {
  id: string;
  title: string;
  description: string;
  photoDate: string | null;
  filePath: string | null;
  status: string;
  createdAt: string;
  uploader: { id: string; displayName: string; email: string };
  hierarchyNodeId: string;
  location: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  photoCount: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetId: string;
  timestamp: string;
  admin: { id: string; displayName: string; email: string };
}

export interface PaginatedResult<T> {
  totalCount: number;
  page: number;
  pageSize: number;
  data: T[];
}

export interface AdminEditMetadataRequest {
  title?: string;
  description?: string;
  photoDate?: string;
  hierarchyNodeId?: string;
}

export interface AdminSetStatusRequest {
  status: string;
}

export interface AdminLocation {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  level: string;
  latitude: number | null;
  longitude: number | null;
  photoCount: number;
  childCount: number;
}

export interface AdminCreateLocationRequest {
  parentId?: string;
  name: string;
  level: string;
  latitude?: number;
  longitude?: number;
}

export interface AdminUpdateLocationRequest {
  name?: string;
  latitude?: number;
  longitude?: number;
}
