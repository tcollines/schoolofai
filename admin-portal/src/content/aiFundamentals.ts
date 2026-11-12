// AI Fundamentals: Use AI with Confidence
// Free course, sponsored by Welile Technologies.
// Source material: the three "AI Fundamentals" teaching decks (Lessons 1-3), restructured for self-paced study.
//
// Video: set `videoId` (YouTube) or `videoUrl` (HLS / mp4) on a lesson as each recording is ready.
// Until then the lesson shows the written lesson notes and a "recording coming soon" state.

export interface QuizQuestion {
    id: string;
    text: string;
    options: string[];
    correct: number; // index into options
    explanation: string;
}

export interface GlossaryEntry {
    term: string;
    meaning: string;
    example: string;
}

export type ItemKind = 'video' | 'reading' | 'quiz';

export interface CourseItem {
    id: string;                 // stable id, also used by the database (learn_progress.item_id)
    kind: ItemKind;
    title: string;
    minutes: number;
    summary?: string;           // lesson notes / transcript summary
    points?: string[];          // key points
    tryIt?: { title: string; steps: string[] };
    glossary?: GlossaryEntry[];
    questions?: QuizQuestion[]; // for kind === 'quiz'
    videoId?: string;
    videoUrl?: string;
    audioUrl?: string;           // small audio-only version, used by the Audio only option
}

export interface CourseModuleDef {
    id: string;                 // m0 ... m6
    number: number;
    title: string;
    blurb: string;
    items: CourseItem[];
}

export const COURSE = {
    slug: 'ai-fundamentals',
    title: 'AI Fundamentals: Use AI with Confidence',
    short: 'AI Fundamentals',
    tagline: 'Understand AI, use it for real work, and stay safe doing it. Free, at your own pace, with a certificate at the end.',
    hours: '6 hours',
    totalMinutes: 385,
    level: 'Beginner',
    language: 'English',
    sponsor: 'Welile Technologies',
    passModule: 70,
    passFinal: 80,
    finalQuestions: 20,
    finalAttemptsPer24h: 3,
    outcomes: [
        'Explain what AI is in one clear sentence, and how machine learning, deep learning and generative AI fit together',
        'Tell AI that sorts things apart from AI that creates things',
        'Ask AI clearly using context, task and format, and improve answers without starting over',
        'Use AI to brainstorm, draft, summarise and automate everyday work',
        'Check what AI gives you, spot made-up facts, and notice bias',
        'Know what never goes into a public AI tool, and stay the human in charge'
    ],
    audience: [
        'Students and school leavers',
        'Job seekers and freelancers',
        'Small business owners and their teams',
        'Anyone curious about AI, no technical background needed'
    ],
    faq: [
        { q: 'Do I need to pay anything?', a: 'No. The course and the certificate are free, sponsored by Welile Technologies.' },
        { q: 'Do I need a computer?', a: 'A smartphone is enough. Videos adapt to slow connections, and every lesson has written notes too.' },
        { q: 'How long does it take?', a: 'About 6 hours in total. Most people finish in one to two weeks, studying a little each day.' },
        { q: 'Can I join live classes?', a: 'Yes. Live sessions are optional and listed in the timetable. Replays are posted afterwards.' },
        { q: 'How do I get the certificate?', a: 'Finish every lesson, pass each module quiz, and pass the final assessment. Your certificate is issued instantly and can be verified online.' },
        { q: 'Which AI tool do I need?', a: 'Any major chatbot works. The course is tool-neutral and shows you how to pick one.' }
    ],
    signatories: [
        { name: 'Collines Tumwine', title: 'CEO, Welile School of AI', signatureUrl: '' },
        { name: 'Benjamin Muhangzi', title: 'CEO, Welile Technologies', signatureUrl: '' }
    ]
};

const q = (id: string, text: string, options: string[], correct: number, explanation: string): QuizQuestion =>
    ({ id, text, options, correct, explanation });

export const MODULES: CourseModuleDef[] = [
    // ------------------------------------------------------------------ MODULE 0
    {
        id: 'm0', number: 0, title: 'Welcome', blurb: 'How this course works and how to get your certificate.',
        items: [
            {
                id: 'm0-l1', kind: 'video', title: 'Welcome to AI Fundamentals', minutes: 5, videoUrl: '/video/m0-l1.mp4', audioUrl: '/audio/m0-l1.mp3',
                summary: 'A short welcome: who the course is for, what you will be able to do at the end, and how to study it. You will use AI yourself in nearly every lesson, so keep a chatbot open on your phone or laptop.',
                points: [
                    'Seven short modules, each with videos, a hands-on task and a quiz',
                    'Study at your own pace and pick up where you left off',
                    'Join optional live classes if you want to ask questions',
                    'Finish everything and pass the final assessment to earn your certificate'
                ]
            },
            {
                id: 'm0-guide', kind: 'reading', title: 'How the course and certificate work', minutes: 6,
                summary: 'Everything you need to know before you start.',
                points: [
                    'Each lesson is marked complete when you finish the video or tap "Mark complete".',
                    'Module quizzes need 70% to pass. You can retake them as often as you like.',
                    'The final assessment has 20 questions and needs 80% to pass. You can try 3 times in 24 hours.',
                    'Your certificate is issued the moment you finish, carries a unique ID, and can be checked by anyone on our verify page.',
                    'Using little data? Turn on Data saver in the player to lower video quality, or switch to Audio only.',
                    'Stuck? Ask in the Q&A tab or join a live class.'
                ]
            }
        ]
    },
    // ------------------------------------------------------------------ MODULE 1
    {
        id: 'm1', number: 1, title: 'What AI really is', blurb: 'AI, machine learning, deep learning and generative AI, in plain language.',
        items: [
            {
                id: 'm1-l1', kind: 'video', title: 'You already use AI', minutes: 5,
                summary: 'You have been using AI for years without calling it that. Your phone suggests the next word. YouTube or TikTok shows videos you like. Your phone unlocks with your face. Google Maps guesses your arrival time. Spam goes into its own folder. All of that is AI.',
                points: [
                    'Next-word suggestions on your keyboard',
                    'Video recommendations',
                    'Face unlock',
                    'Maps arrival times',
                    'Spam filters'
                ],
                tryIt: { title: 'Spot AI in your day', steps: ['Write down three places AI showed up for you today.', 'For each one, note whether it sorted, predicted or created something.'] }
            },
            {
                id: 'm1-l2', kind: 'video', title: "What AI is, and what it isn't", minutes: 7,
                summary: 'AI is a computer doing a job that normally needs human thinking: understanding speech, making decisions, translating languages. Google Maps picks the fastest route, Google Translate turns Luganda into English, and your bank app flags a strange payment. There are three common mistakes about AI.',
                points: [
                    'AI is not a robot. Most AI is software on your phone or in a data centre.',
                    'AI is not new. The name dates from the 1950s. What is new is one special kind: generative AI.',
                    'AI is not a person thinking. It finds patterns in data. The results can look like thinking, but it is not a human mind.'
                ]
            },
            {
                id: 'm1-l3', kind: 'video', title: 'Machine learning: from rules to examples', minutes: 8,
                summary: 'The old way is to write the rules: "If a message says You have won, it is spam." Then scammers write "Congratulations, you are selected" and the rule fails. You would need a million rules and still miss things. The machine learning way is to show the computer 10,000 messages, each marked spam or not spam, and let it find the pattern. Think of a child learning what a mango is: you never give a list of rules, you show examples.',
                points: [
                    'Rules-based: a person writes every rule, and it breaks easily',
                    'Machine learning: the computer learns the pattern from examples',
                    'More examples usually means better results'
                ],
                tryIt: { title: 'Teach it with examples', steps: ['Think of something you could sort into two groups, such as ripe and unripe fruit.', 'Describe five examples of each group. That is what a machine learning system would be shown.'] }
            },
            {
                id: 'm1-l4', kind: 'video', title: 'Deep learning and the AI family', minutes: 7,
                summary: 'Think of circles inside circles. Every taxi is a car, every car is a vehicle, but not every vehicle is a car. Generative AI is built on deep learning. Deep learning is a kind of machine learning. Machine learning is a kind of AI. Deep learning uses layers: the first layer sees edges and lines, the next sees shapes, then "that looks like an eye", and finally "that is a face". It is inspired by how brain cells connect, but it is maths, not a brain.',
                points: [
                    'AI contains machine learning, which contains deep learning, which contains generative AI',
                    'Deep learning is strong with messy data: photos, voices, video',
                    'Face unlock and voice assistants use it'
                ]
            },
            {
                id: 'm1-l5', kind: 'video', title: 'Generative AI and large language models', minutes: 8,
                summary: 'Traditional AI recognises: spam or not spam, a face or not a face, fraud or not fraud. Generative AI creates: it writes text, makes pictures, writes code and composes music. It does not look up an answer and paste it. It generates it from patterns it learned. A large language model, or LLM, learned from a massive amount of text and works with words. It is the engine behind ChatGPT, Gemini and Claude. It predicts the next word, then the next, then the next. Sounding right is not the same as being right.',
                points: [
                    'Traditional AI sorts, scores and predicts',
                    'Generative AI creates new text, pictures, code and audio',
                    'An LLM predicts the next word, at a very large scale',
                    'It can be wrong and completely sure, so you check'
                ],
                tryIt: {
                    title: 'Your phone already does this',
                    steps: [
                        'Open any chat on your phone and type "Good".',
                        'Tap the middle suggestion. Then again. And again.',
                        'Your phone is guessing the next word. A language model does the same on a much bigger scale.',
                        'Now ask a chatbot: "Write a short, polite message to my landlord asking for two more days to pay rent." Ask the exact same thing again and compare.'
                    ]
                }
            },
            {
                id: 'm1-recap', kind: 'reading', title: 'Key words: Module 1', minutes: 5,
                summary: 'The lesson on one page.',
                points: ['AI is not magic. It is advanced pattern recognition. Traditional AI finds patterns to sort things. Generative AI uses patterns to create things. It can be wrong and sound sure, so you stay in charge and check.'],
                glossary: [
                    { term: 'AI', meaning: 'A computer doing something that normally needs a human brain', example: 'Google Maps picking your route' },
                    { term: 'Machine learning', meaning: 'AI that learns from examples instead of written rules', example: 'A spam filter trained on marked messages' },
                    { term: 'Deep learning', meaning: 'Machine learning in layers, good with photos and voices', example: 'Face unlock' },
                    { term: 'Generative AI', meaning: 'AI that creates new content', example: 'A chatbot drafting a message' },
                    { term: 'Large language model', meaning: 'Generative AI trained on huge amounts of text to predict the next word', example: 'ChatGPT, Gemini, Claude' },
                    { term: 'Traditional AI', meaning: 'AI that sorts, scores and predicts', example: 'A fraud alert from your bank' }
                ]
            },
            {
                id: 'm1-quiz', kind: 'quiz', title: 'Module 1 quiz', minutes: 10,
                questions: [
                    q('m1q1', 'Which sentence best describes AI?', ['A robot with a metal body', 'A computer doing a job that normally needs human thinking', 'A person typing answers behind the screen', 'A technology invented in the last two years'], 1, 'AI is software doing tasks that usually need human thinking. Most AI has no body, and the field dates from the 1950s.'),
                    q('m1q2', 'What does "machine learning" mean?', ['Learning from examples instead of following written rules', 'A machine that learns to walk', 'Typing rules into a computer one by one', 'Copying answers from a search engine'], 0, 'Machine learning finds patterns in examples, such as thousands of messages marked spam or not spam.'),
                    q('m1q3', 'Which of these is traditional AI, not generative AI?', ['Writing a wedding speech for you', 'Making a poster from a description', 'Face unlock on your phone', 'Writing computer code'], 2, 'Face unlock recognises and sorts. The others create new content.'),
                    q('m1q4', 'What is a large language model trained to do?', ['Look up the right answer in a database', 'Predict the next word', 'Think like a person', 'Check whether facts are true'], 1, 'An LLM predicts the next word, again and again. It does not check what is true.'),
                    q('m1q5', 'A chatbot gives a confident answer that is wrong. What does this show?', ['The chatbot is broken', 'Sounding right is not the same as being right', 'Chatbots always lie', 'You asked the wrong question'], 1, 'Language models predict what fits, so they can be wrong and completely sure. You stay in charge and check.')
                ]
            }
        ]
    },
    // ------------------------------------------------------------------ MODULE 2
    {
        id: 'm2', number: 2, title: 'How to talk to AI', blurb: 'Prompting: ask clearly, improve answers, and work from your own text.',
        items: [
            {
                id: 'm2-l1', kind: 'video', title: 'Pick a tool and get set up', minutes: 6,
                summary: 'Any major chatbot can do the jobs in this course. Pick one and learn it well. Free versions exist, with limits, and free tools may use what you type, so keep private information out. Check the settings that control how your chats are used.',
                points: [
                    'Choose one tool and stay with it while you learn',
                    'Sign in and find where you type your request',
                    'Look for the privacy and data settings',
                    'Quality in Luganda is uneven, so have a fluent speaker check important text'
                ],
                tryIt: { title: 'Set up your tool', steps: ['Open your chosen chatbot and sign in.', 'Find the settings page and read how your chats are used.', 'Type: "Introduce yourself in two sentences." Notice how it answers.'] }
            },
            {
                id: 'm2-l2', kind: 'video', title: 'Context, task, format: the three-part prompt', minutes: 9,
                summary: 'A good request has three parts. Context: who you are and the situation. Task: what you want it to do. Format: how you want it, such as length, tone and shape. Compare a weak request with a strong one. Weak: "Write an email." Strong: "I run a small bakery in Entebbe. Write a short, friendly email to a customer confirming their cake order for Saturday, UGX 120,000, pickup at 10am. Keep it under 100 words."',
                points: [
                    'Context: who you are and the situation',
                    'Task: what you want it to do',
                    'Format: length, tone and shape',
                    'More useful detail in, more useful answer out'
                ],
                tryIt: { title: 'Upgrade a weak prompt', steps: ['Start with: "Write an email."', 'Rewrite it with your real situation, a clear task and a format.', 'Send both and compare the answers.'] }
            },
            {
                id: 'm2-l3', kind: 'video', title: "Not quite right? Refine, don't restart", minutes: 6,
                summary: 'When an answer is not quite right, do not start again. Starting over throws away what was already good. Give a follow-up instruction instead.',
                points: ['"Make it shorter."', '"Make it warmer."', '"Explain that in simpler words."', '"Use a more formal tone."', '"Give me three versions."', '"Add an example."'],
                tryIt: { title: 'Three refinements', steps: ['Ask for a short thank-you message to a customer.', 'Ask it to make the message warmer, then shorter, then to give you three versions.', 'Pick your favourite and edit it by hand.'] }
            },
            {
                id: 'm2-l4', kind: 'video', title: 'Give it your own text to work from', minutes: 7,
                summary: 'AI does much better when you give it the material to work from. Paste in a draft, a set of notes or a description and say what to do with it. You can also ask it to say when it does not know. Be careful what you paste: nothing private, confidential or personal should go into a public tool. Describe the problem, not the person.',
                points: [
                    'Paste your own text and say what to do with it',
                    'Ask it to say when it does not know',
                    'Remove names, numbers and private details first',
                    'Describe the problem, not the person'
                ],
                tryIt: { title: 'Work from your own draft', steps: ['Write three rough sentences about your day.', 'Paste them and ask: "Improve this for a friendly newsletter, keeping the meaning."', 'Compare. What did it keep, and what did it add?'] }
            },
            {
                id: 'm2-recap', kind: 'reading', title: 'Key words: Module 2', minutes: 5,
                summary: 'The lesson on one page.',
                glossary: [
                    { term: 'Prompt', meaning: 'The instruction you give an AI', example: '"Write a polite follow-up email..."' },
                    { term: 'Context', meaning: 'Who you are and the situation', example: '"I run a small bakery in Entebbe."' },
                    { term: 'Format', meaning: 'How you want the answer shaped', example: '"Under 100 words, friendly tone."' },
                    { term: 'Refine', meaning: 'Improve an answer with follow-up instructions', example: '"Make it shorter."' }
                ]
            },
            {
                id: 'm2-quiz', kind: 'quiz', title: 'Module 2 quiz', minutes: 10,
                questions: [
                    q('m2q1', 'What are the three parts of a good request?', ['Name, date, place', 'Context, task, format', 'Question, answer, source', 'Start, middle, end'], 1, 'Context says who you are and the situation, task says what to do, format says how you want it.'),
                    q('m2q2', 'Which prompt is strongest?', ['Write an email.', 'Write a nice email to a customer.', 'I run a small bakery in Entebbe. Write a short, friendly email confirming a cake order for Saturday, pickup 10am, under 100 words.', 'Email please, quick.'], 2, 'The strong prompt has context, a clear task and a format.'),
                    q('m2q3', 'The answer is not quite right. What is the best next step?', ['Close the chat and start a new one', 'Give a follow-up instruction such as "make it shorter"', 'Accept it anyway', 'Ask the same thing again exactly'], 1, 'Refining keeps what was already good. Starting over throws it away.'),
                    q('m2q4', 'Which text is fine to paste into a public chatbot?', ['A customer\'s ID number', 'Your mobile money PIN', 'Your own rough draft of a blog post', 'A client contract with names and amounts'], 2, 'Your own draft with no private details is fine. Private and confidential details never go into a public tool.'),
                    q('m2q5', 'Why add a format to your request?', ['It makes the AI cheaper', 'You get an answer with the length, tone and shape you can use', 'It stops the AI making mistakes', 'It is required by the tool'], 1, 'Telling the AI the shape you want saves you editing time.')
                ]
            }
        ]
    },
    // ------------------------------------------------------------------ MODULE 3
    {
        id: 'm3', number: 3, title: 'Make AI work for you', blurb: 'Four everyday jobs: brainstorm, draft, summarise and automate.',
        items: [
            {
                id: 'm3-l1', kind: 'video', title: 'AI is your co-pilot, not your replacement', minutes: 6,
                summary: 'AI saves time on first drafts, is a partner when you are stuck, organises complex information fast, and handles simple tasks without coding. But you stay in charge. It drafts, you decide.',
                points: ['Saves time on first drafts', 'A partner when you are stuck', 'Organises complex information fast', 'Handles simple tasks with no coding', 'AI drafts. You decide.']
            },
            {
                id: 'm3-l2', kind: 'video', title: 'Job 1: Beat the blank page (brainstorm)', minutes: 8,
                summary: 'When you are stuck, AI is the fastest way to go from nothing to a first draft worth reacting to. Ask for 10 taglines for a small business, an outline for a talk, a meeting agenda, or interview questions. Treat the answers as inspiration, then make them yours. You do not get one answer, you get options to react to. That is the real value.',
                points: ['Ask for many ideas at once', 'Pick the best two and refine them', 'Treat answers as inspiration, then make them yours'],
                tryIt: { title: 'Brainstorm together', steps: ['Type: "I am organising a school fundraiser for 400 students. Give me 10 ideas to raise money."', 'Pick the two ideas you like best.', 'Ask: "Make idea 3 cheaper and easier to run."'] }
            },
            {
                id: 'm3-l3', kind: 'video', title: 'Job 2: Draft in seconds, finish in your own voice', minutes: 9,
                summary: 'AI writes the first version in seconds. You edit the facts, tone and your own voice. You send only after you have read it. Good for emails, reports and social media posts. Always check: is it clear, and does the tone suit your reader? Never send the first draft.',
                points: ['AI drafts, you edit, you send', 'Check clarity and tone for your reader', 'Add your name, a personal detail, and fix anything untrue'],
                tryIt: { title: 'Draft, then make it yours', steps: ['Type: "Write a polite follow-up email to a client who has not replied to my quote for five days. Keep it short and friendly."', 'Ask: "Make it warmer." Then: "Make it shorter."', 'Edit by hand: add your name, one personal detail, and fix anything untrue.'] }
            },
            {
                id: 'm3-l4', kind: 'video', title: 'Job 3: Summarise long and messy things', minutes: 9,
                summary: 'Turn long and messy into short and clear. Condense a long document into a few bullet points, pull action items out of meeting notes, or turn messy notes into a table with task, owner and due date. If something is missing, tell the AI to write "not stated" so it does not guess.',
                points: ['Long document into a few bullet points', 'Meeting notes into action items', 'Messy notes into a table: task, owner, due date', 'Tell it to write "not stated" when information is missing'],
                tryIt: {
                    title: 'Messy notes into an action table',
                    steps: [
                        'Paste these notes: "Planning call, Friday. Grace will send venue quotes by Monday. We need to confirm 40 guests. Joseph says catering budget is 2 million. Brian to design the invitation, needs it before the 14th. Still not sure if the hall is free on the 20th."',
                        'Ask: "Make a table with three columns: task, owner, due date. If something is missing, write not stated."',
                        'Check the table against the notes.'
                    ]
                }
            },
            {
                id: 'm3-l5', kind: 'video', title: 'Job 4: Automate without writing code', minutes: 8,
                summary: 'AI closes the gap between what you can imagine and what you can build on your own. Ask for a spreadsheet formula in plain words, get step-by-step help when software misbehaves, or automate repetitive clicking and copying. Use it to speed up while you learn the skill, not to avoid learning it. Always test the result on one row with a calculator before you trust it.',
                points: ['Spreadsheet formulas in plain words', 'Step-by-step troubleshooting', 'Small macros for repetitive work', 'Test before you trust'],
                tryIt: { title: 'Ask for a formula, then test it', steps: ['Type: "My monthly sales are in column B, starting at B2. Write a formula in C3 that shows growth compared with last month as a percentage, and explain it in simple words."', 'The answer should look like =(B3-B2)/B2, formatted as a percentage.', 'Test it on one row with a calculator. If last month could be zero, ask for a version that avoids dividing by zero.'] }
            },
            {
                id: 'm3-recap', kind: 'reading', title: 'Key words: Module 3', minutes: 5,
                summary: 'Your co-pilot, starting today: Brainstorm to beat the blank page. Draft faster, always adding your voice. Summarise documents and meetings into clear takeaways. Automate repetitive work without writing code.',
                glossary: [
                    { term: 'Co-pilot', meaning: 'AI that helps while you stay in charge', example: 'AI drafts, you edit and decide' },
                    { term: 'Draft', meaning: 'A first version, not the final one', example: 'An email you will edit' },
                    { term: 'Summarise', meaning: 'Make something long shorter, keeping the main points', example: '"3 key takeaways"' },
                    { term: 'Formula', meaning: 'An instruction a spreadsheet follows to calculate', example: '=(B3-B2)/B2' }
                ]
            },
            {
                id: 'm3-quiz', kind: 'quiz', title: 'Module 3 quiz', minutes: 12,
                questions: [
                    q('m3q1', '"Action points from a long meeting" is which job?', ['Brainstorm', 'Draft', 'Summarise', 'Automate'], 2, 'Pulling out the key points from long material is summarising.'),
                    q('m3q2', '"Names for your new shop" is which job?', ['Brainstorm', 'Draft', 'Summarise', 'Automate'], 0, 'Asking for many ideas to react to is brainstorming.'),
                    q('m3q3', 'AI has drafted an email for a client. What should you do before sending?', ['Send it straight away', 'Read it, fix anything untrue and add your own voice', 'Ask AI to send it for you', 'Delete the greeting'], 1, 'AI drafts, you edit and decide. Never send the first draft unread.'),
                    q('m3q4', 'AI gives you the formula =(B3-B2)/B2. What is the sensible next step?', ['Trust it, because AI never makes mistakes', 'Test it on one row with a calculator', 'Delete column B', 'Ask for a longer formula'], 1, 'Sounding right is not the same as being right. Test it first.'),
                    q('m3q5', 'What is the best way to use AI for spreadsheet formulas?', ['To avoid ever learning spreadsheets', 'To speed up while you learn the skill', 'Only when you are sure it is wrong', 'Never'], 1, 'Use it to go faster while you learn, not to skip learning.')
                ]
            }
        ]
    },
    // ------------------------------------------------------------------ MODULE 4
    {
        id: 'm4', number: 4, title: 'When AI gets it wrong', blurb: 'Hallucinations, real cases, and how to fact-check.',
        items: [
            {
                id: 'm4-l1', kind: 'video', title: 'Why AI sounds sure and is wrong', minutes: 7,
                summary: 'AI can sound completely sure and be completely wrong. It may invent facts, quotes, sources and numbers. This is called a hallucination. Why? It predicts what sounds likely. It does not check what is true. A made-up answer can look more convincing than a true one.',
                points: ['A hallucination is when AI states something false as if it were true', 'It happens because it predicts what sounds likely', 'Invented facts, quotes, sources and numbers can look convincing'],
                tryIt: { title: 'Catch it making things up', steps: ['Ask about something that does not exist: "Tell me about the 1987 book The Golden Boda of Nansana and its main characters."', 'Then ask: "Give me three sources for that."', 'Try to find the sources. Do they exist?'] }
            },
            {
                id: 'm4-l2', kind: 'video', title: 'Real cases: the lawyers and the airline', minutes: 7,
                summary: 'In 2023, two New York lawyers filed court papers citing six cases that ChatGPT had invented. The judge fined them and their firm $5,000 in total, saying that using AI for help is not improper, but lawyers must check what they file. In 2024, Air Canada\'s website chatbot told a customer he could claim a bereavement discount after his trip, but the airline\'s real policy said otherwise. A tribunal held the airline responsible and ordered it to pay him about CA$812. Both mistakes looked believable, and in both cases a person was responsible.',
                points: ['Both mistakes looked believable', 'In both cases a person or company was held responsible', 'Using AI is fine. Checking what you use is your job']
            },
            {
                id: 'm4-l3', kind: 'video', title: 'How to fact-check in three steps', minutes: 8,
                summary: 'Step one: mark the claims that matter, such as names, numbers, dates, quotes, sources and laws. Step two: check them outside the chatbot, on an official website, in a textbook, with a trusted news source, or with an expert. Step three: ask for sources, then open them. If the link does not exist or does not say that, do not use the claim. The riskier the topic, the more you check: health, law, money and safety. You can reduce hallucinations by giving the AI the text to work from, asking it to say when it does not know, and asking for sources, but you cannot remove them.',
                points: ['Mark the claims that matter', 'Check them outside the chatbot', 'Ask for sources, then open them', 'Check more when the topic is health, law, money or safety']
            },
            {
                id: 'm4-recap', kind: 'reading', title: 'Key words: Module 4', minutes: 5,
                glossary: [
                    { term: 'Hallucination', meaning: 'When AI states something false as if it were true', example: 'An invented book or a fake source' },
                    { term: 'Fact-check', meaning: 'Verify a claim with a trusted source outside the chatbot', example: 'Checking a figure on an official website' }
                ],
                points: ['Treat AI like a fast, well-read assistant who sometimes makes things up. Very useful, and always checked.']
            },
            {
                id: 'm4-quiz', kind: 'quiz', title: 'Module 4 quiz', minutes: 12,
                questions: [
                    q('m4q1', 'What is a hallucination?', ['A slow answer', 'When AI states something false as if it were true', 'A picture the AI draws', 'A password error'], 1, 'AI can invent facts, quotes and sources and state them with confidence.'),
                    q('m4q2', 'Why do hallucinations happen?', ['The AI is lying on purpose', 'It predicts what sounds likely and does not check what is true', 'The internet is down', 'You typed too fast'], 1, 'Language models are built to produce what sounds likely, not to verify truth.'),
                    q('m4q3', 'What is the main lesson from the 2023 lawyers case?', ['Lawyers should never use computers', 'Using AI for help is fine, but you must check what you submit', 'Judges dislike technology', 'AI cannot write documents'], 1, 'The judge said using AI for help is not improper, but lawyers must check what they file.'),
                    q('m4q4', 'Which is the right order for fact-checking?', ['Trust it, share it, check later', 'Mark key claims, check outside the chatbot, ask for sources and open them', 'Ask the chatbot if it is sure', 'Delete the chat'], 1, 'Asking the same chatbot whether it is sure is not a check. Verify outside the chatbot.'),
                    q('m4q5', 'Which topic needs the most careful checking?', ['A name for your pet', 'A medicine dose', 'A party playlist', 'A joke'], 1, 'The riskier the topic, the more you check: health, law, money and safety.')
                ]
            }
        ]
    },
    // ------------------------------------------------------------------ MODULE 5
    {
        id: 'm5', number: 5, title: 'Fair and private', blurb: 'How bias gets in, and how to protect your information and other people\'s.',
        items: [
            {
                id: 'm5-l1', kind: 'video', title: 'How bias gets into AI', minutes: 7,
                summary: 'AI learns from human data, so it can inherit human bias. It learns from what people wrote: books, websites, posts and records. Human history is unequal, and old patterns and stereotypes are in the data. So answers can be unfair: sexist, racist, or leaving some people out. AI can also know less about some people, places and languages. A real example: Amazon built an experimental tool to rate job applicants. It learned from ten years of past CVs, most of them from men, and began marking down CVs that mentioned women. Amazon scrapped it (reported by Reuters, 2018). Nobody told it to be unfair. It copied a pattern in the data.',
                points: ['AI learns from what people wrote', 'Human history is unequal, so the data is too', 'Nobody has to tell AI to be unfair. It copies patterns in its data']
            },
            {
                id: 'm5-l2', kind: 'video', title: 'Spot bias and reduce it', minutes: 6,
                summary: 'Read AI answers for assumptions: who is a man or a woman, what names appear, which region or tribe, who is rich. Results vary, sometimes it assumes and sometimes it does not. The skill is looking. Four habits reduce bias: look for who is missing, never let AI decide alone about people (hiring, marks, loans, discipline), say what you want ("use varied names and roles"), and ask people who would be affected.',
                points: ['Look for who is missing or shown as a stereotype', 'Never let AI decide alone about people', 'Say what you want in the prompt', 'Ask the people who would be affected'],
                tryIt: { title: 'Spot the assumption', steps: ['Type: "Write a short story about a nurse, a boda boda rider and a company director."', 'Read it for assumptions. Who is a man or a woman? What names? Which region or tribe? Who is rich?', 'Ask: "Rewrite this without assuming anyone\'s gender, tribe or background."'] }
            },
            {
                id: 'm5-l3', kind: 'video', title: 'Your words may not stay private', minutes: 7,
                summary: 'Public AI tools may use what you type to train their models, and could reveal it later. Never put in confidential work information, passwords, or personal information. No exceptions. Personal information, or PII, is anything that identifies a person: a name with a phone number, an ID number, an address, a photo, medical details, bank or mobile money details.',
                points: ['Public tools may use what you type', 'Never paste passwords, PINs, ID numbers or confidential work information', 'PII is anything that identifies a person']
            },
            {
                id: 'm5-l4', kind: 'video', title: 'Safer habits and three rules', minutes: 6,
                summary: 'Instead of pasting a customer\'s complaint with their name and phone number, describe it: "A customer says their delivery was two days late. Write a polite reply." Instead of pasting your customer list, ask how to analyse a customer list and practise on made-up data. Instead of pasting a full contract, remove names and amounts first, or use a tool your organisation has approved. Three rules for sensitive information: use approved, secure tools; check the settings (a setting is not permission to paste secrets); and if you are not sure, do not paste it. Asking costs a minute. A leak can cost far more.',
                points: ['Describe the problem, not the person', 'Use approved, secure tools for anything sensitive', 'Check the settings, but a setting is not permission to paste secrets', 'Not sure? Do not paste it']
            },
            {
                id: 'm5-recap', kind: 'reading', title: 'Key words: Module 5', minutes: 5,
                glossary: [
                    { term: 'Bias', meaning: 'Unfair patterns in AI answers, copied from the data it learned from', example: 'Stereotyped stories, or a CV tool that favoured men' },
                    { term: 'PII', meaning: 'Personal information that identifies a person', example: 'A name with a phone number, or an ID number' },
                    { term: 'Public AI tool', meaning: 'An AI service anyone can use, which may keep or learn from what you type', example: 'A free chatbot' }
                ]
            },
            {
                id: 'm5-quiz', kind: 'quiz', title: 'Module 5 quiz', minutes: 12,
                questions: [
                    q('m5q1', 'Why can AI show bias?', ['Its programmers choose to be unfair', 'It learns from human-written data that contains old patterns and stereotypes', 'It is too slow', 'It copies one person'], 1, 'AI inherits patterns from the data it learned from.'),
                    q('m5q2', 'What does the Amazon hiring tool example teach us?', ['Nobody told it to be unfair, it copied a pattern in the data', 'Computers should never be used in hiring', 'Women should not apply for jobs', 'AI always improves over time'], 0, 'The tool copied a pattern from ten years of mostly male CVs.'),
                    q('m5q3', 'Which habit reduces bias?', ['Let AI decide alone about hiring and marks', 'Never let AI decide alone about people, and look for who is missing', 'Hide the prompt', 'Use shorter prompts'], 1, 'A person reviews decisions about people. Look for who is missing or stereotyped.'),
                    q('m5q4', 'What is PII?', ['A type of spreadsheet', 'Personal information that identifies a person', 'A public AI tool', 'A password manager'], 1, 'Personal information such as a name with a phone number, an ID number or an address.'),
                    q('m5q5', 'What is the safest way to get help replying to a customer complaint?', ['Paste the complaint with the customer\'s name and phone number', 'Describe the problem without personal details', 'Paste the whole customer list', 'Do not reply'], 1, 'Describe the problem, not the person.'),
                    q('m5q6', 'What may a public AI tool do with what you type?', ['Delete it immediately', 'Use it to train its models and possibly reveal it later', 'Send it only to you', 'Nothing at all'], 1, 'Public tools may use what you type, so keep private information out.')
                ]
            }
        ]
    },
    // ------------------------------------------------------------------ MODULE 6
    {
        id: 'm6', number: 6, title: 'Using AI responsibly', blurb: 'A simple guide for deciding what is safe, and your plan from here.',
        items: [
            {
                id: 'm6-l1', kind: 'video', title: 'Green, amber, red', minutes: 8,
                summary: 'A simple guide. Green is low risk, go: brainstorm names and ideas, draft a thank-you note, explain a concept simply, summarise a public article. Amber means check carefully: facts, numbers and quotes; health, legal and money information; anything that goes out under your name. Red means stop: pasting personal or confidential information into a public tool, letting AI alone decide about people, and submitting AI work you cannot explain or that your school or employer does not allow. Four questions to ask of any AI tool: does it do good for people, is it built and tested for safety, is it fair, and is someone accountable?',
                points: ['Green: low risk, go', 'Amber: check carefully', 'Red: stop', 'Ask: good for people? safe? fair? accountable?']
            },
            {
                id: 'm6-l2', kind: 'video', title: 'Stay the human in the loop, and your 30-day plan', minutes: 7,
                summary: 'AI is powerful. It has no human judgment, empathy or common sense. A person reviews and decides before anything affects real people. You verify the facts. You protect privacy. You make the decision. The three-lesson series in one line: use it, check it, protect people. Your next step is a 30-day plan: pick one task a week, use AI on it, run the three checks (is it true, is it right for my reader, is it safe to share), and note the time you saved. Teach one person one idea from this course.',
                points: ['Use it: AI is a powerful co-pilot for real tasks', 'Check it: verify facts and look for bias', 'Protect people: keep private and confidential information out', 'Practise on one real task a week']
            },
            {
                id: 'm6-recap', kind: 'reading', title: 'Key words and your plan', minutes: 10,
                summary: 'Your 30-day plan: Week 1 pick one weekly task (an email, minutes or a spreadsheet) and try this course\'s prompts. Week 2 add a second task and note the time you saved. Week 3 teach one person one idea. Week 4 review your wins and misses, and choose your next step.',
                glossary: [
                    { term: 'Human in the loop', meaning: 'A person reviews and decides before AI output affects people', example: 'You edit the draft before you send it' },
                    { term: 'Responsible AI', meaning: 'AI that is good for people, safe, fair and accountable', example: 'Asking the four questions of any tool' }
                ]
            },
            {
                id: 'm6-quiz', kind: 'quiz', title: 'Module 6 quiz', minutes: 15,
                questions: [
                    q('m6q1', 'Pasting a customer\'s ID details into a public chatbot is...', ['Green', 'Amber', 'Red', 'Fine if you delete it later'], 2, 'Personal information never goes into a public tool.'),
                    q('m6q2', 'Following an AI\'s medicine dose for a child without checking is...', ['Green', 'Amber', 'Red', 'Safe if the answer is detailed'], 2, 'Health matters. Ask a doctor or pharmacist.'),
                    q('m6q3', 'Asking AI which documents you need to register a business is...', ['Green', 'Amber: a useful start, check the official source', 'Red', 'Not allowed'], 1, 'A useful start, but check the official source.'),
                    q('m6q4', 'What does "human in the loop" mean?', ['A person reviews and decides before AI output affects people', 'A person types every word', 'AI works without supervision', 'A person is replaced by AI'], 0, 'You verify the facts, protect privacy and make the decision.'),
                    q('m6q5', 'Which is NOT one of the four questions to ask of an AI tool?', ['Does it do good for people?', 'Is it built and tested for safety?', 'Is it the cheapest?', 'Is someone accountable?'], 2, 'The four questions are about benefit, safety, fairness and accountability.')
                ]
            }
        ]
    }
];

// The final assessment questions and answers live ONLY on the server (see the learn_final_questions table
// and the get_final_exam / submit_final_exam functions), so they are not shipped to the browser.

// -------------------------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------------------------
export const ALL_ITEMS: CourseItem[] = MODULES.flatMap(m => m.items);
export const REQUIRED_ITEM_IDS: string[] = [...ALL_ITEMS.map(i => i.id), 'final'];

export const moduleOfItem = (itemId: string): CourseModuleDef | undefined =>
    MODULES.find(m => m.items.some(i => i.id === itemId));

export const findItem = (itemId: string): CourseItem | undefined => ALL_ITEMS.find(i => i.id === itemId);

export const nextItemId = (itemId: string): string | null => {
    const idx = ALL_ITEMS.findIndex(i => i.id === itemId);
    return idx >= 0 && idx < ALL_ITEMS.length - 1 ? ALL_ITEMS[idx + 1].id : null;
};

export const prevItemId = (itemId: string): string | null => {
    const idx = ALL_ITEMS.findIndex(i => i.id === itemId);
    return idx > 0 ? ALL_ITEMS[idx - 1].id : null;
};

export const lessonCount = ALL_ITEMS.filter(i => i.kind === 'video').length;

/** Shuffle a question's options (keeping track of which is correct). */
export function shuffleOptions(question: QuizQuestion, seed: number): QuizQuestion {
    const idxs = question.options.map((_, i) => i);
    let s = seed || 1;
    const rand = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    for (let i = idxs.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return { ...question, options: idxs.map(i => question.options[i]), correct: idxs.indexOf(question.correct) };
}
