/**
 * Swipe Service
 * Handles swipe listings and matches
 */

import {API_CONFIG} from '@config/api';
import apiClient from './apiClient';
import {
  SwipeListing,
  SwipeListingDetail,
  CreateListingRequest,
  SwipeMatch,
  CreateMatchRequest,
  SwipeStats,
  PaginatedResponse,
  ListingType,
  Campus,
  ListingStatus,
} from '@types';

export interface SwipeListingFilters {
  type?: ListingType;
  campus?: Campus;
  status?: ListingStatus;
  active?: boolean;
  exclude_mine?: boolean;
  search?: string;
  ordering?: string;
}

export const swipeService = {
  /**
   * Get all swipe listings with filters
   */
  getListings: async (
    filters?: SwipeListingFilters,
  ): Promise<PaginatedResponse<SwipeListing>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${API_CONFIG.ENDPOINTS.SWIPE_LISTINGS}?${params.toString()}`;
    return apiClient.get<PaginatedResponse<SwipeListing>>(url);
  },

  /**
   * Get swipe listing by ID
   */
  getListing: async (id: number): Promise<SwipeListingDetail> => {
    return apiClient.get<SwipeListingDetail>(
      `${API_CONFIG.ENDPOINTS.SWIPE_LISTINGS}${id}/`,
    );
  },

  /**
   * Create a new swipe listing
   */
  createListing: async (data: CreateListingRequest): Promise<SwipeListing> => {
    return apiClient.post<SwipeListing>(API_CONFIG.ENDPOINTS.SWIPE_LISTINGS, data);
  },

  /**
   * Update swipe listing
   */
  updateListing: async (
    id: number,
    data: Partial<CreateListingRequest>,
  ): Promise<SwipeListing> => {
    return apiClient.patch<SwipeListing>(
      `${API_CONFIG.ENDPOINTS.SWIPE_LISTINGS}${id}/`,
      data,
    );
  },

  /**
   * Delete (cancel) swipe listing
   */
  deleteListing: async (id: number): Promise<void> => {
    return apiClient.delete(`${API_CONFIG.ENDPOINTS.SWIPE_LISTINGS}${id}/`);
  },

  /**
   * Get my swipe listings
   */
  getMyListings: async (status?: ListingStatus): Promise<PaginatedResponse<SwipeListing>> => {
    const params = status ? `?status=${status}` : '';
    return apiClient.get<PaginatedResponse<SwipeListing>>(
      `${API_CONFIG.ENDPOINTS.MY_LISTINGS}${params}`,
    );
  },

  /**
   * Create a match between donation and request
   */
  createMatch: async (
    donationId: number,
    requestListingId: number,
  ): Promise<SwipeMatch> => {
    const data: CreateMatchRequest = {request_listing_id: requestListingId};
    return apiClient.post<SwipeMatch>(
      `${API_CONFIG.ENDPOINTS.SWIPE_LISTINGS}${donationId}/match/`,
      data,
    );
  },

  /**
   * Get all matches
   */
  getMatches: async (status?: string): Promise<PaginatedResponse<SwipeMatch>> => {
    const params = status ? `?status=${status}` : '';
    return apiClient.get<PaginatedResponse<SwipeMatch>>(
      `${API_CONFIG.ENDPOINTS.SWIPE_MATCHES}${params}`,
    );
  },

  /**
   * Get match by ID
   */
  getMatch: async (id: number): Promise<SwipeMatch> => {
    return apiClient.get<SwipeMatch>(`${API_CONFIG.ENDPOINTS.SWIPE_MATCHES}${id}/`);
  },

  /**
   * Get my matches
   */
  getMyMatches: async (role?: 'donor' | 'requester', status?: string): Promise<PaginatedResponse<SwipeMatch>> => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);

    const url = `${API_CONFIG.ENDPOINTS.MY_MATCHES}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<PaginatedResponse<SwipeMatch>>(url);
  },

  /**
   * Confirm match completion
   */
  confirmMatch: async (id: number): Promise<SwipeMatch> => {
    return apiClient.post<SwipeMatch>(
      `${API_CONFIG.ENDPOINTS.SWIPE_MATCHES}${id}/confirm/`,
    );
  },

  /**
   * Cancel a match
   */
  cancelMatch: async (id: number): Promise<{message: string; match: SwipeMatch}> => {
    return apiClient.post(
      `${API_CONFIG.ENDPOINTS.SWIPE_MATCHES}${id}/cancel/`,
    );
  },

  /**
   * Get swipe statistics
   */
  getStats: async (): Promise<SwipeStats> => {
    return apiClient.get<SwipeStats>(API_CONFIG.ENDPOINTS.SWIPE_STATS);
  },
};

export default swipeService;
