// Vercel Serverless Function Handler for /api/*
const crypto = require('crypto');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const url = req.url || '';
    const cleanUrl = url.split('?')[0];

    // ----------------------------------------------------
    // Health Check
    // ----------------------------------------------------
    if (cleanUrl === '/api/health' || cleanUrl.endsWith('/health')) {
        return res.status(200).json({
            status: 'ok',
            runtime: 'vercel-serverless',
            hasMarzPayKeys: Boolean(process.env.MARZPAY_API_KEY && process.env.MARZPAY_API_SECRET),
            time: new Date().toISOString()
        });
    }

    // ----------------------------------------------------
    // MarzPay: Initiate Collection
    // ----------------------------------------------------
    if (cleanUrl.includes('/api/payments/marzpay/initiate') && req.method === 'POST') {
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
                userName = '',
                callbackUrl = ''
            } = req.body || {};

            const apiKey = process.env.MARZPAY_API_KEY;
            const apiSecret = process.env.MARZPAY_API_SECRET;
            const base64Auth = process.env.MARZPAY_BASE64_AUTHORIZATION_HEADER;
            const apiBase = process.env.MARZPAY_API_BASE || 'https://wallet.wearemarz.com/api/v1';

            let authHeader = '';
            if (base64Auth) {
                authHeader = `Basic ${base64Auth}`;
            } else if (apiKey && apiSecret) {
                authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'MarzPay API credentials missing on server. Please configure MARZPAY_API_KEY and MARZPAY_API_SECRET in your Vercel Project Settings > Environment Variables.'
                });
            }

            const reference = crypto.randomUUID();
            const normalizedPlan = (plan || 'pro').toLowerCase();

            // Format phone number
            let formattedPhone = (phoneNumber || '').replace(/[^\d+]/g, '').trim();
            if (formattedPhone && !formattedPhone.startsWith('+')) {
                if (country === 'UG' || !country) {
                    if (formattedPhone.startsWith('0')) {
                        formattedPhone = `+256${formattedPhone.slice(1)}`;
                    } else if (formattedPhone.startsWith('256')) {
                        formattedPhone = `+${formattedPhone}`;
                    } else {
                        formattedPhone = `+256${formattedPhone}`;
                    }
                } else {
                    formattedPhone = `+${formattedPhone}`;
                }
            }

            const description = normalizedPlan === 'corporate'
                ? `Welile School - Corporate Package (${seats || 10} Seats)`
                : (normalizedPlan === 'premium'
                    ? 'Welile School - Premium Plan (Lifetime Access)'
                    : 'Welile School - Pro Plan (Monthly Subscription)');

            const payload = {
                amount: Number(amount),
                reference,
                country: country || 'UG',
                currency: currency || 'UGX',
                method: method === 'card' ? 'card' : 'mobile_money',
                description,
                metadata: [
                    { plan: normalizedPlan },
                    { orderId: `ORDER-${Date.now()}` },
                    ...(userId ? [{ userId, isPII: false }] : []),
                    ...(userEmail ? [{ customerEmail: userEmail, isPII: true }] : []),
                    ...(userName ? [{ customerName: userName, isPII: true }] : [])
                ]
            };

            if (callbackUrl) {
                payload.callback_url = callbackUrl;
            }

            if (formattedPhone) {
                payload.phone_number = formattedPhone;
            } else if (method === 'card') {
                payload.phone_number = '+256700000000';
            }

            const marzResponse = await fetch(`${apiBase}/collect-money`, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const resData = await marzResponse.json().catch(() => ({}));

            if (!marzResponse.ok) {
                const errMsg = resData.message || (resData.errors ? JSON.stringify(resData.errors) : `MarzPay returned status ${marzResponse.status}`);
                return res.status(marzResponse.status).json({
                    success: false,
                    error: errMsg,
                    details: resData
                });
            }

            const txUuid = resData.data?.transaction?.uuid || reference;
            const initialStatus = resData.data?.transaction?.status || 'processing';
            const redirectUrl = resData.data?.redirect_url || null;
            const isSandbox = Boolean(resData.data?.metadata?.sandbox_mode || initialStatus === 'sandbox' || resData.message?.includes('Sandbox'));

            return res.status(200).json({
                success: true,
                data: {
                    uuid: txUuid,
                    reference,
                    plan: normalizedPlan,
                    seats,
                    amount: Number(amount),
                    currency,
                    country,
                    method,
                    status: isSandbox ? 'completed' : initialStatus,
                    isSandbox,
                    redirectUrl,
                    message: resData.message || 'Payment initiated successfully.'
                }
            });
        } catch (err) {
            console.error('[Vercel API MarzPay] Initiate error:', err);
            return res.status(500).json({
                success: false,
                error: err.message || 'Internal server error while communicating with MarzPay.'
            });
        }
    }

    // ----------------------------------------------------
    // MarzPay: Check Status
    // ----------------------------------------------------
    if (cleanUrl.includes('/api/payments/marzpay/status') && req.method === 'GET') {
        try {
            const parts = cleanUrl.split('/');
            const referenceOrUuid = req.query?.referenceOrUuid || parts[parts.length - 1];

            if (!referenceOrUuid || referenceOrUuid === 'status') {
                return res.status(400).json({ success: false, error: 'Transaction reference or UUID is required.' });
            }

            const apiKey = process.env.MARZPAY_API_KEY;
            const apiSecret = process.env.MARZPAY_API_SECRET;
            const base64Auth = process.env.MARZPAY_BASE64_AUTHORIZATION_HEADER;
            const apiBase = process.env.MARZPAY_API_BASE || 'https://wallet.wearemarz.com/api/v1';

            let authHeader = '';
            if (base64Auth) {
                authHeader = `Basic ${base64Auth}`;
            } else if (apiKey && apiSecret) {
                authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'MarzPay API credentials missing on server.'
                });
            }

            const marzResponse = await fetch(`${apiBase}/collect-money/${referenceOrUuid}`, {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/json'
                }
            });

            const data = await marzResponse.json().catch(() => ({}));
            const currentStatus = data.data?.transaction?.status || data.status || 'processing';
            const isCompleted = ['completed', 'successful', 'sandbox'].includes(currentStatus?.toLowerCase());
            const isFailed = ['failed', 'cancelled', 'rejected'].includes(currentStatus?.toLowerCase());

            return res.status(200).json({
                success: true,
                status: isCompleted ? 'completed' : (isFailed ? 'failed' : currentStatus),
                isCompleted,
                isFailed,
                providerTransactionId: data.data?.collection?.provider_transaction_id || null,
                record: data.data?.transaction || data
            });
        } catch (err) {
            console.error('[Vercel API MarzPay] Status error:', err);
            return res.status(500).json({
                success: false,
                error: err.message || 'Failed to check status.'
            });
        }
    }

    // ----------------------------------------------------
    // MarzPay: Webhook Callback
    // ----------------------------------------------------
    if (cleanUrl.includes('/api/payments/marzpay/webhook') && req.method === 'POST') {
        console.log('[Vercel API MarzPay Webhook]:', JSON.stringify(req.body));
        return res.status(200).json({ success: true, message: 'Webhook received' });
    }

    // Fallback for unhandled API routes
    return res.status(404).json({
        error: `API route not found: ${req.method} ${cleanUrl}`
    });
};
