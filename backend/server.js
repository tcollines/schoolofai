const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const path = require('path');
const { DatabaseAdapter, supabase } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Set up multer to store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage() });

// ----------------------------------------------------
// Health Check
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        databaseReady: DatabaseAdapter.isReady(),
        time: new Date().toISOString()
    });
});

// ----------------------------------------------------
// Authentication Routes (/api/auth)
// ----------------------------------------------------
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, options } = req.body;
        if (!supabase) return res.status(500).json({ error: 'Database service not configured' });
        const { data, error } = await supabase.auth.signUp({ email, password, options });
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!supabase) return res.status(500).json({ error: 'Database service not configured' });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/auth/session', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (!token || !supabase) return res.json({ session: null });

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.json({ session: null });
        res.json({ session: { user, access_token: token } });
    } catch (err) {
        res.json({ session: null });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    res.json({ success: true });
});

// ----------------------------------------------------
// Data Access Routes (/api/data/:table)
// ----------------------------------------------------
app.get('/api/data/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const { select = '*', order, limit, single, ...filters } = req.query;

        // Parse special query params
        const cleanFilters = {};
        for (const [k, v] of Object.entries(filters)) {
            if (v !== undefined && v !== null && v !== '') {
                if (typeof v === 'string' && v.startsWith('eq.')) {
                    cleanFilters[k] = v.substring(3);
                } else {
                    cleanFilters[k] = v;
                }
            }
        }

        const result = await DatabaseAdapter.query(table, {
            select,
            filters: cleanFilters,
            order,
            limit,
            single: single === 'true' || single === true
        });

        if (result.error) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.post('/api/data/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const isUpsert = req.query.upsert === 'true';
        const result = isUpsert 
            ? await DatabaseAdapter.upsert(table, req.body)
            : await DatabaseAdapter.insert(table, req.body);
        if (result.error) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.patch('/api/data/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const filters = {};
        for (const [k, v] of Object.entries(req.query)) {
            if (typeof v === 'string' && v.startsWith('eq.')) {
                filters[k] = v.substring(3);
            } else {
                filters[k] = v;
            }
        }

        const result = await DatabaseAdapter.update(table, req.body, filters);
        if (result.error) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.delete('/api/data/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const filters = {};
        for (const [k, v] of Object.entries(req.query)) {
            if (typeof v === 'string' && v.startsWith('eq.')) {
                filters[k] = v.substring(3);
            } else {
                filters[k] = v;
            }
        }

        const result = await DatabaseAdapter.delete(table, filters);
        if (result.error) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// ----------------------------------------------------
// Storage Routes (/api/storage/:bucket)
// ----------------------------------------------------
app.post('/api/storage/:bucket/upload', upload.single('file'), async (req, res) => {
    try {
        const { bucket } = req.params;
        const filePath = req.body.path || `${Date.now()}_${req.file.originalname}`;
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const result = await DatabaseAdapter.uploadStorage(bucket, filePath, req.file.buffer, req.file.mimetype);
        if (result.error) return res.status(400).json(result);

        const publicUrl = DatabaseAdapter.getPublicUrl(bucket, filePath);
        res.json({ data: { path: filePath, publicUrl }, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.get('/api/storage/:bucket/public-url', (req, res) => {
    try {
        const { bucket } = req.params;
        const { path: filePath } = req.query;
        const publicUrl = DatabaseAdapter.getPublicUrl(bucket, filePath);
        res.json({ data: { publicUrl }, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// ----------------------------------------------------
// Stored Procedures / RPC Routes (/api/rpc/:fn)
// ----------------------------------------------------
app.post('/api/rpc/:fn', async (req, res) => {
    try {
        const { fn } = req.params;
        if (!supabase) return res.status(500).json({ error: 'Database service not configured' });
        const { data, error } = await supabase.rpc(fn, req.body);
        if (error) return res.status(400).json({ data: null, error: error.message });
        res.json({ data, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// ----------------------------------------------------
// AI Curriculum Generation Endpoint
// ----------------------------------------------------
app.post('/api/generate-curriculum', upload.single('courseNotes'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No course notes file uploaded.' });
        }

        const apiKey = process.env.OPENROUTER;
        if (!apiKey) {
            return res.status(500).json({ error: 'OPENROUTER API key not configured on backend.' });
        }

        let documentText = '';
        const mimeType = req.file.mimetype;

        if (mimeType === 'application/pdf') {
            const data = await pdfParse(req.file.buffer);
            documentText = data.text;
        } else if (mimeType.startsWith('text/')) {
            documentText = req.file.buffer.toString('utf-8');
        } else {
            return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or text file.' });
        }

        if (!documentText.trim()) {
            return res.status(400).json({ error: 'Could not extract any text from the file.' });
        }

        const systemPrompt = `
You are an expert instructional designer. I have provided the course notes/syllabus below.
Based on this document, please generate a structured curriculum consisting of Modules (sections) and Lessons.

For each Module, generate:
- title: A descriptive title for the module.

For each Lesson inside a Module, generate:
- title: Lesson title
- duration: Estimated time (e.g., "15m", "30m", "1h")
- type: MUST be one of "video", "article", "document", "quiz", or "audio". Choose the most appropriate based on the content.
- description: A short 1-sentence description.

Respond STRICTLY in JSON format with the following schema, and no other text:
[
  {
    "title": "Module Title",
    "lessons": [
      {
        "title": "Lesson Title",
        "duration": "15m",
        "type": "video",
        "description": "Short description"
      }
    ]
  }
]
`;

        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "openai/gpt-4o",
            max_tokens: 3000,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Here are the course notes:\n\n${documentText}` }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            }
        });

        const text = response.data.choices[0].message.content;
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonResult = JSON.parse(cleanedText);
        res.json(jsonResult);
        
    } catch (error) {
        console.error("AI Generation Error:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data?.error?.message || error.message || 'Unknown error occurred during AI generation.' });
    }
});

// ----------------------------------------------------
// Google Meet Generation (/api/google-meet/create)
// ----------------------------------------------------
app.post('/api/google-meet/create', async (req, res) => {
    try {
        const { tutorEmail, courseTitle, startDate, startTime, endTime, timezone } = req.body;
        const isConfigured = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_OAUTH_TOKEN);

        // Google Calendar TEMPLATE url with tutor as organizer/attendee and Google Meet location
        const calendarTemplateUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(courseTitle || 'Live Cohort Class')}&details=${encodeURIComponent(`Live Welile School Cohort Lesson hosted by ${tutorEmail || 'Instructor'}\nVideo Conferencing: Google Meet`)}&location=${encodeURIComponent('Google Meet')}&add=${encodeURIComponent(tutorEmail || '')}`;

        // If Google Cloud credentials are configured in backend, handle API provisioning
        if (isConfigured) {
            // (When googleapis is installed & configured, real event with hangoutLink is returned)
            res.json({
                success: true,
                configured: true,
                hostEmail: tutorEmail || 'tutor@welile.com',
                calendarTemplateUrl,
                directMeetUrl: 'https://meet.google.com/new'
            });
            return;
        }

        // Without Google Cloud Service Account, Google requires rooms to be created via Google's UI
        res.json({
            success: false,
            configured: false,
            message: 'Google Cloud Service Account not configured. Real Google Meet rooms must be initiated through Google Meet or Google Calendar to be recognized by Google servers.',
            hostEmail: tutorEmail || 'tutor@welile.com',
            calendarTemplateUrl,
            directMeetUrl: 'https://meet.google.com/new'
        });
    } catch (err) {
        console.error('Error in Google Meet endpoint:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Backend API server running on http://localhost:${port}`);
});
