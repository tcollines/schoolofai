/**
 * Welile School of AI - Backend API Client Layer (Admin Portal)
 * Replaces direct Supabase client calls with direct API calls to the Express Backend.
 * Decouples the frontend from database technology, facilitating seamless migration to PostgreSQL.
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

export const isBackendConnected = true;
export const isSupabaseConfigured = true;

const getStoredSession = () => {
    try {
        const raw = localStorage.getItem('welile_auth_session');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

class ApiQueryBuilder implements PromiseLike<any> {
    private table: string;
    private selectFields: string = '*';
    private filters: Record<string, any> = {};
    private orderParam: string | null = null;
    private limitParam: number | null = null;
    private isSingle: boolean = false;
    private isUpsert: boolean = false;
    private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
    private bodyData: any = null;

    constructor(table: string) {
        this.table = table;
    }

    select(fields: string = '*') {
        this.selectFields = fields;
        return this;
    }

    insert(values: any | any[]) {
        this.method = 'POST';
        this.bodyData = values;
        return this;
    }

    upsert(values: any | any[]) {
        this.method = 'POST';
        this.isUpsert = true;
        this.bodyData = values;
        return this;
    }

    update(values: any) {
        this.method = 'PATCH';
        this.bodyData = values;
        return this;
    }

    delete() {
        this.method = 'DELETE';
        return this;
    }

    eq(column: string, value: any) {
        this.filters[column] = value;
        return this;
    }

    neq(column: string, value: any) {
        this.filters[column] = { op: 'neq', value };
        return this;
    }

    in(column: string, values: any[]) {
        this.filters[column] = { op: 'in', value: values };
        return this;
    }

    order(column: string, options?: { ascending?: boolean }) {
        const dir = options?.ascending === false ? 'desc' : 'asc';
        this.orderParam = `${column}.${dir}`;
        return this;
    }

    limit(n: number) {
        this.limitParam = n;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isSingle = true;
        return this;
    }

    async execute(): Promise<{ data: any; error: any }> {
        try {
            const queryParams = new URLSearchParams();
            if (this.method === 'GET') {
                queryParams.set('select', this.selectFields);
                if (this.orderParam) queryParams.set('order', this.orderParam);
                if (this.limitParam) queryParams.set('limit', String(this.limitParam));
                if (this.isSingle) queryParams.set('single', 'true');
            }
            if (this.isUpsert) {
                queryParams.set('upsert', 'true');
            }

            for (const [k, v] of Object.entries(this.filters)) {
                if (v && typeof v === 'object' && v.value !== undefined) {
                    queryParams.set(k, String(v.value));
                } else if (v !== undefined && v !== null) {
                    queryParams.set(k, String(v));
                }
            }

            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const url = `${BACKEND_URL}/api/data/${this.table}${queryString}`;

            const token = getStoredSession()?.access_token;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const options: RequestInit = {
                method: this.method,
                headers,
            };
            if (this.bodyData !== null) {
                options.body = JSON.stringify(this.bodyData);
            }

            const res = await fetch(url, options);
            const json = await res.json();
            return json;
        } catch (err: any) {
            console.error(`API Client Error (${this.table}):`, err);
            return { data: null, error: err?.message || 'Network error connecting to backend API' };
        }
    }

    then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return this.execute().then(onfulfilled, onrejected);
    }
}

const authListeners: Array<(event: string, session: any) => void> = [];

const auth = {
    async signInWithPassword({ email, password }: any) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.session) {
                localStorage.setItem('welile_auth_session', JSON.stringify(data.session));
                authListeners.forEach(cb => cb('SIGNED_IN', data.session));
            }
            return { data: data.user ? { user: data.user, session: data.session } : null, error: data.error ? { message: data.error } : null };
        } catch (err: any) {
            return { data: null, error: { message: err?.message || 'Login failed' } };
        }
    },

    async signUp({ email, password, options }: any) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, options })
            });
            const data = await res.json();
            if (data.session) {
                localStorage.setItem('welile_auth_session', JSON.stringify(data.session));
                authListeners.forEach(cb => cb('SIGNED_IN', data.session));
            }
            return { data: data.user ? { user: data.user, session: data.session } : null, error: data.error ? { message: data.error } : null };
        } catch (err: any) {
            return { data: null, error: { message: err?.message || 'Sign up failed' } };
        }
    },

    async signOut() {
        try {
            const token = getStoredSession()?.access_token;
            await fetch(`${BACKEND_URL}/api/auth/logout`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
        } finally {
            localStorage.removeItem('welile_auth_session');
            authListeners.forEach(cb => cb('SIGNED_OUT', null));
            return { error: null };
        }
    },

    async getSession() {
        const session = getStoredSession();
        return { data: { session }, error: null };
    },

    async getUser() {
        const session = getStoredSession();
        return { data: { user: session?.user || null }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
        authListeners.push(callback);
        const session = getStoredSession();
        if (session) {
            callback('INITIAL_SESSION', session);
        }
        return {
            data: {
                subscription: {
                    unsubscribe: () => {
                        const idx = authListeners.indexOf(callback);
                        if (idx !== -1) authListeners.splice(idx, 1);
                    }
                }
            }
        };
    },

    async resetPasswordForEmail(_email: string) {
        return { data: {}, error: null };
    }
};

const storage = {
    from(bucket: string) {
        return {
            async upload(path: string, file: File | Blob) {
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('path', path);

                    const res = await fetch(`${BACKEND_URL}/api/storage/${bucket}/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    return await res.json();
                } catch (err: any) {
                    return { data: null, error: { message: err?.message || 'Upload failed' } };
                }
            },

            getPublicUrl(path: string) {
                return {
                    data: {
                        publicUrl: `${BACKEND_URL}/api/storage/${bucket}/public-url?path=${encodeURIComponent(path)}`
                    }
                };
            }
        };
    }
};

async function rpc(fn: string, params?: any) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/rpc/${fn}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params || {})
        });
        return await res.json();
    } catch (err: any) {
        return { data: null, error: { message: err?.message || 'RPC failed' } };
    }
}

export const supabase = {
    from: (table: string) => new ApiQueryBuilder(table),
    auth,
    storage,
    rpc
};

export const supabaseClient = supabase;

export interface Course {
    id: string;
    title: string;
    instructor: string;
    instructorEmail?: string;
    instructorAvatar?: string;
    duration: string;
    category: string;
    rating: number;
    lessonsTotal: number;
    lessonsCompleted: number;
    status: string;
    isDraft?: boolean;
    isVerified?: boolean;
    image: string;
    price: number;
    platform: 'Welile' | 'Coursera' | 'Partner';
    accessTier?: 'FREE' | 'PAID';
    sections?: any[];
    description?: string;
    outcomes?: string[];
}
