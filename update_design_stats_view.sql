-- Update the design_stats view to include tags
DROP VIEW IF EXISTS design_stats;

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