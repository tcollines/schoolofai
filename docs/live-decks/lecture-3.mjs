// Live class 3 (Friday, 2:00 pm EAT): Module 5 (Fair and private) + Module 6 (Using AI responsibly). 25 slides.
import { E, list, plain, slide, prompt, ask, demo, act, pills, center, keywords, table } from './helpers.mjs';
const C = '<!--compact-->';
const S = [];
const RED = '#991b1b', GRN = '#166534', AMB = '#92400e';

S.push(center('Live class 3 of 3 · Friday', 'Fair and private,<br><span class="violet">and using AI responsibly</span>', 'Modules 5 and 6', 'Bias · Privacy · Green, amber, red · Your 30-day plan'));

S.push(slide('Welcome back', 'Where we are', `<p class="lead">We have learnt what AI is, how to ask it, how to put it to work, and how to check it when it gets things wrong.</p><div style="height:24px"></div>` + plain([
    '<b>Today, Module 5:</b> two limits of AI that depend on us: <b>bias</b> and <b>privacy</b>.',
    '<b>Then, Module 6:</b> one simple guide, <b>green, amber, red</b>, and your own <b>30-day plan</b>.',
    'This is the last class. After it: the module quizzes, the final assessment, and your <b>certificate</b>.'])));

// ---- Module 5
S.push(slide('Module 5 · Fair and private · Lesson 1', 'How bias gets into AI', `<div class="prompt"><div class="t">BIAS</div><div class="q">An <b>unfair pattern</b> in an AI&rsquo;s answers. It treats some people better than others, or leaves some people out.</div></div><div style="height:24px"></div><p class="lead">This topic can feel heavy. It does not need to. Bias is something you can <b>notice</b>, and something you can <b>reduce</b>.</p>`));

S.push(slide('Module 5 · Lesson 1', 'Why it happens', list([
    'AI learns from <b>what people wrote</b>: books, websites, posts and records.',
    '<b>Human history is unequal</b>, and old patterns and stereotypes are in that data. So answers can be unfair, sexist, racist, or leave some people out.',
    'AI has no opinions. <b>It copies patterns it was shown</b>, like an apprentice who only watched one kind of customer being served.',
    'It can also <b>know less</b> about some people, places and languages. Test it on what you know: your town, your school, your language.'])));

S.push(slide('Module 5 · Lesson 1 · A real example', 'The hiring tool', `<div class="list"><div class="item"><span>Amazon built an <b>experimental tool to rate job applicants</b>.</span></div><div class="item"><span>It learned from <b>years of past CVs</b>, most of them from <b>men</b>.</span></div><div class="item" style="border-color:#dc2626;background:#fef2f2"><span>It began <b>marking down CVs that mentioned women</b>. Amazon scrapped it. <span style="color:#57534e;font-size:30px">Reported by Reuters, 2018.</span></span></div><div class="item hl"><span><b>Nobody told it to be unfair. It copied a pattern in the data.</b></span></div></div>`));

S.push(slide('Module 5 · Lesson 2 · Live demo', 'Spot the assumption', prompt('TYPE THIS', 'Write a short story about a nurse, a boda boda rider and a company director.') + `<div style="height:22px"></div><div class="grid2" style="gap:20px"><div class="card">Who is a <b>man</b> and who is a <b>woman</b>?</div><div class="card">What <b>names</b>? All from one region?</div><div class="card">Which <b>region or tribe</b>?</div><div class="card">Who is <b>rich</b>, and who has the power?</div></div>` + ask('Then ask: &ldquo;Rewrite this without assuming anyone&rsquo;s gender, tribe or background.&rdquo; Results vary. The skill is <b>looking</b>.')));

S.push(slide('Module 5 · Lesson 2', 'Four habits that reduce bias', list([
    '<b>Look for who is missing</b>, or who is shown as a stereotype.',
    '<b>Never let AI decide alone about people:</b> hiring, marks, loans, discipline. A person looks, asks questions and takes responsibility.',
    '<b>Say what you want:</b> &ldquo;Use varied names and roles.&rdquo;',
    '<b>Ask the people who would be affected.</b> They notice what you miss.'])));

S.push(slide('Module 5 · Lesson 3 · Privacy', 'Your words may not stay private', `<div class="prompt"><div class="t">PUBLIC AI TOOLS</div><div class="q">An AI service anyone can use, like a free chatbot. It <b>may use what you type</b> to train its models, and could reveal it later.</div></div><div style="height:24px"></div>` + plain(['I am not saying every tool does this. I am saying it is <b>possible</b>, and you cannot always be sure.', '<b>Free does not mean private.</b> It only means you did not pay in money. Decide before you type what is safe to share.'])));

S.push(slide('Module 5 · Lesson 3', 'What never goes into a public chatbot', `<div>${pills(['Confidential work information', 'Passwords', 'PINs, including mobile money', 'Bank and card details', 'Personal information (PII)'], 'red', 38)}</div><div class="prompt" style="margin-top:30px"><div class="t">PII</div><div class="q"><b>Personally identifiable information:</b> anything that identifies a person. A name with a phone number, an ID number, an address, a photo, medical details, bank or mobile money details.</div></div><p class="note">A name on its own may not say much. A name <b>with a phone number</b> points to one person. That is why the combination matters.</p>`));

S.push(slide('Module 5 · Lesson 3', 'How many pieces of personal information?', `<p class="note" style="margin:0 0 18px">A message made up for this class. It is not a real person.</p><div class="card" style="font-size:40px;line-height:1.7">&ldquo;Please write a reply to <span class="mark" style="background:#fecaca;color:${RED}">Sarah Namukasa</span>, <span class="mark" style="background:#fecaca;color:${RED}">0772 000 000</span>, <span class="mark" style="background:#fecaca;color:${RED}">ID number CM00000000000</span>. She says her <span class="mark" style="background:#fecaca;color:${RED}">mobile money payment of UGX 150,000</span> did not reach her account.&rdquo;</div>` + ask('Count them. Four: the name, the phone number, the ID number, the payment detail. Together they identify one real person and their money.')));

S.push(slide('Module 5 · Lesson 3', 'Two questions people ask', `<div class="grid2"><div class="card"><h3>&ldquo;Is deleting my chat enough?&rdquo;</h3><p><b>Not always.</b> Policies differ. Deleting may help, but you cannot be sure what happened before. The safe move: do not paste secrets in the first place.</p></div><div class="card"><h3>&ldquo;I changed a setting, so it is private.&rdquo;</h3><p>Good to check, but <b>a setting is not permission</b> to paste secrets. It reduces the risk. It does not remove it.</p></div></div>`));

S.push(C + slide('Module 5 · Lesson 4 · Safer habits', 'Instead of this, do this', table(['Instead of this', 'Do this'], [
    ['Pasting a customer&rsquo;s complaint with their <b>name and phone number</b>', '<b>Describe it:</b> &ldquo;A customer says their delivery was two days late. Write a polite reply.&rdquo; Add the name yourself, by hand.'],
    ['Pasting your <b>customer list</b>', 'Ask <b>how to analyse</b> a customer list, and practise on <b>made-up data</b>.'],
    ['Pasting a <b>full contract</b>', '<b>Remove names and amounts</b> first (&ldquo;Supplier&rdquo;, &ldquo;Amount&rdquo;), or use a tool your organisation has approved.']]) + `<p class="note"><b>Describe the problem, not the person.</b></p>`));

S.push(slide('Module 5 · Lesson 4', 'Three rules, and the line to remember', list([
    '<b>Use approved, secure tools</b> for anything sensitive.',
    '<b>Check the settings.</b> A setting is not permission to paste secrets.',
    '<b>Not sure? Do not paste it.</b>']) + `<div class="prompt" style="margin-top:26px"><div class="q" style="font-size:52px;font-weight:700;text-align:center">Asking costs a minute. <span class="red">A leak can cost far more.</span></div></div>`));

S.push(C + slide('Module 5 · Key words', 'The lesson on one page', keywords([
    ['Bias', 'Unfair patterns in AI answers, copied from the data it learned from', 'Stereotyped stories, or a CV tool that favoured men'],
    ['PII', 'Personal information that identifies a person', 'A name with a phone number, or an ID number'],
    ['Public AI tool', 'An AI service anyone can use, which may keep or learn from what you type', 'A free chatbot']]) + act('Think of one real message you might paste into a chatbot. Rewrite it so it describes the problem without names, phone numbers, ID numbers or amounts.')));

// ---- Module 6
S.push(slide('Module 6 · Using AI responsibly · Lesson 1', 'Green, amber, red', `<div class="grid3"><div class="card" style="border-color:#16a34a;background:#f0fdf4"><div class="pill green">Green · go</div><p style="margin-top:12px;font-size:32px;line-height:1.5">Low risk.<br>Brainstorm names and ideas<br>Draft a thank-you note<br>Explain a concept simply<br>Summarise a public article</p></div><div class="card" style="border-color:#d97706;background:#fffbeb"><div class="pill amber">Amber · check carefully</div><p style="margin-top:12px;font-size:32px;line-height:1.5">Facts, numbers and quotes<br>Health, legal and money information<br>Anything that goes out <b>under your name</b></p></div><div class="card" style="border-color:#dc2626;background:#fef2f2"><div class="pill red">Red · stop</div><p style="margin-top:12px;font-size:32px;line-height:1.5">Pasting personal or confidential information into a public tool<br>Letting AI alone decide about people<br>Submitting AI work you <b>cannot explain</b>, or that your school or employer does not allow</p></div></div><p class="note">The colours are not fixed. A task can move: summarising a public article is green, but quoting its figures in a report with your name moves them to amber. <b>Ask the colour question at each step.</b></p>`));

S.push(C + slide('Module 6 · Lesson 1 · Your turn', 'Green, amber or red?', `<div class="grid3" style="gap:20px">${['Asking AI for <b>name ideas</b> for your new shop', 'Pasting a customer&rsquo;s <b>ID details</b> to fill a form faster', 'Asking AI <b>what documents</b> you need to register a business', 'Asking AI for a <b>cover letter draft</b>, then editing it', 'Following an AI&rsquo;s <b>medicine dose for a child</b> without checking', 'Pasting your company&rsquo;s <b>unreleased results</b> to get a summary'].map((t, i) => `<div class="card"><div class="n" style="display:inline-flex;width:54px;height:54px;border-radius:50%;background:#6d28d9;color:#fff;font-weight:700;font-size:30px;align-items:center;justify-content:center">${i + 1}</div><div style="margin-top:12px">${t}</div></div>`).join('')}</div>` + ask('Decide for each: green, amber or red, and say why.')));

S.push(C + slide('Module 6 · Lesson 1', 'The answers', table(['Case', 'Colour', 'Why'], [
    ['1 Name ideas', '<b class="green">Green</b>', 'Low risk. Pick the ones you like.'],
    ['2 Customer ID details', '<b class="red">Red</b>', 'Personal information never goes into a public tool.'],
    ['3 Documents to register a business', '<b style="color:#92400e">Amber</b>', 'A useful start, but rules change. Check the official source.'],
    ['4 Cover letter draft', '<b class="green">Green</b>', 'Edit it, make it sound like you, check every fact about you.'],
    ['5 Medicine dose for a child', '<b class="red">Red</b>', 'Never follow it without checking. Ask a doctor or pharmacist.'],
    ['6 Unreleased company results', '<b class="red">Red</b>', 'Confidential. Approved, secure tool only, if at all.']])));

S.push(C + slide('Module 6 · Lesson 1', 'Four questions to ask of any AI tool', `<div class="grid2"><div class="card"><div class="pill">1</div><h3 style="margin-top:10px">Does it do good for people?</h3></div><div class="card"><div class="pill">2</div><h3 style="margin-top:10px">Is it built and tested for safety?</h3>Or rushed out untested?</div><div class="card"><div class="pill">3</div><h3 style="margin-top:10px">Is it fair?</h3>Does it avoid creating or reinforcing unfair bias?</div><div class="card"><div class="pill">4</div><h3 style="margin-top:10px">Is someone accountable?</h3>Does a real person or company answer to the people it affects?</div></div><p class="note" style="font-size:26px">For information: these ideas come from Google&rsquo;s original 2018 AI principles, restated in February 2025 as three pillars. You do not need to remember that. Think of a mobile money agent: there is a shop, a name, and a place to complain.</p>`));

S.push(slide('Module 6 · Lesson 2', 'Stay the human in the loop', `<div class="prompt"><div class="t">HUMAN IN THE LOOP</div><div class="q">A person is part of the process. A person <b>reviews and decides</b> before AI output affects real people.</div></div><div style="height:24px"></div><p class="lead">AI is powerful, but it has <b>no human judgment, no empathy and no common sense</b>. It does not know your customer is grieving.</p><div style="height:22px"></div><div class="grid3"><div class="card"><b>You verify</b> the facts</div><div class="card"><b>You protect</b> privacy</div><div class="card"><b>You make</b> the decision</div></div>`));

S.push(slide('Module 6 · Lesson 2', 'The whole course in one line', `<div style="display:flex;flex-direction:column;gap:18px;margin-bottom:24px"><div class="big"><span class="violet">Use</span> it.</div><div class="big"><span style="color:#1e40af">Check</span> it.</div><div class="big"><span style="color:${GRN}">Protect</span> people.</div></div><p class="note"><b>Three checks</b> for anything AI helps you make: <b>Is it true? Is it right for my reader? Is it safe to share?</b> About a minute.</p>`));

S.push(C + slide('Module 6 · Lesson 2', 'Your 30-day plan', `<div class="grid2" style="gap:22px"><div class="card"><div class="pill">Week 1</div><p style="margin-top:10px"><b>Pick one task you do every week</b>: an email, minutes, a spreadsheet. Try the prompts from this course on it.</p></div><div class="card"><div class="pill">Week 2</div><p style="margin-top:10px"><b>Add a second task.</b> Note the time you save, even ten minutes. Numbers keep you honest.</p></div><div class="card"><div class="pill">Week 3</div><p style="margin-top:10px"><b>Teach one person one idea.</b> Explain it in your own words.</p></div><div class="card"><div class="pill">Week 4</div><p style="margin-top:10px"><b>Review your wins and your misses.</b> A miss is not a failure. It is the check doing its job.</p></div></div>`));

S.push(C + slide('Where you finish', 'What comes next', list([
    'Take the <b>module quizzes</b> (the lessons already count for the classes you attended).',
    'Take the <b>final assessment</b>: 20 questions, <b>80%</b> to pass, 3 tries in 24 hours.',
    'Get your <b>certificate</b>, with a unique ID anyone can verify online.',
    'Ask us about the <b>next programmes</b> from Welile School of AI. Bring your toughest question about AI.'], true) + act('Write your <b>Week 1 task</b> on paper or in your phone notes, with a date.')));

S.push(`<div class="center" style="text-align:center">${E('Questions · Thank you')}<h1>You are not a passenger.<br><span class="violet">You are the person in charge.</span></h1><p class="lead" style="margin-top:36px">Questions? Ask now, or in the Q&amp;A tab. Then tell your friends and family: the course is <b>free</b> for everyone who registers.</p><p class="sub" style="margin-top:18px">Thank you for learning with us. Use it. Check it. Protect people.</p></div>`);

export default { file: 'Live-class-3-Friday-Modules-5-and-6', title: 'Live class 3 · Modules 5 and 6', short: 'AI Fundamentals', part: 'Live class 3 of 3 · Friday', slides: S };
