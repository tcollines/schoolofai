// Live class 1 (Monday, 2:00 pm EAT): Welcome + Module 1 (What AI really is) + Module 2 (How to talk to AI).
const E = (s) => `<div class="eyebrow">${s}</div>`;
const list = (items, hlLast = false) => `<div class="list">${items.map((t, i) => `<div class="item${hlLast && i === items.length - 1 ? ' hl' : ''}"><span class="n">${i + 1}</span><span>${t}</span></div>`).join('')}</div>`;
const plain = (items) => `<div class="list">${items.map(t => `<div class="item"><span>${t}</span></div>`).join('')}</div>`;
const slide = (eyebrow, title, body, note = '') => `${E(eyebrow)}<h2>${title}</h2>${body}${note ? `<p class="note">${note}</p>` : ''}`;
const prompt = (label, text) => `<div class="prompt"><div class="t">${label}</div><div class="q">${text}</div></div>`;
const ask = (t) => `<p class="note"><span class="tag" style="background:#fde68a;color:#78350f">Ask the class</span>${t}</p>`;
const demo = (t) => `<p class="note"><span class="tag" style="background:#dbeafe;color:#1e40af">Live demo</span>${t}</p>`;
const say = (t) => `<p class="note"><span class="tag" style="background:#dcfce7;color:#166534">Activity</span>${t}</p>`;

const slides = [];

// 1 title
slides.push(`<div class="center">${E('Live class 1 of 3 · Monday')}<h1>AI Fundamentals:<br><span class="violet">Use AI with Confidence</span></h1><p class="lead" style="margin-top:44px">Welcome, and Modules 1 and 2</p><p class="sub" style="margin-top:14px">What AI really is · How to talk to AI</p></div>`);

// 2 welcome
slides.push(slide('Welcome', 'Welcome to the class', `<p class="lead">Good afternoon, and welcome to <b>Welile School of AI</b>.</p><div style="height:26px"></div>` + plain([
    'This is a <b>free</b> course. It is for anyone who wants to use AI with confidence. You do not need to know any technology.',
    'By the end you will be able to <b>ask AI clearly</b>, <b>put it to work</b>, <b>check what it says</b>, and use it <b>fairly and safely</b>.',
    'Please keep a <b>chatbot open on your phone or laptop</b>. We will use it together today.'])));

// 3 three classes
slides.push(slide('How the live classes work', 'Three classes a week, two modules each', `<table><tr><th>Class</th><th>When</th><th>Modules</th></tr>
<tr><td><b>Lecture 1</b> · today</td><td>Monday, 2:00 pm EAT</td><td><b>1 and 2</b>: What AI really is · How to talk to AI</td></tr>
<tr><td><b>Lecture 2</b></td><td>Wednesday, 2:00 pm EAT</td><td><b>3 and 4</b>: Make AI work for you · When AI gets it wrong</td></tr>
<tr><td><b>Lecture 3</b></td><td>Friday, 2:00 pm EAT</td><td><b>5 and 6</b>: Fair and private · Using AI responsibly</td></tr></table>`, 'Six modules, three classes, two modules each. Come to all three and you have seen the whole course.'));

// 4 certificate
slides.push(slide('Your certificate', 'How the certificate works', list([
    'Every module has a short <b>quiz</b>. You need <b>70%</b> to pass, and you can retake it as often as you like.',
    'When every lesson and quiz is done, take the <b>final assessment</b>: 20 questions, <b>80%</b> to pass, 3 tries in 24 hours.',
    'Your <b>certificate</b> has a unique ID. Anyone can verify it online.',
    '<b>Attend a live class and the lessons it covers count as done.</b> For those modules, you only take the quizzes.'], true)));

// 5 install + tools
slides.push(slide('Before we start', 'Three quick things', plain([
    '<b>Lessons open one at a time.</b> You can see the whole lineup, and each lesson opens when you finish the one before it.',
    '<b>Install the course as an app.</b> On Android, tap <b>Install app</b> at the top of the course. On iPhone: Safari, Share, Add to Home Screen.',
    '<b>Ask questions any time.</b> Use the Q&amp;A tab under every lesson, or ask me right here.'])));

// ---------------- MODULE 1
slides.push(`<div class="center">${E('Module 1')}<h1>What AI<br><span class="violet">really is</span></h1><p class="lead" style="margin-top:40px">AI, machine learning, deep learning and generative AI, in plain language.</p></div>`);

slides.push(slide('Lesson 1', 'You already use AI', `<p class="lead">You have been using AI for years without calling it that.</p><div style="height:20px"></div><div>${['Your phone suggests the <b>next word</b>', 'YouTube or TikTok shows videos <b>you like</b>', 'Your phone unlocks with <b>your face</b>', 'Google Maps guesses your <b>arrival time</b>', 'Spam goes into its <b>own folder</b>'].map(t => `<span class="pill" style="font-size:38px">${t}</span>`).join('')}</div><p class="lead" style="margin-top:28px">All of that is AI.</p>`));

slides.push(slide('Discussion', 'Where did AI show up for you today?', `<p class="lead">Think about this morning.</p><div style="height:20px"></div>` + plain(['A <b>suggestion</b> on your phone?', 'A <b>recommendation</b> on a video app?', 'A <b>map</b> or a <b>message filter</b>?']), ''));
slides[slides.length - 1] = slides[slides.length - 1].replace('</div></div>', '</div></div>') + ask('Give me one place AI showed up for you today. Then say: did it sort something, predict something, or create something?');

slides.push(slide('Lesson 2', 'What AI is', `<div class="prompt"><div class="t">DEFINITION</div><div class="q"><b>AI</b> is a computer doing a job that normally needs <b>human thinking</b>: understanding speech, making decisions, translating languages.</div></div><div style="height:30px"></div><div class="grid3"><div class="card"><b>Google Maps</b><br>picks the fastest route</div><div class="card"><b>Google Translate</b><br>turns Luganda into English</div><div class="card"><b>Your bank app</b><br>flags a strange payment</div></div>`));

slides.push(slide('Lesson 2', 'Three common mistakes about AI', list([
    '<b>AI is not a robot.</b> Most AI is software on your phone or in a data centre.',
    '<b>AI is not new.</b> The name dates from the 1950s. What is new is one special kind: <b>generative AI</b>.',
    '<b>AI is not a person thinking.</b> It finds patterns in data. The results can look like thinking, but it is not a human mind.'])));

slides.push(slide('Lesson 3 · Machine learning', 'The old way: write the rules', `<div class="grid2"><div class="card"><h3>The old way</h3><p>A person writes every rule.</p><p style="margin-top:14px">&ldquo;If a message says <b>You have won</b>, it is spam.&rdquo;</p><p style="margin-top:14px" class="red">Then scammers write &ldquo;Congratulations, you are selected&rdquo; and the rule fails.</p></div><div class="card"><h3>The problem</h3><p>You would need <b>a million rules</b>, and you would still miss things.</p></div></div>`));

slides.push(slide('Lesson 3 · Machine learning', 'The machine learning way: learn from examples', `<div class="prompt"><div class="t">THE IDEA</div><div class="q">Show the computer <b>10,000 messages</b>, each marked <b>spam</b> or <b>not spam</b>, and let it find the pattern.</div></div><div style="height:30px"></div><div class="grid2"><div class="card"><h3>Think of a child</h3>Learning what a <b>mango</b> is. You never give a list of rules. You <b>show examples</b>.</div><div class="card"><h3>More examples</h3>usually means <b>better results</b>.</div></div>`));

slides.push(slide('Activity', 'Teach it with examples', `<p class="lead">Think of something you could sort into <b>two groups</b>, such as ripe and unripe fruit.</p><div style="height:20px"></div>` + plain(['Describe <b>five examples</b> of each group.', 'That is exactly what a machine learning system would be shown.'])) + ask('Share one pair of groups you chose, and one example from each.'));

// circles
slides.push(`${E('Lesson 4 · Deep learning')}<h2>Circles inside circles</h2><div style="display:flex;gap:70px;align-items:center"><div class="ring" style="transform:scale(.78);transform-origin:left top;width:640px;height:640px">
<div style="width:640px;height:640px;background:#ede9fe;border:4px solid #a78bfa;padding-top:26px;font-size:34px;color:#4c1d95">AI</div>
<div style="width:500px;height:500px;background:#ddd6fe;border:4px solid #8b5cf6;padding-top:26px;font-size:34px;color:#4c1d95">Machine learning</div>
<div style="width:360px;height:360px;background:#c4b5fd;border:4px solid #7c3aed;padding-top:26px;font-size:34px;color:#4c1d95">Deep learning</div>
<div style="width:210px;height:210px;background:#6d28d9;border:4px solid #4c1d95;padding-top:70px;font-size:32px;color:#fff;line-height:1.1">Generative<br>AI</div></div>
<div style="flex:1;margin-top:-90px"><p class="lead">Every taxi is a car. Every car is a vehicle. But not every vehicle is a car.</p><p class="sub" style="margin-top:26px">Generative AI is built on <b>deep learning</b>. Deep learning is a kind of <b>machine learning</b>. Machine learning is a kind of <b>AI</b>.</p></div></div>`);

slides.push(slide('Lesson 4 · Deep learning', 'How deep learning sees a face', `<div class="grid2" style="grid-template-columns:repeat(4,1fr)"><div class="card"><h3>Layer 1</h3>sees <b>edges and lines</b></div><div class="card"><h3>Layer 2</h3>sees <b>shapes</b></div><div class="card"><h3>Layer 3</h3>&ldquo;that looks like an <b>eye</b>&rdquo;</div><div class="card"><h3>Layer 4</h3>&ldquo;that is a <b>face</b>&rdquo;</div></div><p class="note">It is inspired by how brain cells connect, but it is <b>maths, not a brain</b>. It is strong with messy data: photos, voices, video. Face unlock and voice assistants use it.</p>`));

slides.push(slide('Lesson 5 · Generative AI', 'Recognise, or create', `<div class="grid2"><div class="card"><div class="pill blue">Traditional AI</div><h3 style="margin-top:12px">Recognises</h3><p>Spam or not spam. A face or not a face. Fraud or not fraud. It <b>sorts, scores and predicts</b>.</p></div><div class="card"><div class="pill">Generative AI</div><h3 style="margin-top:12px">Creates</h3><p>Writes text, makes pictures, writes code, composes music. It does not look up an answer and paste it. It <b>generates</b> it from patterns it learned.</p></div></div>`));

slides.push(slide('Lesson 5 · Large language models', 'A large language model predicts the next word', `<div class="prompt"><div class="t">LLM</div><div class="q">A <b>large language model</b> learned from a massive amount of text. It is the engine behind <b>ChatGPT, Gemini and Claude</b>.</div></div><div style="height:30px"></div><p class="lead">It predicts the next word, then the next, then the next.</p>`) + say('Open any chat on your phone and type <b>Good</b>. Tap the middle suggestion. Again. And again. Your phone is guessing the next word. A language model does the same, on a much bigger scale.'));

slides.push(`<div class="center">${E('Remember this')}<h1><span class="red">Sounding right</span> is not the same as <span class="green">being right.</span></h1><p class="lead" style="margin-top:40px">A language model can be wrong, and completely sure. So you stay in charge, and you check.</p></div>`);

slides.push(slide('Live demo', 'Ask the same thing twice', prompt('TYPE THIS IN YOUR CHATBOT', 'Write a short, polite message to my landlord asking for two more days to pay rent.') + `<p class="note">Now ask the <b>exact same thing again</b>. Compare the two answers. What stayed the same? What changed?</p>`) + ask('Read us one line from your answer. Is it the same as your neighbour&rsquo;s?'));

slides.push(slide('Module 1 · Key words', 'The lesson on one page', `<table><tr><th>Word</th><th>Meaning</th><th>Example</th></tr>
<tr><td><b>AI</b></td><td>A computer doing something that normally needs a human brain</td><td>Google Maps picking your route</td></tr>
<tr><td><b>Machine learning</b></td><td>AI that learns from examples instead of written rules</td><td>A spam filter trained on marked messages</td></tr>
<tr><td><b>Deep learning</b></td><td>Machine learning in layers, good with photos and voices</td><td>Face unlock</td></tr>
<tr><td><b>Generative AI</b></td><td>AI that creates new content</td><td>A chatbot drafting a message</td></tr>
<tr><td><b>Large language model</b></td><td>Generative AI trained on huge amounts of text to predict the next word</td><td>ChatGPT, Gemini, Claude</td></tr></table>`));

// ---------------- MODULE 2
slides.push(`<div class="center">${E('Module 2')}<h1>How to<br><span class="violet">talk to AI</span></h1><p class="lead" style="margin-top:40px">Prompting: ask clearly, improve answers, and work from your own text.</p></div>`);

slides.push(slide('Lesson 1', 'Pick a tool and get set up', list([
    'Any major chatbot can do the jobs in this course. <b>Pick one</b> and learn it well.',
    'Free versions exist, with limits. <b>Free tools may use what you type</b>, so keep private information out.',
    'Find the <b>settings</b> that control how your chats are used.',
    'Quality in Luganda is uneven. Have a <b>fluent speaker check</b> important text.'])));

slides.push(slide('Live demo', 'Set up your tool', list(['Open your chosen chatbot and <b>sign in</b>.', 'Find the <b>settings page</b> and read how your chats are used.']) + `<div style="height:24px"></div>` + prompt('TYPE THIS', 'Introduce yourself in two sentences.') + `<p class="note">Notice how it answers.</p>`));

slides.push(slide('Lesson 2', 'A weak request, and a strong one', `<div class="grid2"><div class="card" style="border-color:#dc2626;background:#fef2f2"><div class="pill red">Weak</div><p style="font-size:56px;margin-top:20px">&ldquo;Write an email.&rdquo;</p><p class="red" style="margin-top:20px">The AI has to guess everything.</p></div><div class="card" style="border-color:#16a34a;background:#f0fdf4"><div class="pill green">Strong</div><p style="margin-top:18px;font-size:34px;line-height:1.45">&ldquo;I run a small bakery in Entebbe. Write a short, friendly email to a customer confirming their cake order for Saturday, UGX 120,000, pickup at 10am. Keep it under 100 words.&rdquo;</p></div></div>`));

slides.push(slide('Lesson 2', 'Context, task, format', `<div class="grid3"><div class="card" style="border-color:#6d28d9;background:#f5f3ff"><h3 style="color:#5b21b6">Context</h3><b>Who you are</b> and the situation.</div><div class="card" style="border-color:#2563eb;background:#eff6ff"><h3 style="color:#1e40af">Task</h3><b>What you want</b> it to do.</div><div class="card" style="border-color:#d97706;background:#fffbeb"><h3 style="color:#92400e">Format</h3><b>How you want it</b>: length, tone, shape.</div></div><p class="note">More useful detail in, more useful answer out.</p>`));

slides.push(slide('Lesson 2', 'See the three parts in the bakery request', `<div class="prompt"><div class="q" style="line-height:1.7"><span style="background:#ede9fe;color:#5b21b6;border-radius:10px;padding:2px 10px">I run a small bakery in Entebbe.</span> <span style="background:#dbeafe;color:#1e40af;border-radius:10px;padding:2px 10px">Write a short, friendly email to a customer confirming their cake order for Saturday, UGX 120,000, pickup at 10am.</span> <span style="background:#fef3c7;color:#92400e;border-radius:10px;padding:2px 10px">Keep it under 100 words.</span></div></div><p class="note"><span class="pill">Context</span><span class="pill blue">Task</span><span class="pill amber">Format</span></p>`));

slides.push(slide('Activity', 'Upgrade a weak prompt', list(['Start with: <b>&ldquo;Write an email.&rdquo;</b>', 'Rewrite it with <b>your real situation</b>, a clear task and a format.', 'Send both, and <b>compare</b> the answers.']) + ask('Read us your upgraded prompt. Can we spot the context, the task and the format?')));

slides.push(slide('Lesson 3', 'Not quite right? Refine, do not restart', `<p class="lead">Starting over throws away what was already good. <b>Give a follow-up instruction instead.</b></p><div style="height:24px"></div><div>${['Make it shorter.', 'Make it warmer.', 'Explain that in simpler words.', 'Use a more formal tone.', 'Give me three versions.', 'Add an example.'].map(t => `<span class="pill" style="font-size:40px;padding:14px 34px">&ldquo;${t}&rdquo;</span>`).join('')}</div>`));

slides.push(slide('Live demo', 'Three refinements', list(['Ask for a <b>short thank-you message</b> to a customer.', 'Ask it to make it <b>warmer</b>, then <b>shorter</b>, then to give you <b>three versions</b>.', '<b>Pick your favourite</b> and edit it by hand.'])));

slides.push(slide('Lesson 4', 'Give it your own text to work from', list([
    'AI does much better when you give it the <b>material to work from</b>.',
    'Paste in a <b>draft, notes or a description</b>, and say what to do with it.',
    'Ask it to <b>say when it does not know</b>.',
    'Remove <b>names, numbers and private details</b> first.'])));

slides.push(slide('Lesson 4', 'Be careful what you paste', `<p class="lead"><b>Nothing private, confidential or personal</b> goes into a public tool.</p><div style="height:20px"></div><div>${['Passwords and PINs, including mobile money', 'National ID and passport numbers', 'Bank account details', 'Other people&rsquo;s private details', 'Confidential work information'].map(t => `<span class="pill red" style="font-size:36px;padding:12px 30px">${t}</span>`).join('')}</div><p class="lead" style="margin-top:34px">Describe the problem, <b class="violet">not the person.</b></p>`));

slides.push(slide('Activity', 'Work from your own draft', list(['Write <b>three rough sentences</b> about your day. No names or private details.', 'Paste them and ask: <b>&ldquo;Improve this for a friendly newsletter, keeping the meaning.&rdquo;</b>', '<b>Compare.</b> What did it keep? What did it add?'])) + ask('Did it add anything you never said? Remember: read the answer against your original.'));

slides.push(slide('Module 2 · Key words', 'The lesson on one page', `<table><tr><th>Word</th><th>Meaning</th><th>Example</th></tr>
<tr><td><b>Prompt</b></td><td>The instruction you give an AI</td><td>&ldquo;Write a polite follow-up email...&rdquo;</td></tr>
<tr><td><b>Context</b></td><td>Who you are and the situation</td><td>&ldquo;I run a small bakery in Entebbe.&rdquo;</td></tr>
<tr><td><b>Format</b></td><td>How you want the answer shaped</td><td>&ldquo;Under 100 words, friendly tone.&rdquo;</td></tr>
<tr><td><b>Refine</b></td><td>Improve an answer with follow-up instructions</td><td>&ldquo;Make it shorter.&rdquo;</td></tr></table>`));

slides.push(slide('Today in one minute', 'What we covered', `<div class="grid2"><div class="card"><h3>Module 1</h3><p>AI is software doing jobs that need human thinking. Machine learning learns from <b>examples</b>. Generative AI <b>creates</b>. A language model <b>predicts the next word</b>, so <b class="red">sounding right is not being right</b>.</p></div><div class="card"><h3>Module 2</h3><p>Pick one tool. Ask with <b>context, task and format</b>. <b>Refine</b>, do not restart. Give it <b>your own text</b>, and keep private details out.</p></div></div>`));

slides.push(slide('Your next steps', 'What to do after today', list([
    'Take the <b>Module 1 quiz</b> and the <b>Module 2 quiz</b> in the course. Because you came to class, the lessons are already counted.',
    'Try the <b>hands-on tasks</b> from today with your own real example.',
    '<b>Install the app</b> so the course is one tap away.',
    'Join <b>Lecture 2 on Wednesday at 2:00 pm</b>: Modules 3 and 4, <b>Make AI work for you</b> and <b>When AI gets it wrong</b>.'], true)));

slides.push(`<div class="center">${E('Questions')}<h1>Questions?</h1><p class="lead" style="margin-top:40px">Ask now, or in the Q&amp;A tab under any lesson.</p><p class="sub" style="margin-top:24px">Tell your friends and family: the course is <b>free</b> for everyone who registers.</p></div>`);

slides.push(`<div class="center" style="text-align:center">${E('Thank you')}<h1>Thank you for<br><span class="violet">learning with us</span></h1><p class="lead" style="margin-top:44px">See you on Wednesday at 2:00 pm.</p><p class="sub" style="margin-top:20px">Use it. Check it. Protect people.</p></div>`);

export default { file: 'Live-class-1-Welcome-Modules-1-and-2', title: 'Live class 1 · Welcome, Modules 1 and 2', short: 'AI Fundamentals', part: 'Live class 1 of 3 · Monday', slides };
