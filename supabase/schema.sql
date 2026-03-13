-- Create Dogs Table (Primary User Entity)
CREATE TABLE dogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  weight NUMERIC,
  primary_food_brand TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on dogs
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all dogs (for searching friends)
CREATE POLICY "Allow public read access to dogs" ON dogs 
FOR SELECT USING (true);

-- Allow insertion of new dogs 
CREATE POLICY "Allow public insert of dogs" ON dogs 
FOR INSERT WITH CHECK (true);

-- Allow updates to dogs (Ideally this would be authenticated, but we'll leave open for simple mockup flow)
CREATE POLICY "Allow public update of dogs" ON dogs 
FOR UPDATE USING (true);


-- Create Poops (Business Trips) Table
CREATE TABLE poops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  image_url TEXT,
  consistency TEXT,
  color TEXT,
  anomalies TEXT,
  health_score INTEGER,
  summary TEXT,
  note TEXT,
  privacy_setting TEXT DEFAULT 'score_only' CHECK (privacy_setting IN ('score_only', 'photo_and_score')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on poops
ALTER TABLE poops ENABLE ROW LEVEL SECURITY;

-- Allow public reading of poops (we will handle feed filtering in the app logic layer for now)
CREATE POLICY "Allow public read of poops" ON poops 
FOR SELECT USING (true);

-- Allow public insertion of poops
CREATE POLICY "Allow public insert of poops" ON poops 
FOR INSERT WITH CHECK (true);


-- Create Friendships Table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id_1 UUID REFERENCES dogs(id) ON DELETE CASCADE,
  dog_id_2 UUID REFERENCES dogs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dog_id_1, dog_id_2)
);

-- Enable RLS on friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Allow public read of friendships
CREATE POLICY "Allow public read of friendships" ON friendships 
FOR SELECT USING (true);

-- Allow public insert/update of friendships
CREATE POLICY "Allow public insert of friendships" ON friendships 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update of friendships" ON friendships 
FOR UPDATE USING (true);

-- Run this command manually to update existing dogs table if already created:
-- ALTER TABLE dogs ADD COLUMN profile_picture_url TEXT;

-- Create the poop_images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('poop_images', 'poop_images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (everyone can see the poops)
CREATE POLICY "Public read poops" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'poop_images');

-- Allow anon insertions (your frontend users can upload their own poops)
CREATE POLICY "Anon insert poops" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'poop_images');

-- Allow anon updates
CREATE POLICY "Anon update poops" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'poop_images');
