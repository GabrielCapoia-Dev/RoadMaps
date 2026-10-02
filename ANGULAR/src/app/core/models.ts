export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  hasMore: boolean;
}
export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  verifiedAt: string;
  onboardingCompletedAt: string | null;
}
export interface Profile {
  id: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  publicRoadmaps: number;
  createdAt: string;
}
export interface StudyNode {
  id: string;
  type: string;
  title: string;
  description: string;
  required: boolean;
  position: { x: number; y: number };
  color?: string;
  shape?: string;
  resources: { label: string; url: string }[];
}
export interface StudyEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  color?: string;
}
export interface Graph {
  nodes: StudyNode[];
  edges: StudyEdge[];
}
export interface RoadmapSummary {
  id: string;
  ownerId: string;
  authorName: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  visibility: 'public' | 'private';
  revision: number;
  nodeCount: number;
  likes: number;
  followers: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
export interface Roadmap extends Omit<RoadmapSummary, 'nodeCount' | 'likes' | 'followers'> {
  graph: Graph;
  access?: { role: string; canEdit: boolean; canComment: boolean; canManage: boolean };
}
export interface Progress {
  total: number;
  completed: number;
  inProgress: number;
  remaining: number;
  percent: number;
  nodes: { nodeId: string; required: boolean; status: StudyStatus }[];
}
export type StudyStatus = 'not_started' | 'in_progress' | 'completed';
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  parentId: string | null;
  body: string;
  createdAt: string;
}
export interface Reactions {
  likes: number;
  followers: number;
  mine: string[];
}
export interface Member {
  userId: string;
  name: string;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
}
