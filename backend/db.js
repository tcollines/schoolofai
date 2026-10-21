const { createClient } = require('@supabase/supabase-js');
const path = require('path');
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
    console.warn('Database credentials missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY in backend environment.');
}

/**
 * Universal Database Data Access Layer
 * Provides an abstraction over database operations.
 * Currently uses Supabase client; can be swapped directly with PostgreSQL pool (pg) without altering the API.
 */
class DatabaseAdapter {
    static getClient() {
        return supabase;
    }

    static isReady() {
        return Boolean(supabase);
    }

    /**
     * Query records from a table with filters
     */
    static async query(table, { select = '*', filters = {}, order = null, limit = null, single = false }) {
        if (!supabase) throw new Error('Database not configured');

        let q = supabase.from(table).select(select);

        // Apply filters
        for (const [col, val] of Object.entries(filters)) {
            if (val === undefined || val === null) continue;
            
            // Handle operator format: e.g. { user_id: '123' } or { id: { op: 'eq', value: '123' } }
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

        // Apply order
        if (order) {
            const [column, direction] = order.split('.');
            q = q.order(column, { ascending: direction !== 'desc' });
        }

        // Apply limit
        if (limit) {
            q = q.limit(Number(limit));
        }

        // Apply single
        if (single) {
            const { data, error } = await q.maybeSingle();
            return { data, error: error ? error.message : null };
        }

        const { data, error } = await q;
        return { data, error: error ? error.message : null };
    }

    /**
     * Insert records into a table
     */
    static async insert(table, values) {
        if (!supabase) throw new Error('Database not configured');
        const { data, error } = await supabase.from(table).insert(values).select();
        return { data, error: error ? error.message : null };
    }

    /**
     * Upsert records into a table
     */
    static async upsert(table, values, options = {}) {
        if (!supabase) throw new Error('Database not configured');
        const { data, error } = await supabase.from(table).upsert(values, options).select();
        return { data, error: error ? error.message : null };
    }

    /**
     * Update records in a table with filters
     */
    static async update(table, values, filters = {}) {
        if (!supabase) throw new Error('Database not configured');
        let q = supabase.from(table).update(values);

        for (const [col, val] of Object.entries(filters)) {
            if (val !== undefined && val !== null) {
                q = q.eq(col, val);
            }
        }

        const { data, error } = await q.select();
        return { data, error: error ? error.message : null };
    }

    /**
     * Delete records from a table with filters
     */
    static async delete(table, filters = {}) {
        if (!supabase) throw new Error('Database not configured');
        let q = supabase.from(table).delete();

        for (const [col, val] of Object.entries(filters)) {
            if (val !== undefined && val !== null) {
                q = q.eq(col, val);
            }
        }

        const { data, error } = await q.select();
        return { data, error: error ? error.message : null };
    }

    /**
     * Storage Upload
     */
    static async uploadStorage(bucket, filePath, fileBuffer, mimeType) {
        if (!supabase) throw new Error('Database/Storage not configured');
        const { data, error } = await supabase.storage.from(bucket).upload(filePath, fileBuffer, {
            contentType: mimeType,
            upsert: true
        });
        return { data, error: error ? error.message : null };
    }

    /**
     * Storage Get Public URL
     */
    static getPublicUrl(bucket, filePath) {
        if (!supabase) throw new Error('Database/Storage not configured');
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data ? data.publicUrl : null;
    }
}

module.exports = { DatabaseAdapter, supabase };
