// Live class 1 (Monday, 2:00 pm EAT): Welcome + Module 1 (What AI really is) + Module 2 (How to talk to AI). 25 slides.
import { E, list, plain, slide, prompt, ask, demo, act, pills, center, keywords, table } from './helpers.mjs';
const S = [];

S.push(center('Live class 1 of 3 · Monday', 'AI Fundamentals:<br><span class="violet">Use AI with Confidence</span>', 'Welcome, and Modules 1 and 2', 'What AI really is · How to talk to AI'));

S.push(slide('Welcome', 'Welcome to the class', `<p class="lead">Good afternoon, and welcome to <b>Welile School of AI</b>.</p><div style="height:26px"></div>` + plain([
    'This is a <b>free</b> course for anyone who wants to use AI with confidence. You do not need to know any technology.',
    'By the end you will <b>ask AI clearly</b>, <b>put it to work</b>, <b>check what it says</b>, and use it <b>fairly and safely</b>.',
    'Please keep a <b>chatbot open on your phone or laptop</b>. We will use it together.'])));

S.push(slide('How the live classes work', 'Three classes a week, two modules each', table(['Class', 'When', 'Modules'], [
    ['<b>Class 1</b> · today', 'Monday, 2:00 pm EAT', '<b>1 and 2</b>: What AI really is · How to talk to AI'],
    ['<b>Class 2</b>', 'Wednesday, 2:00 pm EAT', '<b>3 and 4</b>: Make AI work for you · When AI gets it wrong'],
    ['<b>Class 3</b>', 'Friday, 2:00 pm EAT', '<b>5 and 6</b>: Fair and private · Using AI responsibly']]), 'Six modules, three classes. Come to all three and you have seen the whole course.'));

S.push(slide('Your certificate', 'How the course and certificate work', list([
    'Every module has a short <b>quiz</b>: <b>70%</b> to pass, retake as often as you like. The <b>final assessment</b> has 20 questions: <b>80%</b> to pass, 3 tries in 24 hours.',
    'Your <b>certificate</b> has a unique ID that anyone can verify online.',
    'Lessons open <b>one at a time</b>. Install the course as an app: tap <b>Install app</b> (iPhone: Share, then Add to Home Screen).',
    '<b>Attend a live class and the lessons it covers count as done.</b> For those modules, you only take the quizzes.'], true)));

// ---- Module 1
S.push(slide('Module 1 · What AI really is · Lesson 1', 'You already use AI', `<p class="lead">You have been using AI for years without calling it that.</p><div style="height:20px"></div><div>${pills(['Your phone suggests the <b>next word</b>', 'YouTube or TikTok shows videos <b>you like</b>', 'Your phone unlocks with <b>your face</b>', 'Google Maps guesses your <b>arrival time</b>', 'Spam goes into its <b>own folder</b>'], '', 38)}</div><p class="lead" style="margin-top:28px">All of that is AI.</p>` + ask('Give me one place AI showed up for you today. Did it sort something, predict something, or create something?')));

S.push(slide('Module 1 · Lesson 2', 'What AI is', `<div class="prompt"><div class="t">DEFINITION</div><div class="q"><b>AI</b> is a computer doing a job that normally needs <b>human thinking</b>: understanding speech, making decisions, translating languages.</div></div><div style="height:30px"></div><div class="grid3"><div class="card"><b>Google Maps</b><br>picks the fastest route</div><div class="card"><b>Google Translate</b><br>turns Luganda into English</div><div class="card"><b>Your bank app</b><br>flags a strange payment</div></div>`));

S.push(slide('Module 1 · Lesson 2', 'Three common mistakes about AI', list([
    '<b>AI is not a robot.</b> Most AI is software on your phone or in a data centre.',
    '<b>AI is not new.</b> The name dates from the 1950s. What is new is one special kind: <b>generative AI</b>.',
    '<b>AI is not a person thinking.</b> It finds patterns in data. The results can look like thinking, but it is not a human mind.'])));

S.push(slide('Module 1 · Lesson 3 · Machine learning', 'From writing rules to learning from examples', `<div class="grid2"><div class="card" style="border-color:#dc2626;background:#fef2f2"><h3>The old way</h3><p>A person writes every rule: &ldquo;If a message says <b>You have won</b>, it is spam.&rdquo;</p><p style="margin-top:14px" class="red">Scammers write &ldquo;Congratulations, you are selected&rdquo; and the rule fails. You would need a million rules.</p></div><div class="card" style="border-color:#16a34a;background:#f0fdf4"><h3>The new way</h3><p>Show the computer <b>10,000 messages</b>, each marked <b>spam</b> or <b>not spam</b>, and let it find the pattern.</p><p style="margin-top:14px" class="green">More examples usually means better results.</p></div></div>`));

S.push(slide('Module 1 · Lesson 3', 'Think of a child learning what a mango is', `<p class="lead">You never give the child a list of rules. You <b>show examples</b>.</p><div style="height:24px"></div>` + plain(['Think of something you could sort into <b>two groups</b>, such as ripe and unripe fruit.', 'Describe <b>five examples</b> of each group. That is exactly what a machine learning system would be shown.']) + act('Share one pair of groups you chose, and one example from each.')));

S.push(`${E('Module 1 · Lesson 4 · Deep learning')}<h2>Circles inside circles</h2><div style="display:flex;gap:70px;align-items:center"><div class="ring" style="transform:scale(.9);transform-origin:left top;width:640px;height:640px">
<div style="width:640px;height:640px;background:#ede9fe;border:4px solid #a78bfa;padding-top:26px;font-size:34px;color:#4c1d95">AI</div>
<div style="width:500px;height:500px;background:#ddd6fe;border:4px solid #8b5cf6;padding-top:26px;font-size:34px;color:#4c1d95">Machine learning</div>
<div style="width:360px;height:360px;background:#c4b5fd;border:4px solid #7c3aed;padding-top:26px;font-size:34px;color:#4c1d95">Deep learning</div>
<div style="width:210px;height:210px;background:#6d28d9;border:4px solid #4c1d95;padding-top:70px;font-size:32px;color:#fff;line-height:1.1">Generative<br>AI</div></div>
<div style="flex:1;margin-top:-30px"><p class="lead">Every taxi is a car. Every car is a vehicle. But not every vehicle is a car.</p><p class="sub" style="margin-top:26px">Generative AI is built on <b>deep learning</b>. Deep learning is a kind of <b>machine learning</b>. Machine learning is a kind of <b>AI</b>.</p></div></div>`);

S.push(slide('Module 1 · Lesson 4', 'How deep learning sees a face', `<div class="grid2" style="grid-template-columns:repeat(4,1fr)"><div class="card"><h3>Layer 1</h3>sees <b>edges and lines</b></div><div class="card"><h3>Layer 2</h3>sees <b>shapes</b></div><div class="card"><h3>Layer 3</h3>&ldquo;that looks like an <b>eye</b>&rdquo;</div><div class="card"><h3>Layer 4</h3>&ldquo;that is a <b>face</b>&rdquo;</div></div><p class="note">It is inspired by how brain cells connect, but it is <b>maths, not a brain</b>. It is strong with messy data: photos, voices, video. Face unlock and voice assistants use it.</p>`));

S.push(slide('Module 1 · Lesson 5 · Generative AI', 'Recognise, or create', `<div class="grid2"><div class="card"><div class="pill blue">Traditional AI</div><h3 style="margin-top:12px">Recognises</h3><p>Spam or not spam. A face or not a face. Fraud or not fraud. It <b>sorts, scores and predicts</b>.</p></div><div class="card"><div class="pill">Generative AI</div><h3 style="margin-top:12px">Creates</h3><p>Writes text, makes pictures, writes code, composes music. It does not look up an answer and paste it. It <b>generates</b> it from patterns it learned.</p></div></div>`));

S.push(slide('Module 1 · Lesson 5 · Large language models', 'A language model predicts the next word', `<div class="prompt"><div class="t">LLM</div><div class="q">A <b>large language model</b> learned from a massive amount of text. It is the engine behind <b>ChatGPT, Gemini and Claude</b>. It predicts the next word, then the next, then the next.</div></div>` + act('Open any chat on your phone and type <b>Good</b>. Tap the middle suggestion. Again. And again. Your phone is guessing the next word. A language model does the same, on a much bigger scale.')));

S.push(center('Remember this', '<span class="red">Sounding right</span> is not the same as <span class="green">being right.</span>', 'A language model can be wrong, and completely sure. So you stay in charge, and you check.'));

S.push(slide('Live demo', 'Ask the same thing twice', prompt('TYPE THIS IN YOUR CHATBOT', 'Write a short, polite message to my landlord asking for two more days to pay rent.') + `<p class="note">Now ask the <b>exact same thing again</b>. Compare the two answers. What stayed the same? What changed?</p>` + ask('Read us one line from your answer. Is it the same as your neighbour&rsquo;s?')));

S.push('<!--compact-->' + slide('Module 1 · Key words', 'The lesson on one page', keywords([
    ['AI', 'A computer doing something that normally needs a human brain', 'Google Maps picking your route'],
    ['Machine learning', 'AI that learns from examples instead of written rules', 'A spam filter trained on marked messages'],
    ['Deep learning', 'Machine learning in layers, good with photos and voices', 'Face unlock'],
    ['Generative AI', 'AI that creates new content', 'A chatbot drafting a message'],
    ['Large language model', 'Generative AI trained on huge amounts of text to predict the next word', 'ChatGPT, Gemini, Claude']])));

// ---- Module 2
S.push('<!--compact-->' + slide('Module 2 · How to talk to AI · Lesson 1', 'Pick a tool and get set up', list([
    'Any major chatbot can do the jobs in this course. <b>Pick one</b> and learn it well.',
    'Free tools <b>may use what you type</b>, so keep private information out. Find the <b>settings</b> that control how your chats are used.',
    'Quality in Luganda is uneven. Have a <b>fluent speaker check</b> important text.']) + demo('Sign in, find the settings page, then type: <b>&ldquo;Introduce yourself in two sentences.&rdquo;</b> Notice how it answers.')));

S.push(slide('Module 2 · Lesson 2', 'A weak request, and a strong one', `<div class="grid2"><div class="card" style="border-color:#dc2626;background:#fef2f2"><div class="pill red">Weak</div><p style="font-size:56px;margin-top:20px">&ldquo;Write an email.&rdquo;</p><p class="red" style="margin-top:20px">The AI has to guess everything.</p></div><div class="card" style="border-color:#16a34a;background:#f0fdf4"><div class="pill green">Strong</div><p style="margin-top:18px;font-size:34px;line-height:1.45">&ldquo;I run a small bakery in Entebbe. Write a short, friendly email to a customer confirming their cake order for Saturday, UGX 120,000, pickup at 10am. Keep it under 100 words.&rdquo;</p></div></div>`));

S.push(slide('Module 2 · Lesson 2', 'Context, task, format', `<div class="grid3"><div class="card" style="border-color:#6d28d9;background:#f5f3ff"><h3 style="color:#5b21b6">Context</h3><b>Who you are</b> and the situation.</div><div class="card" style="border-color:#2563eb;background:#eff6ff"><h3 style="color:#1e40af">Task</h3><b>What you want</b> it to do.</div><div class="card" style="border-color:#d97706;background:#fffbeb"><h3 style="color:#92400e">Format</h3><b>How you want it</b>: length, tone, shape.</div></div><div class="prompt" style="margin-top:30px"><div class="q" style="line-height:1.6;font-size:38px"><span style="background:#ede9fe;color:#5b21b6;border-radius:10px;padding:2px 10px">I run a small bakery in Entebbe.</span> <span style="background:#dbeafe;color:#1e40af;border-radius:10px;padding:2px 10px">Write a short, friendly email confirming a cake order for Saturday, pickup at 10am.</span> <span style="background:#fef3c7;color:#92400e;border-radius:10px;padding:2px 10px">Keep it under 100 words.</span></div></div>`));

S.push(slide('Activity', 'Upgrade a weak prompt', list(['Start with: <b>&ldquo;Write an email.&rdquo;</b>', 'Rewrite it with <b>your real situation</b>, a clear task and a format.', 'Send both, and <b>compare</b> the answers.']) + ask('Read us your upgraded prompt. Can we spot the context, the task and the format?')));

S.push(slide('Module 2 · Lesson 3', 'Not quite right? Refine, do not restart', `<p class="lead">Starting over throws away what was already good. <b>Give a follow-up instruction instead.</b></p><div style="height:22px"></div><div>${pills(['&ldquo;Make it shorter.&rdquo;', '&ldquo;Make it warmer.&rdquo;', '&ldquo;Explain that in simpler words.&rdquo;', '&ldquo;Use a more formal tone.&rdquo;', '&ldquo;Give me three versions.&rdquo;', '&ldquo;Add an example.&rdquo;'], '', 40)}</div>` + demo('Ask for a short thank-you message to a customer. Make it <b>warmer</b>, then <b>shorter</b>, then ask for <b>three versions</b>. Pick your favourite and edit it by hand.')));

S.push('<!--compact-->' + slide('Module 2 · Lesson 4', 'Give it your own text, and be careful what you paste', list([
    'Paste in a <b>draft, notes or a description</b> and say what to do with it. Ask it to <b>say when it does not know</b>.',
    '<b>Nothing private, confidential or personal</b> goes into a public tool.']) + `<div style="margin-top:22px">${pills(['Passwords and PINs, including mobile money', 'National ID and passport numbers', 'Bank details', 'Other people&rsquo;s private details'], 'red', 32)}</div><p class="lead" style="margin-top:22px">Describe the problem, <b class="violet">not the person.</b></p>` + act('Write three rough sentences about your day, no names. Paste them: <b>&ldquo;Improve this for a friendly newsletter, keeping the meaning.&rdquo;</b> What did it keep? What did it add?')));

S.push(slide('Module 2 · Key words', 'The lesson on one page', keywords([
    ['Prompt', 'The instruction you give an AI', '&ldquo;Write a polite follow-up email...&rdquo;'],
    ['Context', 'Who you are and the situation', '&ldquo;I run a small bakery in Entebbe.&rdquo;'],
    ['Format', 'How you want the answer shaped', '&ldquo;Under 100 words, friendly tone.&rdquo;'],
    ['Refine', 'Improve an answer with follow-up instructions', '&ldquo;Make it shorter.&rdquo;']])));

S.push(slide('What we covered, and what is next', 'Today in one minute', `<div class="grid2"><div class="card"><h3>Module 1</h3><p>AI is software doing jobs that need human thinking. Machine learning learns from <b>examples</b>. Generative AI <b>creates</b>. A language model <b>predicts the next word</b>, so <b class="red">sounding right is not being right</b>.</p></div><div class="card"><h3>Module 2</h3><p>Pick one tool. Ask with <b>context, task and format</b>. <b>Refine</b>, do not restart. Give it <b>your own text</b> and keep private details out.</p></div></div><p class="note"><b>Next steps:</b> take the Module 1 and Module 2 quizzes (the lessons already count because you came to class), install the app, and join <b>Class 2 on Wednesday, 2:00 pm</b>: Modules 3 and 4.</p>`));

S.push(`<div class="center" style="text-align:center">${E('Questions · Thank you')}<h1>Questions?<br><span class="violet">Thank you for learning with us</span></h1><p class="lead" style="margin-top:40px">Ask now, or in the Q&amp;A tab under any lesson. See you on Wednesday at 2:00 pm.</p><p class="sub" style="margin-top:18px">Tell your friends and family: the course is <b>free</b>. Use it. Check it. Protect people.</p></div>`);

export default { file: 'Live-class-1-Monday-Welcome-Modules-1-and-2', title: 'Live class 1 · Welcome, Modules 1 and 2', short: 'AI Fundamentals', part: 'Live class 1 of 3 · Monday', slides: S };
