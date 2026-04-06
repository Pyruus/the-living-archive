import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminPhoto,
  AdminUser,
  AuditLogEntry,
  PaginatedResult,
  AdminEditMetadataRequest,
  AdminSetStatusRequest,
  AdminLocation,
  AdminCreateLocationRequest,
  AdminUpdateLocationRequest,
} from '../models/admin.model';
import { Report } from '../models/photo.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/admin';


  getPhotos(params: {
    status?: string;
    query?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<AdminPhoto>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('pageSize', params.pageSize ?? 20);

    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.query) httpParams = httpParams.set('query', params.query);

    return this.http.get<PaginatedResult<AdminPhoto>>(
      `${this.baseUrl}/adminphotos`,
      { params: httpParams },
    );
  }

  editPhotoMetadata(
    id: string,
    request: AdminEditMetadataRequest,
  ): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/adminphotos/${id}/metadata`, request);
  }

  setPhotoStatus(
    id: string,
    request: AdminSetStatusRequest,
  ): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/adminphotos/${id}/status`, request);
  }

  deletePhoto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/adminphotos/${id}`);
  }

  restorePhoto(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/adminphotos/${id}/restore`, {});
  }


  getUsers(params: {
    query?: string;
    isBlocked?: boolean;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<AdminUser>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('pageSize', params.pageSize ?? 20);

    if (params.query) httpParams = httpParams.set('query', params.query);
    if (params.isBlocked !== undefined)
      httpParams = httpParams.set('isBlocked', params.isBlocked);

    return this.http.get<PaginatedResult<AdminUser>>(
      `${this.baseUrl}/adminusers`,
      { params: httpParams },
    );
  }

  blockUser(id: string): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/adminusers/${id}/block`, {});
  }

  unblockUser(id: string): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/adminusers/${id}/unblock`, {});
  }


  getLocations(): Observable<AdminLocation[]> {
    return this.http.get<AdminLocation[]>(`${this.baseUrl}/adminlocations`);
  }

  createLocation(request: AdminCreateLocationRequest): Observable<AdminLocation> {
    return this.http.post<AdminLocation>(`${this.baseUrl}/adminlocations`, request);
  }

  updateLocation(id: string, request: AdminUpdateLocationRequest): Observable<AdminLocation> {
    return this.http.put<AdminLocation>(`${this.baseUrl}/adminlocations/${id}`, request);
  }

  deleteLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/adminlocations/${id}`);
  }


  getReports(params: {
    resolved?: boolean;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<Report>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('pageSize', params.pageSize ?? 20);

    if (params.resolved !== undefined)
      httpParams = httpParams.set('resolved', params.resolved);

    return this.http.get<PaginatedResult<Report>>(
      `${this.baseUrl}/reports`,
      { params: httpParams },
    );
  }

  getUnresolvedReportCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/reports/count`);
  }

  resolveReport(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/reports/${id}/resolve`, {});
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/reports/comment/${commentId}`);
  }

  restoreComment(commentId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/reports/comment/${commentId}/restore`, {});
  }


  getAuditLogs(params: {
    action?: string;
    adminId?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PaginatedResult<AuditLogEntry>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('pageSize', params.pageSize ?? 50);

    if (params.action) httpParams = httpParams.set('action', params.action);
    if (params.adminId) httpParams = httpParams.set('adminId', params.adminId);

    return this.http.get<PaginatedResult<AuditLogEntry>>(
      `${this.baseUrl}/auditlogs`,
      { params: httpParams },
    );
  }
}
