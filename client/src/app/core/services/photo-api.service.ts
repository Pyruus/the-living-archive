import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Photo,
  PhotoSearchItem,
  Comment,
  CreatePhotoRequest,
  CreateLocationRequest,
  UpdatePhotoRequest,
  HierarchyNode,
  SearchParams,
  SearchResult,
} from '../models/photo.model';

@Injectable({ providedIn: 'root' })
export class PhotoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';


  getPhoto(id: string): Observable<PhotoSearchItem> {
    return this.http.get<PhotoSearchItem>(`${this.baseUrl}/public/search/photos/${id}`);
  }

  searchPhotos(params: SearchParams): Observable<SearchResult> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('pageSize', params.pageSize ?? 20);

    if (params.query) httpParams = httpParams.set('query', params.query);
    if (params.period) httpParams = httpParams.set('period', params.period);
    if (params.locationId) httpParams = httpParams.set('locationId', params.locationId);

    return this.http.get<SearchResult>(`${this.baseUrl}/public/search/photos`, {
      params: httpParams,
    });
  }

  getLocations(): Observable<HierarchyNode[]> {
    return this.http.get<HierarchyNode[]>(`${this.baseUrl}/public/search/locations`);
  }


  uploadPhoto(request: CreatePhotoRequest, file?: File): Observable<{ id: string; title: string; status: string }> {
    const formData = new FormData();
    formData.append('hierarchyNodeId', request.hierarchyNodeId);
    formData.append('title', request.title);
    if (request.description) formData.append('description', request.description);
    if (request.photoDate) formData.append('photoDate', request.photoDate);
    if (file) formData.append('file', file, file.name);

    return this.http.post<{ id: string; title: string; status: string }>(
      `${this.baseUrl}/creator/photos`,
      formData,
    );
  }

  getMyPhotos(page = 1, pageSize = 20): Observable<Photo[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<Photo[]>(`${this.baseUrl}/creator/photos`, { params });
  }

  getMyPhoto(id: string): Observable<Photo> {
    return this.http.get<Photo>(`${this.baseUrl}/creator/photos/${id}`);
  }

  updatePhoto(id: string, request: UpdatePhotoRequest): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/creator/photos/${id}`, request);
  }

  deletePhoto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/creator/photos/${id}`);
  }


  getComments(photoId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.baseUrl}/public/comments/${photoId}`);
  }

  addComment(photoId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.baseUrl}/public/comments`, { photoId, content });
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/public/comments/${commentId}`);
  }

  reportComment(commentId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/public/comments/report`, { targetId: commentId, reason });
  }

  reportPhoto(photoId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/public/comments/report-photo`, { targetId: photoId, reason });
  }


  createLocation(request: CreateLocationRequest): Observable<HierarchyNode> {
    return this.http.post<HierarchyNode>(`${this.baseUrl}/creator/locations`, request);
  }
}
