const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config();

const API_BASE = process.env.MARZPAY_API_BASE || 'https://wallet.wearemarz.com/api/v1';
const API_KEY = process.env.MARZPAY_API_KEY;
const API_SECRET = process.env.MARZPAY_API_SECRET;

const currencyService = require('./currency');

// Fallback conversion rate: 1 USD = 3,700 UGX + 300 UGX = 4,000 UGX
const DEFAULT_FALLBACK_RATE = 4000;

// Transactions and Config files for persistence
const DATA_DIR = path.join(__dirname, '../data');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'marzpay-transactions.json');
const CONFIG_FILE = path.join(DATA_DIR, 'marzpay-config.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Error reading config file:', e.message);
    }
    return { sandboxMode: process.env.MARZPAY_SANDBOX === 'true' };
}

function setSandboxMode(enabled) {
    const config = getConfig();
    config.sandboxMode = Boolean(enabled);
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    return config;
}

function isSandboxMode() {
    if (process.env.MARZPAY_SANDBOX === 'true') return true;
    return Boolean(getConfig().sandboxMode);
}

function getStoredTransactions() {
    try {
        if (fs.existsSync(TRANSACTIONS_FILE)) {
            const raw = fs.readFileSync(TRANSACTIONS_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Error reading stored transactions:', e.message);
    }
    return {};
}

function saveTransaction(record) {
    try {
        const store = getStoredTransactions();
        const key = record.reference || record.uuid;
        store[key] = {
            ...store[key],
            ...record,
            updatedAt: new Date().toISOString()
        };
        fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (e) {
        console.warn('Error saving transaction record:', e.message);
    }
}

/**
 * Computes wallet ledger summary and returns all deposit & withdrawal transactions.
 */
function getWalletLedger() {
    const store = getStoredTransactions();
    const list = Object.values(store).sort((a, b) => {
        const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return tB - tA;
    });

    let totalDepositsUGX = 0;
    let totalWithdrawalsUGX = 0;
    let pendingDepositsUGX = 0;
    let pendingWithdrawalsUGX = 0;

    for (const item of list) {
        const amt = Number(item.amount) || 0;
        const isDebit = item.type === 'withdrawal' || item.type === 'debit';
        const isSuccess = ['completed', 'successful', 'sandbox'].includes(item.status?.toLowerCase());
        const isPending = ['processing', 'pending'].includes(item.status?.toLowerCase());

        if (isDebit) {
            if (isSuccess) totalWithdrawalsUGX += amt;
            else if (isPending) pendingWithdrawalsUGX += amt;
        } else {
            // Default is deposit / collection
            if (isSuccess) totalDepositsUGX += amt;
            else if (isPending) pendingDepositsUGX += amt;
        }
    }

    const netBalanceUGX = totalDepositsUGX - totalWithdrawalsUGX;

    return {
        currency: 'UGX',
        sandboxMode: isSandboxMode(),
        summary: {
            netBalanceUGX,
            totalDepositsUGX,
            totalWithdrawalsUGX,
            pendingDepositsUGX,
            pendingWithdrawalsUGX,
            totalCount: list.length,
            depositCount: list.filter(i => i.type !== 'withdrawal' && i.type !== 'debit').length,
            withdrawalCount: list.filter(i => i.type === 'withdrawal' || i.type === 'debit').length
        },
        transactions: list
    };
}

/**
 * Records a manual deposit or withdrawal entry to the ledger.
 */
function recordManualTransaction({
    type = 'deposit', // 'deposit' or 'withdrawal'
    amount,
    usdAmount,
    description,
    method = 'manual',
    category = 'General',
    recipient = '',
    sender = '',
    status = 'completed',
    notes = ''
}) {
    const reference = crypto.randomUUID();
    const isDebit = type === 'withdrawal';
    const numAmount = Number(amount);

    const record = {
        uuid: reference,
        reference,
        type: isDebit ? 'withdrawal' : 'deposit',
        amount: numAmount,
        usdAmount: Number(usdAmount) || Math.round(numAmount / 4600),
        currency: 'UGX',
        description: description || (isDebit ? 'Admin Withdrawal' : 'Admin Deposit'),
        method,
        category,
        recipient: isDebit ? recipient : 'School Wallet',
        sender: isDebit ? 'School Wallet' : sender,
        status,
        isSandbox: isSandboxMode(),
        isManual: true,
        notes,
        createdAt: new Date().toISOString()
    };

    saveTransaction(record);
    return record;
}

function getAuthHeader() {
    if (process.env.MARZPAY_BASE64_AUTHORIZATION_HEADER) {
        return `Basic ${process.env.MARZPAY_BASE64_AUTHORIZATION_HEADER}`;
    }
    if (API_KEY && API_SECRET) {
        return `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')}`;
    }
    throw new Error('MarzPay API credentials missing in environment.');
}

/**
 * Normalizes phone number to international E.164 format.
 * E.g. 0772123456 -> +256772123456
 */
function normalizePhoneNumber(phone, countryCode = 'UG') {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '').trim();
    if (cleaned.startsWith('+')) return cleaned;

    if (countryCode === 'UG') {
        if (cleaned.startsWith('0')) {
            return `+256${cleaned.slice(1)}`;
        }
        if (cleaned.startsWith('256')) {
            return `+${cleaned}`;
        }
        return `+256${cleaned}`;
    } else if (countryCode === 'KE') {
        if (cleaned.startsWith('0')) {
            return `+254${cleaned.slice(1)}`;
        }
        if (cleaned.startsWith('254')) {
            return `+${cleaned}`;
        }
        return `+254${cleaned}`;
    } else if (countryCode === 'RW') {
        if (cleaned.startsWith('0')) {
            return `+250${cleaned.slice(1)}`;
        }
        return `+250${cleaned}`;
    }
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Initiates a money collection via MarzPay API.
 * Follows the MarzPay Integration Skill specification:
 * - Reference MUST be a unique UUID v4.
 * - Supports Mobile Money and Card payment.
 * - Supports automatic currency conversion (USD to UGX).
 */
async function initiateCollection({
    plan, // 'pro' or 'premium'
    amount, // In target currency (or USD if usdAmount provided)
    usdAmount,
    currency = 'UGX',
    country = 'UG',
    method = 'mobile_money', // 'mobile_money' or 'card'
    phoneNumber = '',
    userId = '',
    userEmail = '',
    userName = '',
    callbackUrl = process.env.MARZPAY_CALLBACK_URL || ''
}) {
    const reference = crypto.randomUUID();

    // Determine plan pricing and title
    const normalizedPlan = (plan || 'pro').toLowerCase();
    let finalUsd = usdAmount || (normalizedPlan === 'premium' ? 150 : 25);
    let finalAmount = amount;

    if (!finalAmount) {
        if (currency === 'UGX') {
            finalAmount = await currencyService.convertUsdToUgx(finalUsd);
        } else {
            finalAmount = finalUsd;
        }
    }

    const description = normalizedPlan === 'premium'
        ? 'Welile School - Premium Plan (Lifetime Access)'
        : 'Welile School - Pro Plan (Monthly Subscription)';

    const formattedPhone = normalizePhoneNumber(phoneNumber, country);

    const payload = {
        amount: Number(finalAmount),
        reference,
        country,
        currency,
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

    // Per skill: For mobile money, phone_number is required.
    // For card: In live mode phone_number is omitted, but sandbox expects a phone fallback if absent.
    if (formattedPhone) {
        payload.phone_number = formattedPhone;
    } else if (method === 'card') {
        // Fallback placeholder phone if sandbox requires phone_number
        payload.phone_number = '+256700000000';
    }

    const headers = {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    try {
        const response = await axios.post(`${API_BASE}/collect-money`, payload, {
            headers,
            timeout: 30000
        });

        const resData = response.data;
        const txUuid = resData.data?.transaction?.uuid || reference;
        const initialStatus = resData.data?.transaction?.status || 'processing';
        const redirectUrl = resData.data?.redirect_url || null;
        const isSandbox = Boolean(resData.data?.metadata?.sandbox_mode || initialStatus === 'sandbox' || resData.message?.includes('Sandbox'));

        // Save local tracking record
        saveTransaction({
            uuid: txUuid,
            reference,
            plan: normalizedPlan,
            userId,
            userEmail,
            userName,
            amount: finalAmount,
            usdAmount: finalUsd,
            currency,
            country,
            method,
            phoneNumber: formattedPhone,
            status: isSandbox ? 'completed' : initialStatus,
            isSandbox,
            redirectUrl,
            rawResponse: resData,
            createdAt: new Date().toISOString()
        });

        return {
            success: true,
            uuid: txUuid,
            reference,
            status: isSandbox ? 'completed' : initialStatus,
            redirectUrl,
            isSandbox,
            amount: finalAmount,
            usdAmount: finalUsd,
            currency,
            message: resData.message || 'Payment initiated successfully.'
        };
    } catch (err) {
        console.error('MarzPay Collection Initiation Error:', err.response?.data || err.message);
        const errMsg = err.response?.data?.message || err.message || 'Payment initiation failed';
        const errors = err.response?.data?.errors;
        throw new Error(errors ? `${errMsg}: ${JSON.stringify(errors)}` : errMsg);
    }
}

/**
 * Checks status of a collection transaction.
 * First checks local persistence for immediate completion,
 * then queries MarzPay GET /collect-money/{uuid} or GET /transactions.
 */
async function checkStatus(referenceOrUuid) {
    const store = getStoredTransactions();
    let record = store[referenceOrUuid];

    // If not found by key, search by uuid or reference
    if (!record) {
        const foundKey = Object.keys(store).find(
            k => store[k].reference === referenceOrUuid || store[k].uuid === referenceOrUuid
        );
        if (foundKey) record = store[foundKey];
    }

    // If already marked completed in local store, return immediately
    if (record && record.status === 'completed') {
        return {
            status: 'completed',
            isCompleted: true,
            record
        };
    }

    const headers = {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json'
    };

    const targetUuid = record?.uuid || referenceOrUuid;

    try {
        const response = await axios.get(`${API_BASE}/collect-money/${targetUuid}`, {
            headers,
            timeout: 15000
        });

        const data = response.data;
        const currentStatus = data.data?.transaction?.status || data.status;
        const isCompleted = ['completed', 'successful', 'sandbox'].includes(currentStatus?.toLowerCase());
        const isFailed = ['failed', 'cancelled', 'rejected'].includes(currentStatus?.toLowerCase());

        if (record) {
            record.status = isCompleted ? 'completed' : (isFailed ? 'failed' : currentStatus);
            saveTransaction(record);
        }

        return {
            status: isCompleted ? 'completed' : (isFailed ? 'failed' : currentStatus),
            isCompleted,
            isFailed,
            providerTransactionId: data.data?.collection?.provider_transaction_id || null,
            record
        };
    } catch (err) {
        // If 404 on API but we have local record in sandbox mode, check sandbox status
        if (record && record.isSandbox) {
            return {
                status: 'completed',
                isCompleted: true,
                record
            };
        }
        return {
            status: record?.status || 'processing',
            isCompleted: record?.status === 'completed',
            isFailed: false,
            record
        };
    }
}

module.exports = {
    initiateCollection,
    checkStatus,
    normalizePhoneNumber,
    getStoredTransactions,
    saveTransaction,
    getWalletLedger,
    recordManualTransaction,
    setSandboxMode,
    isSandboxMode,
    getConfig,
    currencyService
};
