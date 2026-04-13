/**
 * Forum Service
 * Handles forum posts and comments
 */

import {API_CONFIG} from '@config/api';
import apiClient from './apiClient';
import {
  Post,
  PostDetail,
  CreatePostRequest,
  Comment,
  CreateCommentRequest,
  PostStats,
  PaginatedResponse,
  PostCategory,
} from '@types';

export interface PostFilters {
  category?: PostCategory;
  user?: number;
  search?: string;
  ordering?: string;
}

export const forumService = {
  /**
   * Get all posts with filters
   */
  getPosts: async (filters?: PostFilters): Promise<PaginatedResponse<Post>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${API_CONFIG.ENDPOINTS.POSTS}${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<PaginatedResponse<Post>>(url);
  },

  /**
   * Get post by ID with recent comments
   */
  getPost: async (id: number): Promise<PostDetail> => {
    return apiClient.get<PostDetail>(`${API_CONFIG.ENDPOINTS.POSTS}${id}/`);
  },

  /**
   * Create a new post
   */
  createPost: async (data: CreatePostRequest): Promise<Post> => {
    return apiClient.post<Post>(API_CONFIG.ENDPOINTS.POSTS, data);
  },

  /**
   * Update post
   */
  updatePost: async (id: number, data: Partial<CreatePostRequest>): Promise<Post> => {
    return apiClient.patch<Post>(`${API_CONFIG.ENDPOINTS.POSTS}${id}/`, data);
  },

  /**
   * Delete post
   */
  deletePost: async (id: number): Promise<void> => {
    return apiClient.delete(`${API_CONFIG.ENDPOINTS.POSTS}${id}/`);
  },

  /**
   * Get my posts
   */
  getMyPosts: async (includeInactive = false): Promise<PaginatedResponse<Post>> => {
    const params = includeInactive ? '?include_inactive=true' : '';
    return apiClient.get<PaginatedResponse<Post>>(
      `${API_CONFIG.ENDPOINTS.MY_POSTS}${params}`,
    );
  },

  /**
   * Like or unlike a post
   */
  toggleLike: async (id: number): Promise<{liked: boolean; likes_count: number; message: string}> => {
    return apiClient.post(`${API_CONFIG.ENDPOINTS.POSTS}${id}/like/`);
  },

  /**
   * Get post statistics
   */
  getPostStats: async (): Promise<PostStats> => {
    return apiClient.get<PostStats>(API_CONFIG.ENDPOINTS.POST_STATS);
  },

  /**
   * Get comments for a post
   */
  getComments: async (postId: number): Promise<PaginatedResponse<Comment>> => {
    return apiClient.get<PaginatedResponse<Comment>>(
      `${API_CONFIG.ENDPOINTS.COMMENTS}?post=${postId}`,
    );
  },

  /**
   * Create a comment
   */
  createComment: async (data: CreateCommentRequest): Promise<Comment> => {
    return apiClient.post<Comment>(API_CONFIG.ENDPOINTS.COMMENTS, data);
  },

  /**
   * Update comment
   */
  updateComment: async (id: number, content: string): Promise<Comment> => {
    return apiClient.patch<Comment>(`${API_CONFIG.ENDPOINTS.COMMENTS}${id}/`, {
      content,
    });
  },

  /**
   * Delete comment
   */
  deleteComment: async (id: number): Promise<void> => {
    return apiClient.delete(`${API_CONFIG.ENDPOINTS.COMMENTS}${id}/`);
  },

  /**
   * Get my comments
   */
  getMyComments: async (): Promise<PaginatedResponse<Comment>> => {
    return apiClient.get<PaginatedResponse<Comment>>(API_CONFIG.ENDPOINTS.MY_COMMENTS);
  },
};

export default forumService;
