const path = require('path');
const fs = require('fs');
const { DatabaseAdapter, supabase } = require('../db');

const DATA_DIR = path.join(__dirname, '../data');
const CORPORATE_FILE = path.join(DATA_DIR, 'corporate-data.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial mock corporate organization template
const DEFAULT_CORPORATE_DATA = {
    organizations: [
        {
            id: 'org-welile-corp',
            name: 'Acme AI Technologies',
            logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=120&auto=format&fit=crop&q=80',
            contactName: 'Sarah Jenkins',
            contactEmail: 'sarah.jenkins@acmeai.com',
            contactPhone: '+256 700 123 456',
            website: 'https://acmeai.com',
            billingPlan: 'corporate_tier1',
            totalSeats: 25,
            purchasedSeats: 25,
            ownerUserId: 'default-owner',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    members: [
        {
            id: 'mem-1',
            organizationId: 'org-welile-corp',
            userId: 'user-emp-1',
            name: 'David Ochieng',
            email: 'david.o@acmeai.com',
            department: 'Data Science',
            role: 'member',
            status: 'active',
            invitedAt: '2026-10-15T09:00:00Z',
            joinedAt: '2026-10-15T11:20:00Z',
            enrolledCourses: [
                {
                    courseId: 'c1',
                    courseTitle: 'Introduction to Generative AI',
                    progress: 85,
                    completedLessons: 12,
                    totalLessons: 14,
                    status: 'IN_PROGRESS',
                    certificateEarned: false,
                    lastActiveAt: '2026-10-26T14:10:00Z'
                },
                {
                    courseId: 'c2',
                    courseTitle: 'Python for Machine Learning',
                    progress: 100,
                    completedLessons: 20,
                    totalLessons: 20,
                    status: 'COMPLETED',
                    certificateEarned: true,
                    lastActiveAt: '2026-10-24T16:30:00Z'
                }
            ]
        },
        {
            id: 'mem-2',
            organizationId: 'org-welile-corp',
            userId: 'user-emp-2',
            name: 'Amina Nalwanga',
            email: 'amina.n@acmeai.com',
            department: 'Software Engineering',
            role: 'member',
            status: 'active',
            invitedAt: '2026-10-16T10:15:00Z',
            joinedAt: '2026-10-16T14:00:00Z',
            enrolledCourses: [
                {
                    courseId: 'c3',
                    courseTitle: 'Full-Stack LLM Application Development',
                    progress: 60,
                    completedLessons: 9,
                    totalLessons: 15,
                    status: 'IN_PROGRESS',
                    certificateEarned: false,
                    lastActiveAt: '2026-10-26T11:05:00Z'
                }
            ]
        },
        {
            id: 'mem-3',
            organizationId: 'org-welile-corp',
            userId: 'user-emp-3',
            name: 'Brian Mukasa',
            email: 'brian.m@acmeai.com',
            department: 'Product Management',
            role: 'member',
            status: 'active',
            invitedAt: '2026-10-18T08:30:00Z',
            joinedAt: '2026-10-18T09:45:00Z',
            enrolledCourses: [
                {
                    courseId: 'c1',
                    courseTitle: 'Introduction to Generative AI',
                    progress: 100,
                    completedLessons: 14,
                    totalLessons: 14,
                    status: 'COMPLETED',
                    certificateEarned: true,
                    lastActiveAt: '2026-10-22T17:15:00Z'
                }
            ]
        },
        {
            id: 'mem-4',
            organizationId: 'org-welile-corp',
            userId: null,
            name: 'Grace Atuhaire',
            email: 'grace.a@acmeai.com',
            department: 'Quality Assurance',
            role: 'member',
            status: 'pending',
            invitedAt: '2026-10-24T12:00:00Z',
            joinedAt: null,
            enrolledCourses: []
        },
        {
            id: 'mem-5',
            organizationId: 'org-welile-corp',
            userId: null,
            name: 'Joshua Kigozi',
            email: 'joshua.k@acmeai.com',
            department: 'Infrastructure & Cloud',
            role: 'member',
            status: 'pending',
            invitedAt: '2026-10-25T15:30:00Z',
            joinedAt: null,
            enrolledCourses: []
        }
    ]
};

function getCorporateStore() {
    try {
        if (fs.existsSync(CORPORATE_FILE)) {
            const raw = fs.readFileSync(CORPORATE_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[Corporate Service] Error reading store, using defaults:', e.message);
    }
    // Initialize default data file if not present
    saveCorporateStore(DEFAULT_CORPORATE_DATA);
    return DEFAULT_CORPORATE_DATA;
}

function saveCorporateStore(data) {
    try {
        fs.writeFileSync(CORPORATE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('[Corporate Service] Error saving store:', e.message);
    }
}

/**
 * Ensures the account owner / signup user takes the first seat of the organization
 */
function ensureOwnerFirstSeat(store, org, extraInfo = {}) {
    if (!org) return;

    const ownerUserId = org.ownerUserId || extraInfo.userId || null;
    const ownerEmail = (org.contactEmail || extraInfo.userEmail || '').trim().toLowerCase();
    const ownerName = (org.contactName || extraInfo.userName || 'Corporate Lead').trim();

    // Check if the owner/lead already has a seat
    let ownerMember = store.members.find(m => 
        m.organizationId === org.id && 
        m.status !== 'revoked' && (
            m.isOwner === true ||
            (ownerUserId && m.userId === ownerUserId) ||
            (ownerEmail && m.email && m.email.toLowerCase() === ownerEmail)
        )
    );

    if (!ownerMember) {
        ownerMember = {
            id: 'mem-owner-' + org.id,
            organizationId: org.id,
            userId: ownerUserId,
            name: ownerName || 'Corporate Lead',
            email: ownerEmail || 'lead@corporate.com',
            department: 'Corporate Lead',
            role: 'admin',
            isOwner: true,
            status: 'active',
            invitedAt: org.createdAt || new Date().toISOString(),
            joinedAt: org.createdAt || new Date().toISOString(),
            enrolledCourses: []
        };
        // Unshift so owner is always seat #1
        store.members.unshift(ownerMember);
        saveCorporateStore(store);
    } else {
        let changed = false;
        if (ownerMember.status !== 'active') {
            ownerMember.status = 'active';
            changed = true;
        }
        if (!ownerMember.isOwner) {
            ownerMember.isOwner = true;
            changed = true;
        }
        if (ownerName && (!ownerMember.name || ownerMember.name === 'Corporate Lead')) {
            ownerMember.name = ownerName;
            changed = true;
        }
        if (ownerEmail && !ownerMember.email) {
            ownerMember.email = ownerEmail;
            changed = true;
        }
        if (ownerUserId && !ownerMember.userId) {
            ownerMember.userId = ownerUserId;
            changed = true;
        }
        if (changed) {
            saveCorporateStore(store);
        }
    }
}

/**
 * Get organization profile for a given user or return default
 */
async function getOrganization(userId, userEmail) {
    const store = getCorporateStore();

    // Check if user owns an organization or matches email
    let org = store.organizations.find(o => 
        (userId && o.ownerUserId === userId) || 
        (userEmail && o.contactEmail && o.contactEmail.toLowerCase() === userEmail.toLowerCase())
    );

    // If no org found, use the primary organization
    if (!org) {
        org = store.organizations[0];
    }

    if (org) {
        ensureOwnerFirstSeat(store, org, { userId, userEmail });
    }

    // Calculate live seat metrics
    const members = store.members.filter(m => m.organizationId === org.id && m.status !== 'revoked');
    const usedSeats = members.length;
    const activeSeats = members.filter(m => m.status === 'active').length;
    const pendingSeats = members.filter(m => m.status === 'pending').length;
    const availableSeats = Math.max(0, org.totalSeats - usedSeats);

    // Calculate team average progress
    let totalProgress = 0;
    let enrolledCount = 0;
    members.forEach(m => {
        if (m.enrolledCourses && m.enrolledCourses.length > 0) {
            m.enrolledCourses.forEach(c => {
                totalProgress += (c.progress || 0);
                enrolledCount++;
            });
        }
    });
    const avgProgress = enrolledCount > 0 ? Math.round(totalProgress / enrolledCount) : 0;

    return {
        ...org,
        usedSeats,
        activeSeats,
        pendingSeats,
        availableSeats,
        avgProgress,
        totalEnrolledCourses: enrolledCount
    };
}

/**
 * Update organization branding and contact details
 */
async function updateBranding(userId, brandingData) {
    const store = getCorporateStore();
    let org = store.organizations.find(o => o.ownerUserId === userId) || store.organizations[0];

    if (!org) {
        org = {
            id: 'org-' + Date.now(),
            totalSeats: 10,
            purchasedSeats: 10,
            ownerUserId: userId || 'default-owner',
            createdAt: new Date().toISOString()
        };
        store.organizations.push(org);
    }

    if (brandingData.name !== undefined) org.name = brandingData.name.trim();
    if (brandingData.logoUrl !== undefined) org.logoUrl = brandingData.logoUrl.trim();
    if (brandingData.contactName !== undefined) org.contactName = brandingData.contactName.trim();
    if (brandingData.contactEmail !== undefined) org.contactEmail = brandingData.contactEmail.trim();
    if (brandingData.contactPhone !== undefined) org.contactPhone = brandingData.contactPhone.trim();
    if (brandingData.website !== undefined) org.website = brandingData.website.trim();
    org.updatedAt = new Date().toISOString();

    ensureOwnerFirstSeat(store, org, {
        userId,
        userEmail: brandingData.contactEmail,
        userName: brandingData.contactName
    });

    saveCorporateStore(store);

    // If Supabase is connected, attempt sync
    if (supabase) {
        try {
            await supabase.from('organizations').upsert({
                id: org.id,
                name: org.name,
                logo_url: org.logoUrl,
                contact_name: org.contactName,
                contact_email: org.contactEmail,
                contact_phone: org.contactPhone,
                website: org.website,
                total_seats: org.totalSeats,
                updated_at: org.updatedAt
            });
        } catch (dbErr) {
            console.warn('[Corporate Service] Supabase org sync optional note:', dbErr.message);
        }
    }

    return org;
}

/**
 * Update or provision seats count for an organization (e.g. after purchasing seats)
 */
async function provisionSeats(userId, userEmail, seatsCount, planTier, extraData = {}) {
    const store = getCorporateStore();
    let org = store.organizations.find(o => 
        (userId && o.ownerUserId === userId) || 
        (userEmail && o.contactEmail && o.contactEmail.toLowerCase() === userEmail.toLowerCase())
    );

    if (!org) {
        org = {
            id: 'org-' + Date.now(),
            name: extraData.companyName || 'Corporate Partner',
            logoUrl: '',
            contactName: extraData.userName || 'Organization Admin',
            contactEmail: userEmail || '',
            contactPhone: '',
            website: '',
            billingPlan: planTier || (seatsCount >= 50 ? 'corporate_tier2' : 'corporate_tier1'),
            totalSeats: Number(seatsCount) || 10,
            purchasedSeats: Number(seatsCount) || 10,
            ownerUserId: userId || 'default-owner',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        store.organizations.push(org);
    } else {
        if (extraData.companyName && (!org.name || org.name === 'Corporate Partner')) {
            org.name = extraData.companyName;
        }
        org.totalSeats = (org.totalSeats || 0) + (Number(seatsCount) || 10);
        org.purchasedSeats = org.totalSeats;
        org.billingPlan = org.totalSeats >= 50 ? 'corporate_tier2' : 'corporate_tier1';
        org.updatedAt = new Date().toISOString();
    }

    ensureOwnerFirstSeat(store, org, { userId, userEmail, userName: extraData.userName });
    saveCorporateStore(store);
    return org;
}

/**
 * List all members and seats with their enrolled courses & live progress
 */
async function getSeatsAndProgress(orgId, userId, userEmail) {
    const store = getCorporateStore();
    const org = await getOrganization(userId, userEmail);
    const targetOrgId = orgId || org.id;

    ensureOwnerFirstSeat(store, org, { userId, userEmail });

    const members = store.members.filter(m => m.organizationId === targetOrgId && m.status !== 'revoked');

    // Sort with primary owner seat first
    const sortedMembers = [...members].sort((a, b) => {
        if (a.isOwner) return -1;
        if (b.isOwner) return 1;
        return 0;
    });

    return {
        organization: org,
        seats: sortedMembers
    };
}

/**
 * Invite one or more team members to take up corporate seats
 */
async function inviteMembers(orgId, invitesList, senderUser) {
    const store = getCorporateStore();
    const org = store.organizations.find(o => o.id === orgId) || store.organizations[0];

    if (!org) {
        throw new Error('Organization not found');
    }

    const currentMembers = store.members.filter(m => m.organizationId === org.id && m.status !== 'revoked');
    const availableSeats = Math.max(0, org.totalSeats - currentMembers.length);

    if (invitesList.length > availableSeats) {
        throw new Error(`Cannot invite ${invitesList.length} members. Only ${availableSeats} seat(s) available.`);
    }

    const createdInvites = [];
    const timestamp = new Date().toISOString();

    for (const item of invitesList) {
        const email = (item.email || '').trim().toLowerCase();
        if (!email) continue;

        // Check if already invited or member
        const existing = store.members.find(m => 
            m.organizationId === org.id && 
            m.email.toLowerCase() === email && 
            m.status !== 'revoked'
        );

        if (existing) {
            // Already invited/active, skip or refresh
            continue;
        }

        const newMember = {
            id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            organizationId: org.id,
            userId: null,
            name: (item.name || email.split('@')[0] || 'Team Member').trim(),
            email: email,
            department: item.department || 'General',
            role: item.role || 'member',
            status: 'pending',
            invitedAt: timestamp,
            joinedAt: null,
            enrolledCourses: item.courseIds && item.courseIds.length ? item.courseIds.map(cid => ({
                courseId: cid,
                courseTitle: 'Assigned Track',
                progress: 0,
                completedLessons: 0,
                totalLessons: 10,
                status: 'NOT_STARTED',
                certificateEarned: false
            })) : []
        };

        store.members.push(newMember);
        createdInvites.push(newMember);

        // Queue or dispatch invitation email record to Supabase mails table if available
        if (supabase) {
            try {
                await supabase.from('mails').insert({
                    name: newMember.name,
                    email: newMember.email,
                    type: 'INVITATION',
                    message: `You have been invited by ${org.name} to claim a Corporate Learning seat on School of AI. Register or log in to get full sponsored access.`
                });
            } catch (mailErr) {
                console.warn('[Corporate Service] Mail queue note:', mailErr.message);
            }
        }
    }

    saveCorporateStore(store);

    return {
        invitedCount: createdInvites.length,
        invites: createdInvites,
        availableSeats: Math.max(0, org.totalSeats - (currentMembers.length + createdInvites.length))
    };
}

/**
 * Resend invitation email
 */
async function resendInvite(orgId, memberId) {
    const store = getCorporateStore();
    const member = store.members.find(m => m.id === memberId);
    if (!member) throw new Error('Seat / Member not found');

    member.invitedAt = new Date().toISOString();
    saveCorporateStore(store);

    if (supabase) {
        try {
            await supabase.from('mails').insert({
                name: member.name,
                email: member.email,
                type: 'INVITATION_REMINDER',
                message: `Reminder: You have an open Corporate seat waiting for you on School of AI from your organization.`
            });
        } catch (e) {}
    }

    return { success: true, member };
}

/**
 * Revoke seat or remove member
 */
async function revokeSeat(orgId, memberId) {
    const store = getCorporateStore();
    const member = store.members.find(m => m.id === memberId);
    if (!member) throw new Error('Seat / Member not found');

    if (member.isOwner) {
        throw new Error('The primary corporate account owner seat cannot be revoked.');
    }

    member.status = 'revoked';
    member.revokedAt = new Date().toISOString();
    saveCorporateStore(store);

    return { success: true, memberId };
}

/**
 * Claim an invite when a user signs in or registers with matching email
 */
async function claimInvite(userEmail, userId, userName) {
    if (!userEmail) return null;
    const store = getCorporateStore();
    const cleanEmail = userEmail.trim().toLowerCase();

    const member = store.members.find(m => 
        m.email.toLowerCase() === cleanEmail && 
        m.status === 'pending'
    );

    if (member) {
        member.status = 'active';
        member.userId = userId || member.userId;
        if (userName) member.name = userName;
        member.joinedAt = new Date().toISOString();
        saveCorporateStore(store);

        const org = store.organizations.find(o => o.id === member.organizationId);

        // Upgrade profile to SPONSORED in Supabase
        if (userId && supabase) {
            try {
                await supabase.from('profiles').update({
                    role: 'SPONSORED',
                    company_name: org?.name || 'Corporate Sponsored'
                }).eq('id', userId);
            } catch (e) {
                console.warn('[Corporate Service] Profile role update note:', e.message);
            }
        }

        return { member, organization: org };
    }

    return null;
}

module.exports = {
    getCorporateStore,
    getOrganization,
    updateBranding,
    provisionSeats,
    getSeatsAndProgress,
    inviteMembers,
    resendInvite,
    revokeSeat,
    claimInvite
};
