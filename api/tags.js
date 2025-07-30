import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      // Get all unique tags
      const { data, error } = await supabase
        .from('designs')
        .select('tags');

      if (error) throw error;

      const allTags = new Set();
      data.forEach(design => {
        if (design.tags && Array.isArray(design.tags)) {
          design.tags.forEach(tag => allTags.add(tag));
        }
      });

      res.status(200).json({
        tags: Array.from(allTags).sort(),
        count: allTags.size
      });
    } else if (req.method === 'POST') {
      // Add tag to design
      const { designId, tag } = req.body;

      if (!designId || !tag) {
        return res.status(400).json({ error: 'Missing designId or tag' });
      }

      const { data, error } = await supabase
        .rpc('add_design_tag', {
          design_id: designId,
          tag: tag
        });

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Tag added successfully'
      });
    }
  } catch (error) {
    console.error('Tag operation error:', error);
    res.status(500).json({ error: 'Failed to perform tag operation' });
  }
} 