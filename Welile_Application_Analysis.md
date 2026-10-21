# Welile School of AI - Application Analysis

## 1. Overview
The Welile School of AI platform is a comprehensive Learning Management System (LMS) designed for both students and administrators. It operates as a monorepo containing two main web applications:
- **Student Dashboard (`/frontend`)**: The main interface for students to discover, enroll in, and consume educational content.
- **Admin Portal (`/admin-portal`)**: A management interface for instructors and administrators to create courses, track enrollments, and manage the platform.

A custom local development proxy (`dev-proxy.js`) dynamically routes traffic to either application based on the requested hostname (e.g., `admin.localhost`).

## 2. Technology Stack
The application is built on a modern, robust web development stack:
- **Core UI Framework**: React 19 (using TypeScript for type safety).
- **Build System**: Vite 6, providing fast HMR and optimized production builds.
- **Routing**: React Router v7 for client-side navigation and protected routes.
- **Backend/Database**: Supabase. Used for user authentication (JWTs), database interactions (PostgreSQL), and realtime data synchronization.
- **Styling & Visualization**: TailwindCSS (implied via Lucide) for styling, Recharts for analytics dashboards, and Lucide React for consistent iconography.
- **Advanced Features**: Integrates Google Generative AI (`@google/genai`) for potential AI tutoring/assistant features, and OGL for 3D/WebGL experiences.

## 3. Core Features

### Student Dashboard
- **Authentication & Onboarding**: Complete flows for signup, login, email verification, and profile setup. New users are seamlessly guided through an onboarding pipeline before accessing the main dashboard.
- **Course Discovery & Enrollment**: Students can browse a catalog of courses categorized by access tiers (FREE vs. PAID).
- **Interactive Learning Player**: The platform features a modular course player supporting various content types: video, audio, articles, quizzes, and external documents.
- **Assessments & Certifications**: Dedicated exam players evaluate student performance. Upon successful completion, verifiable certificates are awarded.
- **Community & Social**: Built-in discussion forums and live event tracking to foster peer-to-peer engagement.
- **Subscription Management (Plans)**: Integrated wallet and billing management supporting different subscription tiers (Individual, Plus, Pro, Sponsored).

### Admin Portal
- **Dashboard Analytics**: High-level overviews of platform health, including active students, course completion rates, and revenue metrics.
- **Course & Exam Authoring**: Comprehensive tools to draft, edit, and publish courses, modules, and quizzes.
- **User & Enrollment Management**: Admins can oversee student progress, assign grades, and manage instructor accounts.
- **Communications**: Integrated mailing and notification tools for mass communication with the student body.

## 4. Application Logic & Architecture

### Authentication & Session State
The application relies on Supabase Auth. In `App.tsx`, a global listener (`supabase.auth.onAuthStateChange`) triggers whenever a user logs in or out. 
- The session is stored in React state.
- If a user lacks a completed profile (`onboarding_complete === false`), the `ProtectedRoute` wrapper automatically redirects them to the `/onboarding/profile` flow, ensuring data integrity.

### Role-Based Access Control (RBAC)
Access rights are strictly enforced on the client side using the `UserRole` enum (`INDIVIDUAL`, `PLUS`, `PRO`, `SPONSORED`, `ADMIN`, `INSTRUCTOR`).
- **Route Protection**: The `/admin/*` and `/instructor/*` routes verify the user's role before rendering the AdminLayout.
- **Content Gating**: In `DiscoverCourses` and `CourseOverview`, the enrollment logic checks the user's subscription tier against the course's `accessTier`. Basic users attempting to enroll in `PAID` courses are intercepted and redirected to the `/plans` page to upgrade.

### Data Models (Types)
The system is heavily typed for reliability. Key interfaces include:
- `Course` & `CourseModule`: Defines the structure of educational content, including nested sections, video IDs, duration, and associated quizzes.
- `Quiz` & `Question`: Supports multiple question types (multiple choice, true/false, short answer) along with automated grading logic.
- `UserProfile`: Extends the basic auth user with platform-specific fields like wallet balance, skills, career goals, and pending role approvals (for sponsored accounts).

### Realtime Notifications
Upon a successful login event, the global session listener generates a local system notification (e.g., "New Login Detected") and dispatches a custom `notifications-update` window event. This updates the UI seamlessly without requiring a page reload or heavy polling.
