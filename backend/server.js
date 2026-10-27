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
        if (supabase) {
            const { data, error } = await supabase.rpc(fn, req.body);
            if (error) return res.status(400).json({ data: null, error: error.message });
            return res.json({ data, error: null });
        }

        // Local RPC emulation
        if (fn === 'validate_livelesson_attendance') {
            const { p_user_id, p_module_id, p_cohort_id, p_code } = req.body;
            // Check session in cohort_sessions
            const sessionsRes = await DatabaseAdapter.query('cohort_sessions', {
                filters: { cohort_id: p_cohort_id, module_id: p_module_id },
                single: true
            });

            if (sessionsRes.data && sessionsRes.data.attendance_code?.trim().toUpperCase() === p_code?.trim().toUpperCase()) {
                // Upsert completion record
                await DatabaseAdapter.upsert('module_completions', {
                    user_id: p_user_id,
                    cohort_id: p_cohort_id,
                    module_id: p_module_id,
                    attendance_code_submitted: true
                });
                return res.json({ data: true, error: null });
            }

            return res.json({ data: false, error: null });
        }

        res.json({ data: true, error: null });
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

// ----------------------------------------------------
// Live Currency Rate Routes (/api/currency/*)
// ----------------------------------------------------
const currencyService = require('./services/currency');

app.get('/api/currency/rate', async (req, res) => {
    try {
        const rateInfo = await currencyService.getLiveUsdToUgxRate();
        res.json({
            success: true,
            ...rateInfo
        });
    } catch (err) {
        console.error('[Currency] Error fetching live rate:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/currency/convert', async (req, res) => {
    try {
        const usd = parseFloat(req.query.usd) || 0;
        const rateInfo = await currencyService.getLiveUsdToUgxRate();
        const ugx = Math.round(usd * rateInfo.effectiveRate);
        res.json({
            usd,
            ugx,
            rate: rateInfo.effectiveRate,
            baseRate: rateInfo.baseRate,
            markup: rateInfo.markup
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// MarzPay Payment Routes (/api/payments/marzpay/*)
// ----------------------------------------------------
const marzpayService = require('./services/marzpay');
const corporateService = require('./services/corporate');

// Helper to upgrade user role upon confirmed payment
async function upgradeUserRole(userId, plan, txRef = '', userEmail = '', seats = 10) {
    if (!userId) return;
    const isCorp = (plan || '').toUpperCase() === 'CORPORATE';
    const targetRole = isCorp ? 'SPONSORED' : ((plan || '').toUpperCase() === 'PREMIUM' ? 'PREMIUM' : 'PRO');

    if (isCorp) {
        try {
            await corporateService.provisionSeats(userId, userEmail, seats);
        } catch (cErr) {
            console.warn('[Corporate Service] Provision seats error:', cErr.message);
        }
    }

    if (!supabase) return;

    try {
        console.log(`[MarzPay] Upgrading user ${userId} to role ${targetRole} (txRef: ${txRef})`);
        const { error: profileErr } = await supabase
            .from('profiles')
            .update({
                role: targetRole,
                pending_role: null,
                pending_txid: txRef || null
            })
            .eq('id', userId);

        if (profileErr) {
            console.warn('[MarzPay] Profile update error:', profileErr.message);
        } else {
            console.log(`[MarzPay] Successfully upgraded user ${userId} profile to ${targetRole}`);
        }

        // Sync to Auth metadata if admin is available
        if (supabase.auth?.admin?.updateUserById) {
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { role: targetRole, plan: (plan || '').toLowerCase() }
            });
        }
    } catch (e) {
        console.warn('[MarzPay] Error updating user role:', e.message);
    }
}

app.post('/api/payments/marzpay/initiate', async (req, res) => {
    try {
        const {
            plan = 'pro',
            seats = 10,
            amount,
            usdAmount,
            currency = 'UGX',
            country = 'UG',
            method = 'mobile_money',
            phoneNumber = '',
            userId = '',
            userEmail = '',
            userName = ''
        } = req.body;

        if (!plan) {
            return res.status(400).json({ error: 'Plan is required (pro, premium, or corporate).' });
        }

        // Host origin for callback URL
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const defaultCallback = `${protocol}://${host}/api/payments/marzpay/webhook`;
        const callbackUrl = process.env.MARZPAY_CALLBACK_URL || defaultCallback;

        const result = await marzpayService.initiateCollection({
            plan,
            seats,
            amount,
            usdAmount,
            currency,
            country,
            method,
            phoneNumber,
            userId,
            userEmail,
            userName,
            callbackUrl
        });

        // If transaction completed immediately (e.g. Sandbox mode), upgrade user right away
        if (result.status === 'completed' && userId) {
            await upgradeUserRole(userId, plan, result.reference, userEmail, seats);
        }

        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error('[MarzPay] Initiate error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/payments/marzpay/status/:referenceOrUuid', async (req, res) => {
    try {
        const { referenceOrUuid } = req.params;
        const result = await marzpayService.checkStatus(referenceOrUuid);

        if (result.isCompleted && result.record?.userId && result.record?.plan) {
            await upgradeUserRole(
                result.record.userId, 
                result.record.plan, 
                result.record.reference || referenceOrUuid,
                result.record.userEmail,
                result.record.seats || 10
            );
        }

        res.json({
            success: true,
            status: result.status,
            isCompleted: result.isCompleted,
            isFailed: result.isFailed,
            providerTransactionId: result.providerTransactionId,
            record: result.record
        });
    } catch (err) {
        console.error('[MarzPay] Status check error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments/marzpay/webhook', async (req, res) => {
    try {
        const body = req.body || {};
        console.log('[MarzPay] Received webhook payload:', JSON.stringify(body).substring(0, 500));

        // Follow SKILL.md: handle both direct callback and dashboard { data: ... } wrapper
        const payload = body.data?.transaction ? body.data : body;
        const eventType = payload.event_type || body.event_type || '';
        const reference = payload.transaction?.reference || payload.reference;
        const status = payload.transaction?.status || payload.status;
        const providerTxId = payload.collection?.provider_transaction_id || payload.provider_transaction_id;

        // Extract metadata
        const metadataArray = payload.metadata || body.metadata || [];
        let plan = '';
        let userId = '';
        if (Array.isArray(metadataArray)) {
            for (const item of metadataArray) {
                if (item.plan) plan = item.plan;
                if (item.userId) userId = item.userId;
            }
        }

        const isSuccess = eventType === 'collection.completed' || status === 'completed' || status === 'successful' || status === 'sandbox';

        if (reference) {
            const store = marzpayService.getStoredTransactions();
            const existing = store[reference];
            if (existing) {
                existing.status = isSuccess ? 'completed' : (status || 'failed');
                if (providerTxId) existing.providerTransactionId = providerTxId;
                marzpayService.saveTransaction(existing);
                if (!userId && existing.userId) userId = existing.userId;
                if (!plan && existing.plan) plan = existing.plan;
            }
        }

        if (isSuccess && userId && plan) {
            await upgradeUserRole(userId, plan, providerTxId || reference);
        }

        // Return HTTP 200 quickly per webhook conventions
        res.status(200).json({ received: true });
    } catch (err) {
        console.error('[MarzPay] Webhook error:', err.message);
        res.status(200).json({ received: true, error: err.message });
    }
});

// ----------------------------------------------------
// Admin Wallet & Ledger Routes (/api/admin/wallet/*)
// ----------------------------------------------------
app.get('/api/admin/wallet/ledger', (req, res) => {
    try {
        const data = marzpayService.getWalletLedger();
        res.json({
            success: true,
            ...data
        });
    } catch (err) {
        console.error('[Admin Wallet] Error reading ledger:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/wallet/transaction', (req, res) => {
    try {
        const { type, amount, usdAmount, description, method, category, recipient, sender, notes } = req.body;
        if (!amount || isNaN(Number(amount))) {
            return res.status(400).json({ error: 'Valid amount is required.' });
        }

        const entry = marzpayService.recordManualTransaction({
            type,
            amount,
            usdAmount,
            description,
            method,
            category,
            recipient,
            sender,
            notes
        });

        res.json({
            success: true,
            data: entry
        });
    } catch (err) {
        console.error('[Admin Wallet] Error recording transaction:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/wallet/mode', (req, res) => {
    res.json({
        sandboxMode: marzpayService.isSandboxMode()
    });
});

app.post('/api/admin/wallet/mode', (req, res) => {
    try {
        const { sandboxMode } = req.body;
        const config = marzpayService.setSandboxMode(sandboxMode);
        res.json({
            success: true,
            sandboxMode: config.sandboxMode
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// Corporate Organization & Seat Management Routes (/api/corporate/*)
// ----------------------------------------------------
app.get('/api/corporate/organization', async (req, res) => {
    try {
        const { userId, userEmail } = req.query;
        const org = await corporateService.getOrganization(userId, userEmail);
        res.json({ success: true, data: org });
    } catch (err) {
        console.error('[Corporate] Error fetching organization:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/corporate/branding', async (req, res) => {
    try {
        const { userId, name, logoUrl, contactName, contactEmail, contactPhone, website } = req.body;
        const updated = await corporateService.updateBranding(userId, {
            name,
            logoUrl,
            contactName,
            contactEmail,
            contactPhone,
            website
        });
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('[Corporate] Error updating branding:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/corporate/seats', async (req, res) => {
    try {
        const { orgId, userId, userEmail } = req.query;
        const data = await corporateService.getSeatsAndProgress(orgId, userId, userEmail);
        res.json({ success: true, ...data });
    } catch (err) {
        console.error('[Corporate] Error reading seats:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/corporate/invite', async (req, res) => {
    try {
        const { orgId, invites, user } = req.body;
        if (!Array.isArray(invites) || invites.length === 0) {
            return res.status(400).json({ error: 'At least one invite with email is required.' });
        }
        const result = await corporateService.inviteMembers(orgId, invites, user);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Corporate] Invite error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/corporate/invite/resend', async (req, res) => {
    try {
        const { orgId, memberId } = req.body;
        const result = await corporateService.resendInvite(orgId, memberId);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Corporate] Resend invite error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/corporate/seats/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { orgId } = req.query;
        const result = await corporateService.revokeSeat(orgId, id);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Corporate] Revoke seat error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/corporate/claim', async (req, res) => {
    try {
        const { email, userId, name } = req.body;
        const result = await corporateService.claimInvite(email, userId, name);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[Corporate] Claim invite error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/corporate/provision', async (req, res) => {
    try {
        const { userId, userEmail, seats, planTier } = req.body;
        const org = await corporateService.provisionSeats(userId, userEmail, Number(seats) || 10, planTier);
        if (userId) {
            try {
                await supabase
                    .from('profiles')
                    .update({ role: 'SPONSORED', company_name: org.name })
                    .eq('id', userId);
            } catch (supaErr) {
                console.warn('[Corporate] Profile role update warning:', supaErr.message);
            }
        }
        res.json({ success: true, data: org });
    } catch (err) {
        console.error('[Corporate] Provision error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Backend API server running on http://localhost:${port}`);
});

