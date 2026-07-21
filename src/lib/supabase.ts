// Mock Supabase Client using localStorage

const DB_KEY = 'welile_local_db';

interface LocalDB {
    courses: any[];
    profiles: any[];
    enrollments: any[];
    mails: any[];
    instructors?: any[];
}

const defaultCourses = [
    {
        id: '1',
        title: 'Introduction to AI',
        instructor: 'Sarah Jenkins',
        duration: '4h 30m',
        category: 'Technology',
        rating: 4.8,
        lessons_total: 12,
        image_url: '',
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
    },
    {
        id: '2',
        title: 'Deep Learning & Neural Networks',
        instructor: 'Dr. Kenji Tanaka',
        duration: '6h 15m',
        category: 'Technology',
        rating: 4.9,
        lessons_total: 10,
        image_url: '',
        price: 0,
        accessTier: 'FREE',
        status: 'PUBLISHED',
        modules: [
            {
                id: 'dl-m1',
                title: 'Week 1 - Basics of Deep Learning',
                lessons: [
                    { id: 'dl-l1', title: 'What is Deep Learning?', type: 'video', duration: '12m', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                    { id: 'dl-l2', title: 'Neural Network Architectures', type: 'article', duration: '8m', content: 'An artificial neural network is inspired by biological brains...' }
                ]
            }
        ]
    },
    {
        id: '3',
        title: 'Natural Language Processing (NLP)',
        instructor: 'Sarah Jenkins',
        duration: '5h 45m',
        category: 'Technology',
        rating: 4.7,
        lessons_total: 8,
        image_url: '',
        price: 0,
        accessTier: 'FREE',
        status: 'PUBLISHED',
        modules: [
            {
                id: 'nlp-m1',
                title: 'Week 1 - Foundations of NLP',
                lessons: [
                    { id: 'nlp-l1', title: 'Intro to NLP', type: 'video', duration: '10m', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                    { id: 'nlp-l2', title: 'Text Tokenization', type: 'article', duration: '6m', content: 'Tokenization involves splitting text into individual words or tokens...' }
                ]
            }
        ]
    },
    {
        id: '4',
        title: 'Python for Data Science',
        instructor: 'Marcus Vance',
        duration: '8h 20m',
        category: 'Python',
        rating: 4.9,
        lessons_total: 15,
        image_url: '',
        price: 0,
        accessTier: 'FREE',
        status: 'PUBLISHED',
        modules: [
            {
                id: 'py-m1',
                title: 'Week 1 - Pandas & NumPy Essentials',
                lessons: [
                    { id: 'py-l1', title: 'Python Basics Recap', type: 'video', duration: '15m', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                    { id: 'py-l2', title: 'Dataframes with Pandas', type: 'article', duration: '10m', content: 'Pandas provides fast, flexible, and expressive data structures...' }
                ]
            }
        ]
    }
];

// Initial seed data
const getDB = (): LocalDB => {
    const stored = localStorage.getItem(DB_KEY);
    let db: LocalDB;
    if (stored) {
        db = JSON.parse(stored);
    } else {
        db = {
            courses: defaultCourses,
            profiles: [
                {
                    id: 'user-1',
                    full_name: 'Test Student',
                    email: 'student@test.com',
                    role: 'INDIVIDUAL',
                    avatar_url: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
                    wallet_balance: 100
                },
                {
                    id: 'user-chemayek',
                    full_name: 'Abraham Chemayek',
                    email: 'chemayekabraham289@gmail.com',
                    role: 'INDIVIDUAL',
                    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
                    wallet_balance: 100
                },
                {
                    id: 'user-collins',
                    full_name: 'Mr. Collins',
                    email: 'mr.collins@schoolofai.edu',
                    role: 'ADMIN',
                    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
                    wallet_balance: 100
                }
            ],
            enrollments: [],
            mails: [],
            instructors: [
                {
                    id: 'inst-1',
                    name: 'Sarah Jenkins',
                    email: 'sarah.jenkins@schoolofai.edu',
                    bio: 'Sarah is an AI Researcher specializing in Natural Language Processing and Cognitive Computing.',
                    avatar: 'SJ',
                    courses_count: 2
                },
                {
                    id: 'inst-2',
                    name: 'Dr. Kenji Tanaka',
                    email: 'kenji.tanaka@schoolofai.edu',
                    bio: 'Dr. Tanaka has 15+ years of academic research experience in Deep Learning and Neural Network architectures.',
                    avatar: 'KT',
                    courses_count: 1
                },
                {
                    id: 'inst-3',
                    name: 'Marcus Vance',
                    email: 'marcus.vance@schoolofai.edu',
                    bio: 'Marcus is a Data Scientist who loves mentoring students in Python and Data Engineering.',
                    avatar: 'MV',
                    courses_count: 1
                }
            ]
        };
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        localStorage.setItem('default-courses-seeded', 'true');
        return db;
    }

    // Migration / update step: ensure Chemayek, Collins, and Test Student profiles have high quality avatars and correct names
    let dbUpdated = false;

    if (!db.instructors) {
        db.instructors = [
            {
                id: 'inst-1',
                name: 'Sarah Jenkins',
                email: 'sarah.jenkins@schoolofai.edu',
                bio: 'Sarah is an AI Researcher specializing in Natural Language Processing and Cognitive Computing.',
                avatar: 'SJ',
                courses_count: 2
            },
            {
                id: 'inst-2',
                name: 'Dr. Kenji Tanaka',
                email: 'kenji.tanaka@schoolofai.edu',
                bio: 'Dr. Tanaka has 15+ years of academic research experience in Deep Learning and Neural Network architectures.',
                avatar: 'KT',
                courses_count: 1
            },
            {
                id: 'inst-3',
                name: 'Marcus Vance',
                email: 'marcus.vance@schoolofai.edu',
                bio: 'Marcus is a Data Scientist who loves mentoring students in Python and Data Engineering.',
                avatar: 'MV',
                courses_count: 1
            }
        ];
        dbUpdated = true;
    }

    if (!db.mails) {
        db.mails = [];
        dbUpdated = true;
    } else {
        const originalLength = db.mails.length;
        db.mails = db.mails.filter((m: any) => m.id !== 'mail-1' && m.id !== 'mail-2');
        if (db.mails.length !== originalLength) {
            dbUpdated = true;
        }
    }

    // Reset legacy roles (e.g. PLUS, SPONSORED) to INDIVIDUAL (Basic) by default
    db.profiles.forEach((p: any) => {
        if (p.role !== 'PRO' && p.role !== 'ADMIN' && p.role !== 'INDIVIDUAL') {
            p.role = 'INDIVIDUAL';
            dbUpdated = true;
        }
    });
    
    const chemayekProfile = db.profiles.find(p => p.email === 'chemayekabraham289@gmail.com');
    if (chemayekProfile) {
        if (chemayekProfile.full_name !== 'Abraham Chemayek') {
            chemayekProfile.full_name = 'Abraham Chemayek';
            dbUpdated = true;
        }
    }

    const collinsProfile = db.profiles.find(p => p.email === 'mr.collins@schoolofai.edu');
    if (collinsProfile) {
        if (collinsProfile.full_name !== 'Mr. Collins') {
            collinsProfile.full_name = 'Mr. Collins';
            dbUpdated = true;
        }
    }

    const testStudentProfile = db.profiles.find(p => p.email === 'student@test.com');
    if (testStudentProfile) {
        if (testStudentProfile.full_name !== 'Test Student') {
            testStudentProfile.full_name = 'Test Student';
            dbUpdated = true;
        }
    }

    if (dbUpdated) {
        saveDB(db);
    }

    // Ensure all default courses exist in the existing database ONCE
    const seeded = localStorage.getItem('default-courses-seeded') === 'true';
    if (!seeded) {
        let updated = false;
        defaultCourses.forEach(dc => {
            if (!db.courses.some(c => c.id === dc.id)) {
                db.courses.push(dc);
                updated = true;
            }
        });

        if (updated) {
            localStorage.setItem(DB_KEY, JSON.stringify(db));
        }
        localStorage.setItem('default-courses-seeded', 'true');
    }

    return db;
};

const saveDB = (db: LocalDB) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Chainable mock builder
class QueryBuilder {
    private table: keyof LocalDB;
    private conditions: Array<(item: any) => boolean> = [];
    private pendingOperation: 'select' | 'insert' | 'update' | 'delete' | null = null;
    private payload: any = null;

    constructor(table: keyof LocalDB) {
        this.table = table;
    }

    select(columns?: string) {
        if (!this.pendingOperation) {
            this.pendingOperation = 'select';
        }
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

    delete() {
        this.pendingOperation = 'delete';
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

            if (this.pendingOperation === 'delete') {
                let deletedItems: any[] = [];
                db[this.table] = tableData.filter(item => {
                    const match = this.conditions.every(cond => cond(item));
                    if (match) {
                        deletedItems.push(item);
                        return false;
                    }
                    return true;
                });
                saveDB(db);
                return { data: deletedItems, error: null };
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
        getUser: async () => {
            const isLoggedOut = localStorage.getItem('mock_logged_out') === 'true';
            if (isLoggedOut) return { data: { user: null }, error: null };
            
            const email = localStorage.getItem('mock_logged_in_email') || 'student@test.com';
            const db = getDB();
            const profile = db.profiles.find(p => p.email === email);
            if (!profile) {
                localStorage.setItem('mock_logged_out', 'true');
                localStorage.removeItem('mock_logged_in_email');
                localStorage.removeItem('mock_logged_in_name');
                return { data: { user: null }, error: null };
            }
            return { data: { user: { id: profile.id, email: profile.email } }, error: null };
        },
        getSession: async () => {
            const isLoggedOut = localStorage.getItem('mock_logged_out') === 'true';
            if (isLoggedOut) return { data: { session: null }, error: null };
            
            const email = localStorage.getItem('mock_logged_in_email') || 'student@test.com';
            const db = getDB();
            let profile = db.profiles.find(p => p.email === email);
            if (!profile) {
                // If profile doesn't exist, log them out
                localStorage.setItem('mock_logged_out', 'true');
                localStorage.removeItem('mock_logged_in_email');
                localStorage.removeItem('mock_logged_in_name');
                return { data: { session: null }, error: null };
            }
            return { data: { session: { user: { id: profile.id, email: profile.email } } }, error: null };
        },
        onAuthStateChange: (callback: any) => {
            const isLoggedOut = localStorage.getItem('mock_logged_out') === 'true';
            setTimeout(() => {
                if (isLoggedOut) {
                    callback('SIGNED_OUT', null);
                } else {
                    const email = localStorage.getItem('mock_logged_in_email') || 'student@test.com';
                    const db = getDB();
                    let profile = db.profiles.find(p => p.email === email);
                    if (!profile) {
                        // If profile doesn't exist, log them out
                        localStorage.setItem('mock_logged_out', 'true');
                        localStorage.removeItem('mock_logged_in_email');
                        localStorage.removeItem('mock_logged_in_name');
                        callback('SIGNED_OUT', null);
                    } else {
                        callback('SIGNED_IN', { user: { id: profile.id, email: profile.email } });
                    }
                }
            }, 100);
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
        signInWithPassword: async ({ email }: any) => {
            localStorage.removeItem('mock_logged_out');
            localStorage.setItem('mock_logged_in_email', email);
            
            const db = getDB();
            let profile = db.profiles.find(p => p.email === email);
            if (!profile) {
                return { data: { user: null }, error: { message: 'Invalid credentials' } };
            } else {
                localStorage.setItem('mock_logged_in_name', profile.full_name);
            }
            window.dispatchEvent(new Event('profile-update'));
            return { data: { user: { id: profile.id, email } }, error: null };
        },
        signUp: async ({ email, options }: any) => {
            localStorage.removeItem('mock_logged_out');
            localStorage.setItem('mock_logged_in_email', email);
            const rawName = options?.data?.full_name || email.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            
            const isChemayek = email === 'chemayekabraham289@gmail.com';
            const isCollins = email === 'mr.collins@schoolofai.edu';
            const isTestStudent = email === 'student@test.com';
            
            const fullName = isChemayek ? 'Abraham Chemayek' : isCollins ? 'Mr. Collins' : isTestStudent ? 'Test Student' : rawName;
            localStorage.setItem('mock_logged_in_name', fullName);

            const db = getDB();
            let profile = db.profiles.find(p => p.email === email);
            if (!profile) {
                const avatar = isChemayek 
                    ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150' 
                    : isCollins 
                        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150' 
                        : isTestStudent 
                            ? 'https://i.pravatar.cc/150?u=a042581f4e29026704d' 
                            : `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`;

                profile = {
                    id: email === 'student@test.com' ? 'user-1' : 'user-' + Math.random().toString(36).substr(2, 9),
                    full_name: fullName,
                    email: email,
                    role: isCollins ? 'ADMIN' : 'INDIVIDUAL',
                    avatar_url: avatar,
                    wallet_balance: 100
                };
                db.profiles.push(profile);
                saveDB(db);
            } else {
                localStorage.setItem('mock_logged_in_name', profile.full_name);
            }
            window.dispatchEvent(new Event('profile-update'));
            return { data: { session: { user: { id: profile.id, email } }, user: { id: profile.id, email } }, error: null };
        },
        signInWithOAuth: async ({ provider, options }: any) => {
            localStorage.removeItem('mock_logged_out');
            
            if (provider === 'google') {
                const mockEmail = 'student@gmail.com';
                const mockName = 'Google User';
                
                let db = getDB();
                let profile = db.profiles.find((p: any) => p.email === mockEmail);
                if (!profile) {
                    profile = {
                        id: 'google-user-' + Date.now(),
                        email: mockEmail,
                        full_name: mockName,
                        role: 'INDIVIDUAL',
                        avatar_url: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff',
                        wallet_balance: 0,
                        skills: []
                    };
                    db.profiles.push(profile);
                    saveDB(db);
                }
                
                localStorage.setItem('mock_logged_in_email', mockEmail);
                localStorage.setItem('mock_logged_in_name', mockName);
                window.dispatchEvent(new Event('profile-update'));

                setTimeout(() => {
                    if (options?.redirectTo) {
                        window.location.href = options.redirectTo;
                    } else {
                        window.location.href = '/dashboard';
                    }
                }, 600);
            }

            return { data: { provider, url: '' }, error: null };
        },
        signOut: async () => {
            localStorage.setItem('mock_logged_out', 'true');
            localStorage.removeItem('mock_logged_in_email');
            localStorage.removeItem('mock_logged_in_name');
            window.dispatchEvent(new Event('profile-update'));
            return { error: null };
        }
    }
};
