import { Course, CourseStatus, UserRole, UserProfile, WalletTransaction } from './types';

export const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Taylor Smith',
  email: 'taylor.s@welile.student.com',
  role: UserRole.SPONSORED,
  avatar: 'https://picsum.photos/200/200',
  location: 'Cape Town, South Africa',
  companyName: 'TechCorp Solutions',
  walletBalance: 450.00,
  skills: ['Communication', 'Basic HTML'],
  careerGoal: 'Product Designer'
};

export const MOCK_COURSES: Course[] = [];

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: 't1', date: '2023-10-15', description: 'Course Enrollment: 3D Design', amount: 120.00, type: 'DEBIT', status: 'COMPLETED' },
  { id: 't2', date: '2023-10-10', description: 'Company Sponsorship Top-up', amount: 500.00, type: 'CREDIT', status: 'COMPLETED' },
  { id: 't3', date: '2023-09-28', description: 'Course Enrollment: Photography', amount: 29.99, type: 'DEBIT', status: 'COMPLETED' },
];

export const ASSESSMENT_QUESTIONS = [
  "I enjoy solving complex logical puzzles.",
  "I prefer working in a team rather than alone.",
  "I am interested in how visual aesthetics influence emotions.",
  "I like organizing and structuring data.",
  "I am comfortable speaking in public.",
  "I prefer hands-on learning over reading theory.",
  "I am interested in the business side of products.",
  "I find coding and automation fascinating.",
]; // Shortened for demo purposes, prompt asked for structure, 8 is enough to demo AI