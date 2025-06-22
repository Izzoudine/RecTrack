-- Existing departments table

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acronym TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;



CREATE POLICY "Allow everyone to read departments"
ON public.departments
FOR SELECT
TO public
USING (true);

-- Existing profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  departmentid UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT departmentid_null_for_admin CHECK (
    (role = 'admin' AND departmentid IS NULL) OR
    (role = 'user' AND departmentid IS NOT NULL)
  )
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage departments
CREATE POLICY "Allow admins to manage departments"
  ON public.departments
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid() = profiles.user_id
     FROM public.profiles
     WHERE profiles.role = 'admin')
  );


CREATE POLICY "Allow users to view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profiles.user_id);

CREATE POLICY "Allow users to update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = profiles.user_id);

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = $1 AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON public.profiles;

CREATE POLICY "Allow admins to view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Allow admins to manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));
-- Existing trigger for profile creation
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role, departmentid)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Default Name'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'user') = 'user' THEN
        COALESCE((NEW.raw_user_meta_data->>'departmentId')::UUID, NULL)
      ELSE
        NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

-- Drop existing recommendations table to update schema
DROP TABLE IF EXISTS public.recommendations;

-- Create recommendations table
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  departmentid UUID REFERENCES public.departments(id),
  content TEXT NOT NULL, -- Combines title and description
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'confirmed', 'overdue')) DEFAULT 'in_progress',
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on recommendations
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage all recommendations
CREATE POLICY "Allow admins to manage recommendations"
  ON public.recommendations
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid() = profiles.user_id
     FROM public.profiles
     WHERE profiles.role = 'admin')
  );

-- Allow users to view their own recommendations
CREATE POLICY "Allow users to view own recommendations"
  ON public.recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to view recommendations for their department
CREATE POLICY "Allow users to view department recommendations"
  ON public.recommendations
  FOR SELECT
  TO authenticated
  USING (
    departmentid = (SELECT departmentid
                    FROM public.profiles
                    WHERE user_id = auth.uid())
  );

-- Function to update updated_at timestamp

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at for recommendations
CREATE TRIGGER on_recommendation_updated
  BEFORE UPDATE ON public.recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to check overdue recommendations
CREATE OR REPLACE FUNCTION public.check_overdue_recommendations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deadline < CURRENT_TIMESTAMP AND NEW.status = 'in_progress' THEN
    NEW.status = 'overdue';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check overdue status
CREATE TRIGGER on_recommendation_deadline
  BEFORE INSERT OR UPDATE ON public.recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_overdue_recommendations();
