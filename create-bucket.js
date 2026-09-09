const fs = require('fs');

async function runSQL(query) {
    const token = 'YOUR_SUPABASE_TOKEN';
    const projectRef = 'rlwpdknwyeuprqcymhuu';
    
    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        });
        
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}

const query = `
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for the storage objects
-- Allow public read access
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatars." 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars." 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
`;

runSQL(query);
