// Mock Supabase Client using localStorage

const DB_KEY = 'welile_local_db';

interface LocalDB {
    courses: any[];
    profiles: any[];
    enrollments: any[];
}

// Initial seed data
const getDB = (): LocalDB => {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) return JSON.parse(stored);

    const initialDB: LocalDB = {
        courses: [
            {
                id: '1',
                title: 'Introduction to AI',
                instructor: 'Sarah Jenkins',
                duration: '4h 30m',
                category: 'Technology',
                rating: 4.8,
                lessons_total: 12,
                image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
                price: 0,
                accessTier: 'FREE',
                status: 'PUBLISHED',
                modules: [
                    {
                        id: 'm1',
                        title: 'Week 1',
                        lessons: [
                            { id: 'l1', title: 'What is AI?', type: 'video', duration: '10m', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                            { id: 'l2', title: 'History of AI', type: 'article', duration: '5m', content: 'AI started in the 1950s...' }
                        ]
                    }
                ]
            }
        ],
        profiles: [
            {
                id: 'user-1',
                full_name: 'Test Student',
                email: 'student@test.com',
                role: 'INDIVIDUAL',
                avatar_url: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
                wallet_balance: 100
            }
        ],
        enrollments: []
    };
    
    localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
    return initialDB;
};

const saveDB = (db: LocalDB) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Chainable mock builder
class QueryBuilder {
    private table: keyof LocalDB;
    private conditions: Array<(item: any) => boolean> = [];
    private pendingOperation: 'select' | 'insert' | 'update' | null = null;
    private payload: any = null;

    constructor(table: keyof LocalDB) {
        this.table = table;
    }

    select(columns?: string) {
        this.pendingOperation = 'select';
        return this;
    }

    insert(data: any | any[]) {
        this.pendingOperation = 'insert';
        this.payload = Array.isArray(data) ? data : [data];
        return this;
    }

    update(data: any) {
        this.pendingOperation = 'update';
        this.payload = data;
        return this;
    }

    eq(column: string, value: any) {
        this.conditions.push((item: any) => item[column] === value);
        return this;
    }

    single() {
        return this.execute(true);
    }

    order(column: string, options?: { ascending?: boolean }) {
        // Just mock the chaining, we won't actually sort for the mock
        return this;
    }

    limit(count: number) {
        // Just mock the chaining
        return this;
    }

    async execute(isSingle = false) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const db = getDB();
        let tableData = db[this.table];

        try {
            if (this.pendingOperation === 'select') {
                let results = tableData.filter(item => this.conditions.every(cond => cond(item)));
                if (isSingle) {
                    if (results.length === 0) throw new Error('No rows found');
                    return { data: results[0], error: null };
                }
                return { data: results, error: null };
            }

            if (this.pendingOperation === 'insert') {
                const inserted = this.payload.map((item: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    created_at: new Date().toISOString(),
                    ...item
                }));
                db[this.table] = [...tableData, ...inserted];
                saveDB(db);
                
                if (isSingle) return { data: inserted[0], error: null };
                return { data: inserted, error: null };
            }

            if (this.pendingOperation === 'update') {
                let updatedItems: any[] = [];
                db[this.table] = tableData.map(item => {
                    if (this.conditions.every(cond => cond(item))) {
                        const updated = { ...item, ...this.payload };
                        updatedItems.push(updated);
                        return updated;
                    }
                    return item;
                });
                saveDB(db);

                if (isSingle) {
                    if (updatedItems.length === 0) throw new Error('No rows updated');
                    return { data: updatedItems[0], error: null };
                }
                return { data: updatedItems, error: null };
            }

            throw new Error('Unsupported operation');
        } catch (e: any) {
            return { data: null, error: { message: e.message } };
        }
    }

    // Since we await the builder directly in useAdmin/useCourses
    then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
        return this.execute().then(onfulfilled, onrejected);
    }
}

export const supabase = {
    from: (table: string) => new QueryBuilder(table as keyof LocalDB),
    auth: {
        getSession: async () => {
            const isLoggedOut = localStorage.getItem('mock_logged_out') === 'true';
            if (isLoggedOut) return { data: { session: null }, error: null };
            return { data: { session: { user: { id: 'user-1' } } }, error: null };
        },
        onAuthStateChange: (callback: any) => {
            const isLoggedOut = localStorage.getItem('mock_logged_out') === 'true';
            setTimeout(() => {
                if (isLoggedOut) {
                    callback('SIGNED_OUT', null);
                } else {
                    callback('SIGNED_IN', { user: { id: 'user-1' } });
                }
            }, 100);
            return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signInWithPassword: async ({ email }: any) => {
            localStorage.removeItem('mock_logged_out');
            return { data: { user: { id: 'user-1', email } }, error: null };
        },
        signUp: async ({ email }: any) => {
            localStorage.removeItem('mock_logged_out');
            return { data: { session: { user: { id: 'user-1', email } }, user: { id: 'user-1', email } }, error: null };
        },
        signInWithOAuth: async ({ provider }: any) => {
            localStorage.removeItem('mock_logged_out');
            return { data: { provider, url: '' }, error: null };
        },
        signOut: async () => {
            localStorage.setItem('mock_logged_out', 'true');
            return { error: null };
        }
    }
};
