const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function runSQL(query) {
    const token = process.env.ACCESS_TOKEN || 'YOUR_SUPABASE_TOKEN';
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
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS interests TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Notify PostgREST to reload the schema cache so it picks up the new columns immediately
NOTIFY pgrst, 'reload schema';
`;

runSQL(query);
