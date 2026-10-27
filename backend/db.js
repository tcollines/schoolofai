const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config();

// Determine database credentials
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Database layer connected to Supabase backend successfully.');
} else {
    console.warn('Database credentials missing: running Universal DatabaseAdapter with persistent local storage engine.');
}

const LOCAL_DB_PATH = path.join(__dirname, 'local_db.json');

function getLocalData() {
    try {
        if (!fs.existsSync(LOCAL_DB_PATH)) {
            fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({
                courses: [],
                cohorts: [],
                cohort_sessions: [],
                modules: [],
                module_completions: [],
                profiles: [],
                enrollments: [],
                instructors: [],
                partners: [],
                events: [],
                mails: []
            }, null, 2));
        }
        return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
    } catch (e) {
        console.error('Error reading local db:', e);
        return {};
    }
}

function saveLocalData(data) {
    try {
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error saving local db:', e);
    }
}

/**
 * Universal Database Data Access Layer
 * Uses Supabase when credentials exist; otherwise falls back gracefully to local persistent storage.
 */
class DatabaseAdapter {
    static getClient() {
        return supabase;
    }

    static isReady() {
        return true;
    }

    /**
     * Query records from a table with filters
     */
    static async query(table, { select = '*', filters = {}, order = null, limit = null, single = false }) {
        if (supabase) {
            let q = supabase.from(table).select(select);
            for (const [col, val] of Object.entries(filters)) {
                if (val === undefined || val === null) continue;
                if (typeof val === 'object' && val.op && val.value !== undefined) {
                    if (typeof q[val.op] === 'function') {
                        q = q[val.op](col, val.value);
                    } else {
                        q = q.eq(col, val.value);
                    }
                } else {
                    q = q.eq(col, val);
                }
            }
            if (order) {
                const [column, direction] = order.split('.');
                q = q.order(column, { ascending: direction !== 'desc' });
            }
            if (limit) q = q.limit(Number(limit));
            if (single) {
                const { data, error } = await q.maybeSingle();
                return { data, error: error ? error.message : null };
            }
            const { data, error } = await q;
            return { data, error: error ? error.message : null };
        }

        // Local persistent engine fallback
        const db = getLocalData();
        let rows = [...(db[table] || [])];

        for (const [col, val] of Object.entries(filters)) {
            if (val === undefined || val === null) continue;
            const targetVal = (typeof val === 'object' && val.value !== undefined) ? val.value : val;
            rows = rows.filter(r => String(r[col]) === String(targetVal));
        }

        if (order) {
            const [column, direction] = order.split('.');
            rows.sort((a, b) => {
                if (a[column] > b[column]) return direction === 'desc' ? -1 : 1;
                if (a[column] < b[column]) return direction === 'desc' ? 1 : -1;
                return 0;
            });
        }

        if (limit) {
            rows = rows.slice(0, Number(limit));
        }

        if (single) {
            return { data: rows[0] || null, error: null };
        }

        return { data: rows, error: null };
    }

    /**
     * Insert records into a table
     */
    static async insert(table, values) {
        if (supabase) {
            const { data, error } = await supabase.from(table).insert(values).select();
            return { data, error: error ? error.message : null };
        }

        const db = getLocalData();
        if (!db[table]) db[table] = [];

        const records = Array.isArray(values) ? values : [values];
        const inserted = records.map(r => ({
            id: r.id || 'id_' + Math.random().toString(36).substring(2, 10),
            created_at: new Date().toISOString(),
            ...r
        }));

        db[table].push(...inserted);
        saveLocalData(db);
        return { data: Array.isArray(values) ? inserted : inserted[0], error: null };
    }

    /**
     * Upsert records into a table
     */
    static async upsert(table, values, options = {}) {
        if (supabase) {
            const { data, error } = await supabase.from(table).upsert(values, options).select();
            return { data, error: error ? error.message : null };
        }

        const db = getLocalData();
        if (!db[table]) db[table] = [];
        const records = Array.isArray(values) ? values : [values];
        const results = [];

        for (const rec of records) {
            const idx = rec.id ? db[table].findIndex(item => item.id === rec.id) : -1;
            if (idx >= 0) {
                db[table][idx] = { ...db[table][idx], ...rec };
                results.push(db[table][idx]);
            } else {
                const newRec = {
                    id: rec.id || 'id_' + Math.random().toString(36).substring(2, 10),
                    created_at: new Date().toISOString(),
                    ...rec
                };
                db[table].push(newRec);
                results.push(newRec);
            }
        }

        saveLocalData(db);
        return { data: Array.isArray(values) ? results : results[0], error: null };
    }

    /**
     * Update records in a table with filters
     */
    static async update(table, values, filters = {}) {
        if (supabase) {
            let q = supabase.from(table).update(values);
            for (const [col, val] of Object.entries(filters)) {
                if (val !== undefined && val !== null) {
                    q = q.eq(col, val);
                }
            }
            const { data, error } = await q.select();
            return { data, error: error ? error.message : null };
        }

        const db = getLocalData();
        if (!db[table]) db[table] = [];
        let updated = [];

        db[table] = db[table].map(item => {
            let matches = true;
            for (const [k, v] of Object.entries(filters)) {
                if (String(item[k]) !== String(v)) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                const newItem = { ...item, ...values };
                updated.push(newItem);
                return newItem;
            }
            return item;
        });

        saveLocalData(db);
        return { data: updated, error: null };
    }

    /**
     * Delete records from a table with filters
     */
    static async delete(table, filters = {}) {
        if (supabase) {
            let q = supabase.from(table).delete();
            for (const [col, val] of Object.entries(filters)) {
                if (val !== undefined && val !== null) {
                    q = q.eq(col, val);
                }
            }
            const { data, error } = await q.select();
            return { data, error: error ? error.message : null };
        }

        const db = getLocalData();
        if (!db[table]) db[table] = [];
        const initialCount = db[table].length;

        db[table] = db[table].filter(item => {
            for (const [k, v] of Object.entries(filters)) {
                if (String(item[k]) === String(v)) {
                    return false;
                }
            }
            return true;
        });

        saveLocalData(db);
        return { data: { success: true, count: initialCount - db[table].length }, error: null };
    }

    /**
     * Storage Upload
     */
    static async uploadStorage(bucket, filePath, fileBuffer, mimeType) {
        if (supabase) {
            const { data, error } = await supabase.storage.from(bucket).upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: true
            });
            return { data, error: error ? error.message : null };
        }
        return { data: { path: filePath }, error: null };
    }

    /**
     * Storage Get Public URL
     */
    static getPublicUrl(bucket, filePath) {
        if (supabase) {
            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            return data ? data.publicUrl : null;
        }
        return `/public/${filePath}`;
    }
}

module.exports = { DatabaseAdapter, supabase };
