export enum UserRole {
  INDIVIDUAL = 'INDIVIDUAL', // Free
  PLUS = 'PLUS',
  PRO = 'PRO',
  SPONSORED = 'SPONSORED', // Enterprise/All Access
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR'
}

export enum CourseStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export type ModuleType = 'video' | 'article' | 'quiz' | 'audio' | 'document';

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
  youtubeQuery?: string;
  duration: string;
  videoId?: string;
  videoUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  thumbnail?: string;
  channelTitle?: string;
  content?: string;
  quizTimer?: number;
  quizQuestions?: Question[];
  // Cohort-based additions
  introVideoUrl?: string;
  courseOutline?: any[]; // JSON array of topics
  quizId?: string;
  // Curriculum Expansion
  lessonNotesUrl?: string;
  presentationUrl?: string;
  classType?: 'online' | 'physical' | 'none';
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  meetLink?: string;
  isFinalExam?: boolean;
  attendanceCode?: string;
}

export interface CourseSection {
  id: string;
  title: string;
  explainerVideoUrl?: string;
  lessons: CourseModule[];
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface Question {
  id: string;
  text: string;
  type?: QuestionType; // optional for backwards compatibility
  options?: string[]; // for multiple_choice
  correctAnswer: number | string | boolean; // index for mc, boolean for t/f, string for short answer
  gradingGuide?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  timeLimit?: number; // in minutes
  preventTabChange?: boolean;
  isDraft?: boolean;
}

export interface Tutor {
  id: string;
  full_name: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  type: string; // 'University' | 'Company'
  logo?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorEmail?: string;
  instructorAvatar?: string;
  duration: string;
  category: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  rating: number;
  lessonsTotal: number;
  lessonsCompleted: number;
  status: CourseStatus;
  isDraft?: boolean;
  isVerified?: boolean;
  image: string; // Placeholder URL
  price: number;
  accessTier?: 'FREE' | 'PAID' | 'CUSTOM' | string;
  partnerId?: string; // Links to partners table
  tutorId?: string; // Links to tutors table
  sections?: CourseSection[];
  modules?: CourseModule[]; // legacy support
  quiz?: Quiz;
  description?: string;
  outcomes?: string[];
  courseIntroVideoUrl?: string;
  courseNotesUrl?: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  examCompleted?: boolean;
  examScore?: number;
  certificateUrl?: string;
  isCertificateVerified?: boolean;
  examMarksReleased?: boolean;
  quizScore?: number;
  finalScore?: number;
  startDate?: string;
  endDate?: string;
  lessonDays?: string[];
  lessonStartTime?: string;
  lessonEndTime?: string;
  timezone?: string;
  meetingLink?: string;
  attendanceCode?: string;
  cohortName?: string;
  cohorts?: { id: string; name: string; startDate: string; endDate: string }[];
  quizDate?: string;
  examDate?: string;
}

// Cohort-Based LMS Interfaces
export interface CourseNote {
  id: string;
  course_id: string;
  content: string;
  created_at: string;
}

export interface Cohort {
  id: string;
  course_id: string;
  name: string;
  start_date: string;
  orientation_end_date: string;
  created_at: string;
}

export interface CohortSession {
  id: string;
  cohort_id: string;
  module_id: string;
  session_date: string;
  location_link?: string;
  attendance_code: string;
  created_at: string;
}

export interface ModuleCompletion {
  id: string;
  user_id: string;
  cohort_id: string;
  module_id: string;
  attendance_code_submitted: boolean;
  quiz_passed: boolean;
  created_at: string;
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
  nationality?: string;
  dateOfBirth?: string;
  pending_role?: string;
  pending_txid?: string;
  pending_screenshot?: string;
  avatarScale?: number;
  avatarPositionX?: number;
  avatarPositionY?: number;
  password?: string;
  onboarding_complete?: boolean;
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