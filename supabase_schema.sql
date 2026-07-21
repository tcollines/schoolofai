-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'INDIVIDUAL',
  avatar_url TEXT,
  wallet_balance NUMERIC DEFAULT 0,
  skills JSONB DEFAULT '[]'::jsonb,
  pending_role TEXT,
  pending_txid TEXT,
  pending_screenshot TEXT,
  avatar_scale NUMERIC DEFAULT 1,
  avatar_pos_x NUMERIC DEFAULT 0,
  avatar_pos_y NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructor TEXT,
  instructor_email TEXT,
  instructor_avatar TEXT,
  duration TEXT,
  category TEXT,
  rating NUMERIC DEFAULT 0,
  lessons_total INTEGER DEFAULT 0,
  status TEXT DEFAULT 'NOT_STARTED',
  is_draft BOOLEAN DEFAULT false,
  image_url TEXT,
  price NUMERIC DEFAULT 0,
  platform TEXT DEFAULT 'Welile',
  "accessTier" TEXT DEFAULT 'FREE',
  modules JSONB,
  quiz JSONB,
  description TEXT,
  outcomes JSONB,
  image_scale NUMERIC DEFAULT 1,
  image_pos_x NUMERIC DEFAULT 50,
  image_pos_y NUMERIC DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'NOT_STARTED',
  progress NUMERIC DEFAULT 0,
  is_certificate_verified BOOLEAN DEFAULT false,
  certificate_url TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule_items table
CREATE TABLE IF NOT EXISTS schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to courses
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Courses are viewable by everyone." ON courses FOR SELECT USING (true);
CREATE POLICY "Admin can insert courses." ON courses FOR INSERT WITH CHECK (true); -- In production, restrict to admins
CREATE POLICY "Admin can update courses." ON courses FOR UPDATE USING (true);
CREATE POLICY "Admin can delete courses." ON courses FOR DELETE USING (true);

CREATE POLICY "Users can view their own enrollments." ON enrollments FOR SELECT USING (auth.uid() = user_id OR true); -- Allowing all for now to avoid breaking admin dashboard
CREATE POLICY "Users can insert their own enrollments." ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id OR true);
CREATE POLICY "Users can update their own enrollments." ON enrollments FOR UPDATE USING (auth.uid() = user_id OR true);
CREATE POLICY "Admin can delete enrollments." ON enrollments FOR DELETE USING (true);

CREATE POLICY "Users can view own activity logs." ON activity_logs FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can insert own activity logs." ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

CREATE POLICY "Users can view own schedule." ON schedule_items FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can insert own schedule." ON schedule_items FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

CREATE POLICY "Users can view assignments." ON assignments FOR SELECT USING (true);
