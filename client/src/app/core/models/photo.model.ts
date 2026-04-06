export interface Photo {
  id: string;
  title: string;
  description: string;
  photoDate: string | null;
  filePath: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt: string | null;
  location: string;
}

export interface CreatePhotoRequest {
  hierarchyNodeId: string;
  title: string;
  description?: string;
  photoDate?: string;
}

export interface UpdatePhotoRequest {
  title?: string;
  description?: string;
  photoDate?: string;
}

export interface HierarchyNode {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  level: string;
  latitude: number | null;
  longitude: number | null;
  photoCount: number;
}

export interface CreateLocationRequest {
  parentId?: string;
  name: string;
  level: string;
  latitude?: number;
  longitude?: number;
}

export interface SearchParams {
  query?: string;
  period?: string;
  locationId?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  totalCount: number;
  page: number;
  pageSize: number;
  data: PhotoSearchItem[];
}

export interface PhotoSearchItem extends Photo {
  uploader: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  isReported: boolean;
  author: { id: string; displayName: string };
}

export interface Report {
  id: string;
  reason: string;
  createdAt: string;
  isResolved: boolean;
  resolutionAction: string | null;
  reporterId: string;
  reporterName: string;
  photoId: string | null;
  photoTitle: string | null;
  commentId: string | null;
  commentContent: string | null;
}
