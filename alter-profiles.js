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

const alterQuery = `
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
`;

runSQL(alterQuery);
