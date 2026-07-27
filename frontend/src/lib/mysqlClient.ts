// Real MySQL Client Adapter pointing to XAMPP MySQL backend API

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

export interface LocalDB {
    courses: Course[];
    profiles: any[];
    enrollments: any[];
    mails: any[];
    instructors?: any[];
    events?: any[];
}

const getActiveEmail = () => {
    if (localStorage.getItem('admin-session') === 'true') {
        return localStorage.getItem('admin-email') || '';
    }
    if (localStorage.getItem('instructor-session') === 'true') {
        return localStorage.getItem('instructor-email') || '';
    }
    return localStorage.getItem('auth_logged_in_email') || '';
};

// Chainable query builder communicating with Express REST API
class QueryBuilder {
    private table: string;
    private filters: Record<string, any> = {};
    private pendingOperation: 'select' | 'insert' | 'update' | 'delete' | null = null;
    private payload: any = null;
    private isSingle = false;

    constructor(table: string) {
        this.table = table;
    }

    select(columns?: string) {
        this.pendingOperation = 'select';
        return this;
    }

    insert(data: any | any[]) {
        this.pendingOperation = 'insert';
        this.payload = data;
        return this;
    }

    update(data: any) {
        this.pendingOperation = 'update';
        this.payload = data;
        return this;
    }

    delete() {
        this.pendingOperation = 'delete';
        return this;
    }

    eq(column: string, value: any) {
        this.filters[column] = value;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    order(column: string, options?: { ascending?: boolean }) {
        return this;
    }

    limit(count: number) {
        return this;
    }

    async execute(isSingleForce = false) {
        const isSingleResult = this.isSingle || isSingleForce;
        const email = getActiveEmail();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-User-Email': email
        };

        const baseUrl = '/api';

        try {
            // 1. SELECT
            if (this.pendingOperation === 'select') {
                if (this.table === 'courses') {
                    if (this.filters.id) {
                        const res = await fetch(`${baseUrl}/courses/${this.filters.id}`, { headers });
                        const data = await res.json();
                        return { data, error: res.ok ? null : { message: data.error } };
                    }
                    let url = `${baseUrl}/courses`;
                    const params: string[] = [];
                    if (this.filters.instructor_email) params.push(`instructorEmail=${encodeURIComponent(this.filters.instructor_email)}`);
                    if (this.filters.status) params.push(`status=${encodeURIComponent(this.filters.status)}`);
                    if (params.length > 0) url += `?${params.join('&')}`;

                    const res = await fetch(url, { headers });
                    const data = await res.json();
                    return { data, error: res.ok ? null : { message: data.error } };
                }

                if (this.table === 'profiles') {
                    const res = await fetch(`${baseUrl}/auth/profiles`, { headers });
                    const data = await res.json();
                    
                    if (!res.ok) return { data: null, error: { message: data.error } };

                    if (this.filters.id) {
                        const item = data.find((p: any) => p.id === this.filters.id);
                        return { data: item || null, error: item ? null : { message: 'Not found' } };
                    }
                    if (this.filters.email) {
                        const item = data.find((p: any) => p.email?.trim().toLowerCase() === this.filters.email?.trim().toLowerCase());
                        return { data: item || null, error: item ? null : { message: 'Not found' } };
                    }

                    if (isSingleResult) {
                        return { data: data[0] || null, error: data.length > 0 ? null : { message: 'No rows' } };
                    }
                    return { data, error: null };
                }

                if (this.table === 'enrollments') {
                    let url = `${baseUrl}/enrollments`;
                    if (this.filters.user_id) {
                        url += `?userId=${encodeURIComponent(this.filters.user_id)}`;
                    }
                    const res = await fetch(url, { headers });
                    const data = await res.json();
                    return { data, error: res.ok ? null : { message: data.error } };
                }

                if (this.table === 'attendance') {
                    let url = `${baseUrl}/attendance`;
                    const params: string[] = [];
                    if (this.filters.course_id) params.push(`courseId=${encodeURIComponent(this.filters.course_id)}`);
                    if (this.filters.date) params.push(`date=${encodeURIComponent(this.filters.date)}`);
                    if (this.filters.user_id) params.push(`userId=${encodeURIComponent(this.filters.user_id)}`);
                    if (params.length > 0) url += `?${params.join('&')}`;
                    
                    const res = await fetch(url, { headers });
                    const data = await res.json();
                    return { data, error: res.ok ? null : { message: data.error } };
                }

                if (this.table === 'events') {
                    const res = await fetch(`${baseUrl}/events`, { headers });
                    const data = await res.json();
                    return { data, error: res.ok ? null : { message: data.error } };
                }

                if (this.table === 'mails') {
                    let url = `${baseUrl}/mails`;
                    const emailParam = this.filters.recipient_email || this.filters.sender_email || email;
                    if (emailParam) {
                        url += `?email=${encodeURIComponent(emailParam)}`;
                    }
                    const res = await fetch(url, { headers });
                    const data = await res.json();
                    return { data, error: res.ok ? null : { message: data.error } };
                }

                if (this.table === 'instructors') {
                    const res = await fetch(`${baseUrl}/instructors`, { headers });
                    const data = await res.json();
                    if (this.filters.email) {
                        const filtered = (data || []).filter(
                            (inst: any) => inst.email?.trim().toLowerCase() === this.filters.email.trim().toLowerCase()
                        );
                        return { data: filtered, error: res.ok ? null : { message: data.error } };
                    }
                    if (this.filters.id) {
                        const filtered = (data || []).filter(
                            (inst: any) => inst.id === this.filters.id
                        );
                        return { data: filtered, error: res.ok ? null : { message: data.error } };
                    }
                    return { data, error: res.ok ? null : { message: data.error } };
                }
            }

            // 2. INSERT
            if (this.pendingOperation === 'insert') {
                const singlePayload = Array.isArray(this.payload) ? this.payload[0] : this.payload;
                let url = '';
                
                 if (this.table === 'courses') url = `${baseUrl}/courses`;
                else if (this.table === 'profiles') url = `${baseUrl}/auth/signup`;
                else if (this.table === 'enrollments') url = `${baseUrl}/enrollments`;
                else if (this.table === 'events') url = `${baseUrl}/events`;
                else if (this.table === 'mails') url = `${baseUrl}/mails`;
                else if (this.table === 'instructors') url = `${baseUrl}/instructors`;
                else if (this.table === 'attendance') url = `${baseUrl}/attendance`;

                if (!url) throw new Error(`Unsupported insert table: ${this.table}`);

                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(singlePayload)
                });
                const data = await res.json();
                
                if (isSingleResult || this.table !== 'courses') {
                    return { data: data, error: res.ok ? null : { message: data.error } };
                }
                return { data: [data], error: res.ok ? null : { message: data.error } };
            }

            // 3. UPDATE
            if (this.pendingOperation === 'update') {
                let url = '';

                if (this.table === 'courses') {
                    const courseId = this.filters.id;
                    if (!courseId) throw new Error('Missing course id filter for update');
                    url = `${baseUrl}/courses/${courseId}`;
                } else if (this.table === 'profiles') {
                    const profileId = this.filters.id;
                    if (profileId) {
                        url = `${baseUrl}/auth/profiles/${profileId}`;
                    } else {
                        url = `${baseUrl}/auth/profile`;
                    }
                } else if (this.table === 'enrollments') {
                    url = `${baseUrl}/enrollments`;
                    this.payload = {
                        ...this.payload,
                        userId: this.filters.user_id,
                        courseId: this.filters.course_id
                    };
                } else if (this.table === 'events') {
                    const eventId = this.filters.id;
                    if (!eventId) throw new Error('Missing event id filter for update');
                    url = `${baseUrl}/events/${eventId}`;
                } else if (this.table === 'instructors') {
                    const instEmail = this.filters.email;
                    if (!instEmail) throw new Error('Missing instructor email filter for update');
                    url = `${baseUrl}/instructors?email=${encodeURIComponent(instEmail)}`;
                }
 
                if (!url) throw new Error(`Unsupported update table: ${this.table}`);
 
                const res = await fetch(url, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(this.payload)
                });
                const data = await res.json();
                return { data, error: res.ok ? null : { message: data.error } };
            }
 
            // 4. DELETE
            if (this.pendingOperation === 'delete') {
                let url = '';
                
                if (this.table === 'courses') {
                    const courseId = this.filters.id;
                    if (!courseId) throw new Error('Missing course id filter for delete');
                    url = `${baseUrl}/courses/${courseId}`;
                } else if (this.table === 'events') {
                    const eventId = this.filters.id;
                    if (!eventId) throw new Error('Missing event id filter for delete');
                    url = `${baseUrl}/events/${eventId}`;
                } else if (this.table === 'instructors') {
                    const instId = this.filters.id;
                    const instEmail = this.filters.email;
                    if (instId) {
                        url = `${baseUrl}/instructors/${instId}`;
                    } else if (instEmail) {
                        url = `${baseUrl}/instructors?email=${encodeURIComponent(instEmail)}`;
                    } else {
                        throw new Error('Missing instructor filter for delete');
                    }
                } else if (this.table === 'profiles') {
                    const profileId = this.filters.id;
                    if (!profileId) throw new Error('Missing profile id filter for delete');
                    url = `${baseUrl}/auth/profiles/${profileId}`;
                } else if (this.table === 'mails') {
                    const mailId = this.filters.id;
                    if (mailId) {
                        url = `${baseUrl}/mails/${mailId}`;
                    } else {
                        url = `${baseUrl}/mails`;
                    }
                }
 
                if (!url) throw new Error(`Unsupported delete table: ${this.table}`);

                const res = await fetch(url, {
                    method: 'DELETE',
                    headers
                });
                const data = await res.json();
                return { data, error: res.ok ? null : { message: data.error } };
            }

            throw new Error('Unsupported operation');
        } catch (e: any) {
            return { data: null, error: { message: e.message } };
        }
    }

    then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
        return this.execute().then(onfulfilled, onrejected);
    }
}

export const mysqlClient = {
    from: (table: string) => new QueryBuilder(table),
    auth: {
        getUser: async () => {
            const isLoggedOut = localStorage.getItem('auth_logged_out') === 'true';
            if (isLoggedOut) return { data: { user: null }, error: null };
            
            const email = getActiveEmail();
            if (!email) return { data: { user: null }, error: null };

            try {
                const res = await fetch('/api/auth/profile', {
                    headers: { 'X-User-Email': email }
                });
                const profile = await res.json();
                if (!res.ok) {
                    localStorage.setItem('auth_logged_out', 'true');
                    return { data: { user: null }, error: null };
                }
                return { data: { user: { id: profile.id, email: profile.email } }, error: null };
            } catch {
                return { data: { user: null }, error: null };
            }
        },
        getSession: async () => {
            const isLoggedOut = localStorage.getItem('auth_logged_out') === 'true';
            if (isLoggedOut) return { data: { session: null }, error: null };
            
            const email = getActiveEmail();
            if (!email) return { data: { session: null }, error: null };

            try {
                const res = await fetch('/api/auth/profile', {
                    headers: { 'X-User-Email': email }
                });
                const profile = await res.json();
                if (!res.ok) {
                    localStorage.setItem('auth_logged_out', 'true');
                    return { data: { session: null }, error: null };
                }
                return { data: { session: { user: { id: profile.id, email: profile.email } } }, error: null };
            } catch {
                return { data: { session: null }, error: null };
            }
        },
        onAuthStateChange: (callback: any) => {
            const handleUpdate = async () => {
                const isLoggedOut = localStorage.getItem('auth_logged_out') === 'true';
                if (isLoggedOut) {
                    callback('SIGNED_OUT', null);
                } else {
                    const email = getActiveEmail();
                    if (email) {
                        try {
                            const res = await fetch('/api/auth/profile', {
                                headers: { 'X-User-Email': email }
                            });
                            const profile = await res.json();
                            if (res.ok) {
                                callback('SIGNED_IN', { user: { id: profile.id, email: profile.email } });
                            } else {
                                callback('SIGNED_OUT', null);
                            }
                        } catch {
                            callback('SIGNED_OUT', null);
                        }
                    } else {
                        callback('SIGNED_OUT', null);
                    }
                }
            };
            
            window.addEventListener('profile-update', handleUpdate);
            handleUpdate();
            return {
                data: {
                    subscription: {
                        unsubscribe: () => {
                            window.removeEventListener('profile-update', handleUpdate);
                        }
                    }
                }
            };
        },
        signInWithPassword: async ({ email, password, options }: any) => {
            try {
                const res = await fetch('/api/auth/signin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) return { data: { user: null }, error: { message: data.error } };

                if (!options?.skipSession) {
                    localStorage.removeItem('auth_logged_out');
                    localStorage.setItem('auth_logged_in_email', data.user.email);
                    localStorage.setItem('auth_logged_in_name', data.user.fullName);
                    localStorage.removeItem('admin-session');
                    localStorage.removeItem('admin-email');
                    localStorage.removeItem('instructor-session');
                    localStorage.removeItem('instructor-email');
                    window.dispatchEvent(new Event('profile-update'));
                }

                return { data: { user: { id: data.user.id, email: data.user.email, fullName: data.user.fullName } }, error: null };
            } catch (err: any) {
                return { data: { user: null }, error: { message: err.message } };
            }
        },
        signUp: async ({ email, password, options }: any) => {
            try {
                const fullName = options?.data?.full_name || email.split('@')[0];
                const signupPassword = password || 'google-oauth-' + Math.random().toString(36).substring(2, 11);
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password: signupPassword,
                        fullName,
                        role: email.endsWith('admin.com') ? 'ADMIN' : 'INDIVIDUAL'
                    })
                });
                const data = await res.json();
                if (!res.ok) return { data: null, error: { message: data.error } };

                localStorage.removeItem('auth_logged_out');
                localStorage.setItem('auth_logged_in_email', data.user.email);
                localStorage.setItem('auth_logged_in_name', data.user.fullName);
                localStorage.removeItem('admin-session');
                localStorage.removeItem('admin-email');
                localStorage.removeItem('instructor-session');
                localStorage.removeItem('instructor-email');
                window.dispatchEvent(new Event('profile-update'));

                return { data: { user: { id: data.user.id, email: data.user.email } }, error: null };
            } catch (err: any) {
                return { data: null, error: { message: err.message } };
            }
        },
        signInWithOAuth: async ({ provider, options }: any) => {
            if (provider === 'google') {
                window.location.href = '/api/auth/google';
            }
            return { data: { provider, url: '/api/auth/google' }, error: null };
        },
        signOut: async () => {
            localStorage.setItem('auth_logged_out', 'true');
            localStorage.removeItem('auth_logged_in_email');
            localStorage.removeItem('auth_logged_in_name');
            localStorage.removeItem('admin-session');
            localStorage.removeItem('admin-email');
            localStorage.removeItem('instructor-session');
            localStorage.removeItem('instructor-email');
            window.dispatchEvent(new Event('profile-update'));
            return { error: null };
        }
    },
    storage: {
        from: (bucketName: string) => ({
            upload: async (filePath: string, file: File, options?: any) => {
                try {
                    const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                    if (!(window as any).__mock_storage__) {
                        (window as any).__mock_storage__ = {};
                    }
                    (window as any).__mock_storage__[filePath] = dataUrl;
                    return { data: { path: filePath }, error: null };
                } catch (err: any) {
                    return { data: null, error: err };
                }
            },
            getPublicUrl: (filePath: string) => {
                const url = (window as any).__mock_storage__?.[filePath] || '';
                return { data: { publicUrl: url } };
            }
        })
    }
};

export const supabase = mysqlClient;
export const supabaseClient = mysqlClient;
