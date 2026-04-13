/**
 * Moderation Service
 * Handles content reporting
 */

import {API_CONFIG} from '@config/api';
import apiClient from './apiClient';
import {
  Report,
  CreateReportRequest,
  PaginatedResponse,
} from '@types';

export const moderationService = {
  /**
   * Create a report
   */
  createReport: async (data: CreateReportRequest): Promise<Report> => {
    return apiClient.post<Report>(API_CONFIG.ENDPOINTS.REPORTS, data);
  },

  /**
   * Get my reports
   */
  getMyReports: async (status?: string): Promise<PaginatedResponse<Report>> => {
    const params = status ? `?status=${status}` : '';
    return apiClient.get<PaginatedResponse<Report>>(
      `${API_CONFIG.ENDPOINTS.MY_REPORTS}${params}`,
    );
  },

  /**
   * Get report by ID
   */
  getReport: async (id: number): Promise<Report> => {
    return apiClient.get<Report>(`${API_CONFIG.ENDPOINTS.REPORTS}${id}/`);
  },
};

export default moderationService;
