export enum UserRole {
  INDIVIDUAL = 'INDIVIDUAL', // Free
  PLUS = 'PLUS',
  PRO = 'PRO',
  SPONSORED = 'SPONSORED', // Enterprise/All Access
  ADMIN = 'ADMIN'
}

export enum CourseStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export type ModuleType = 'video' | 'article' | 'quiz';

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
  youtubeQuery?: string;
  duration: string;
  videoId?: string;
  videoUrl?: string;
  thumbnail?: string;
  channelTitle?: string;
  content?: string;
}

export interface CourseSection {
  id: string;
  title: string;
  lessons: CourseModule[];
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface Question {
  id: string;
  text: string;
  type?: QuestionType; // optional for backwards compatibility
  options?: string[]; // for multiple_choice
  correctAnswer: number | string | boolean; // index for mc, boolean for t/f, string for short answer
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  timeLimit?: number; // in minutes
  preventTabChange?: boolean;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  category: string;
  rating: number;
  lessonsTotal: number;
  lessonsCompleted: number;
  status: CourseStatus;
  image: string; // Placeholder URL
  price: number;
  platform: 'Welile' | 'Coursera' | 'Partner';
  accessTier?: 'FREE' | 'PAID';
  sections?: CourseSection[];
  modules?: CourseModule[]; // legacy support
  quiz?: Quiz;
  description?: string;
  outcomes?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  bio?: string;
  location?: string;
  companyName?: string; // If sponsored
  walletBalance: number;
  skills: string[];
  careerGoal?: string;
}

export interface WalletTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'COMPLETED' | 'PENDING';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}