/**
 * TypeScript type definitions for Fordham SwipeShare
 */

// User Types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  fordham_id?: string;
  campus: 'RH' | 'LC';
  profile_picture?: string;
  bio?: string;
  phone_number?: string;
  swipes_donated: number;
  swipes_received: number;
  reliability_score: string;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface MinimalUser {
  id: number;
  full_name: string;
  campus: 'RH' | 'LC';
  profile_picture?: string;
  reliability_score?: string;
}

// Auth Types
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: User;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  full_name: string;
  campus: 'RH' | 'LC';
  phone_number?: string;
}

// Swipe Listing Types
export type ListingType = 'donation' | 'request';
export type ListingStatus = 'open' | 'pending' | 'completed' | 'cancelled';
export type Campus = 'RH' | 'LC';

export interface SwipeListing {
  id: number;
  user: MinimalUser;
  type: ListingType;
  campus: Campus;
  dining_hall?: string;
  quantity: number;
  available_date: string;
  available_time?: string;
  meeting_location?: string;
  notes?: string;
  status: ListingStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SwipeListingDetail extends SwipeListing {
  match_count: number;
  can_edit: boolean;
}

export interface CreateListingRequest {
  type: ListingType;
  campus: Campus;
  dining_hall?: string;
  quantity: number;
  available_date: string;
  available_time?: string;
  meeting_location?: string;
  notes?: string;
}

// Swipe Match Types
export type MatchStatus = 'pending' | 'completed' | 'cancelled';

export interface SwipeMatch {
  id: number;
  donation_listing: SwipeListing;
  request_listing: SwipeListing;
  donor: MinimalUser;
  requester: MinimalUser;
  firebase_conversation_id?: string;
  status: MatchStatus;
  completed_at?: string;
  donor_confirmed: boolean;
  requester_confirmed: boolean;
  created_at: string;
}

export interface CreateMatchRequest {
  request_listing_id: number;
}

// Forum Types
export type PostCategory = 'housing' | 'marketplace' | 'rideshare' | 'events' | 'general';

export interface Post {
  id: number;
  user: MinimalUser;
  category: PostCategory;
  title: string;
  content: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  is_active: boolean;
  is_liked: boolean;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostDetail extends Post {
  recent_comments: Comment[];
}

export interface CreatePostRequest {
  category: PostCategory;
  title: string;
  content: string;
  images?: string[];
}

export interface Comment {
  id: number;
  post: number;
  user: MinimalUser;
  content: string;
  is_deleted: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentRequest {
  post: number;
  content: string;
}

// Report Types
export type ContentType = 'post' | 'comment' | 'user' | 'swipe_listing';
export type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'scam' | 'other';
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';

export interface Report {
  id: number;
  reporter: MinimalUser;
  content_type: ContentType;
  content_id: number;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  admin_notes?: string;
  reviewed_by?: MinimalUser;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportRequest {
  content_type: ContentType;
  content_id: number;
  reason: ReportReason;
  description?: string;
}

// Statistics Types
export interface UserStats {
  id: number;
  full_name: string;
  campus: Campus;
  swipes_donated: number;
  swipes_received: number;
  reliability_score: string;
  total_swipes_exchanged: number;
  active_listings_count: number;
  active_matches_count: number;
  posts_count: number;
}

export interface SwipeStats {
  total_donations: number;
  total_requests: number;
  active_listings: number;
  completed_matches: number;
  pending_matches: number;
}

export interface PostStats {
  total_posts: number;
  active_posts: number;
  total_comments: number;
  total_likes_received: number;
  posts_by_category: Record<string, number>;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: {email: string; token?: string};
};

export type MainTabParamList = {
  Home: undefined;
  Swipes: undefined;
  Forum: undefined;
  Profile: undefined;
};

export type SwipesStackParamList = {
  SwipesList: undefined;
  SwipeDetail: {id: number};
  CreateSwipe: undefined;
  MyListings: undefined;
  MyMatches: undefined;
  MatchDetail: {id: number};
};

export type ForumStackParamList = {
  PostsList: undefined;
  PostDetail: {id: number};
  CreatePost: undefined;
  MyPosts: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  UserStats: undefined;
  Settings: undefined;
  ChangePassword: undefined;
};
