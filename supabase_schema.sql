-- Create the designs table
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  is_sold BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the ratings table
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(design_id, visitor_id)
);

-- Create indexes for better performance
CREATE INDEX idx_designs_filename ON designs(filename);
CREATE INDEX idx_designs_sold ON designs(is_sold);
CREATE INDEX idx_designs_created_at ON designs(created_at DESC);
CREATE INDEX idx_designs_tags ON designs USING GIN (tags);
CREATE INDEX idx_ratings_design_id ON ratings(design_id);
CREATE INDEX idx_ratings_visitor_id ON ratings(visitor_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to delete designs by ID (for admin operations)
CREATE OR REPLACE FUNCTION delete_design_by_id(design_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM designs WHERE id = design_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a tag to a design
CREATE OR REPLACE FUNCTION add_design_tag(design_id UUID, tag TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE designs 
    SET tags = tags || jsonb_build_array(tag)
    WHERE id = design_id AND NOT (tags @> jsonb_build_array(tag));
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a tag from a design
CREATE OR REPLACE FUNCTION remove_design_tag(design_id UUID, tag TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE designs 
    SET tags = tags - tag
    WHERE id = design_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search designs by tags
CREATE OR REPLACE FUNCTION search_designs_by_tags(tag_array TEXT[])
RETURNS TABLE(
    id UUID,
    filename TEXT,
    name TEXT,
    image_url TEXT,
    is_sold BOOLEAN,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.filename, d.name, d.image_url, d.is_sold, d.tags, d.created_at
    FROM designs d
    WHERE d.tags ?| tag_array
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_designs_updated_at 
  BEFORE UPDATE ON designs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for design statistics
CREATE VIEW design_stats AS
SELECT 
  d.id,
  d.filename,
  d.name,
  d.image_url,
  d.is_sold,
  d.tags,
  d.created_at,
  COUNT(r.id) as total_ratings,
  AVG(r.rating) as average_rating,
  MIN(r.rating) as min_rating,
  MAX(r.rating) as max_rating
FROM designs d
LEFT JOIN ratings r ON d.id = r.design_id
GROUP BY d.id, d.filename, d.name, d.image_url, d.is_sold, d.tags, d.created_at
ORDER BY d.created_at DESC;

-- Enable Row Level Security (RLS)
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can view designs" ON designs
  FOR SELECT USING (true);

CREATE POLICY "Public can view ratings" ON ratings
  FOR SELECT USING (true);

-- Create policies for public insert access (for bulk upload)
CREATE POLICY "Public can insert designs" ON designs
  FOR INSERT WITH CHECK (true);

-- Create policies for public update access (for admin panel)
CREATE POLICY "Public can update designs" ON designs
  FOR UPDATE USING (true);

-- Create policies for public delete access (for admin panel)
CREATE POLICY "Public can delete designs" ON designs
  FOR DELETE USING (true);

-- Alternative more permissive delete policy (if the above doesn't work)
CREATE POLICY "Allow all delete operations" ON designs
  FOR DELETE USING (true);

-- Create policies for authenticated users to insert ratings
CREATE POLICY "Public can insert ratings" ON ratings
  FOR INSERT WITH CHECK (true);

-- Create policy for public to update ratings (needed for upsert)
CREATE POLICY "Public can update ratings" ON ratings
  FOR UPDATE USING (true);

-- Create policy for public to delete ratings (needed for rating updates)
CREATE POLICY "Public can delete ratings" ON ratings
  FOR DELETE USING (true);

-- Create policies for admin operations (you'll need to set up authentication)
-- These are examples - adjust based on your auth setup
CREATE POLICY "Admin can manage designs" ON designs
  FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admin can manage ratings" ON ratings
  FOR ALL USING (auth.role() = 'admin');

-- Create storage bucket for design images
INSERT INTO storage.buckets (id, name, public) VALUES ('designs', 'designs', true);

-- Create storage policies for public access to design images
CREATE POLICY "Public can view design images" ON storage.objects
  FOR SELECT USING (bucket_id = 'designs');

CREATE POLICY "Public can upload design images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'designs');

CREATE POLICY "Public can update design images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'designs');

CREATE POLICY "Public can delete design images" ON storage.objects
  FOR DELETE USING (bucket_id = 'designs');