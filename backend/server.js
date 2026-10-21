const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend running on ports 4000/4001
app.use(cors());
app.use(express.json());

// Set up multer to store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/generate-curriculum', upload.single('courseNotes'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No course notes file uploaded.' });
        }

        // Get API Key from environment (.env.local)
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
        
        // Clean up markdown code blocks if the model wrapped it
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const jsonResult = JSON.parse(cleanedText);
        res.json(jsonResult);
        
    } catch (error) {
        console.error("AI Generation Error:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data?.error?.message || error.message || 'Unknown error occurred during AI generation.' });
    }
});

app.listen(port, () => {
    console.log(`Backend API server running on http://localhost:${port}`);
});
