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
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS interests TEXT;
-- We need to notify PostgREST to reload the schema cache so it picks up the new columns immediately
NOTIFY pgrst, 'reload schema';
`;

runSQL(query);
