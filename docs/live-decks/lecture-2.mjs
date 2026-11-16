// Live class 2 (Wednesday, 2:00 pm EAT): Module 3 (Make AI work for you) + Module 4 (When AI gets it wrong). 25 slides.
import { E, list, plain, slide, prompt, ask, demo, act, pills, center, keywords, table } from './helpers.mjs';
const C = '<!--compact-->';
const S = [];

S.push(center('Live class 2 of 3 · Wednesday', 'Make AI work for you,<br><span class="violet">and when AI gets it wrong</span>', 'Modules 3 and 4', 'Four everyday jobs · Hallucinations, real cases, and fact-checking'));

S.push(slide('Welcome back', 'Where we are', `<p class="lead">On Monday we learnt what AI is, and how to ask it clearly: <b>context, task, format</b>.</p><div style="height:24px"></div>` + plain([
    '<b>Today, Module 3:</b> put AI to work on four everyday jobs. <b>Brainstorm, draft, summarise, automate.</b>',
    '<b>Then, Module 4:</b> what happens when AI gets it wrong, and <b>how to fact-check</b>.',
    '<b>Friday:</b> Modules 5 and 6, fair and private, and using AI responsibly.'])));

// ---- Module 3
S.push(slide('Module 3 · Make AI work for you · Lesson 1', 'AI is your co-pilot, not your replacement', `<p class="lead">A co-pilot helps while <b>you stay in charge</b>, like a map on a boda boda rider&rsquo;s phone.</p><div style="height:20px"></div><div class="grid2"><div class="card">Saves time on <b>first drafts</b></div><div class="card">A partner <b>when you are stuck</b></div><div class="card">Organises <b>complex information</b> fast</div><div class="card">Handles <b>simple tasks</b>, no coding</div></div><div class="prompt" style="margin-top:26px"><div class="q" style="text-align:center;font-weight:700;font-size:56px">AI drafts. <span class="violet">You decide.</span></div></div>`));

S.push(slide('Job 1 · Brainstorm', 'Beat the blank page', `<p class="lead">To brainstorm is to come up with <b>many ideas quickly</b>, before you choose one. You do not judge yet. You collect.</p><div style="height:22px"></div><div>${pills(['10 taglines for a small business', 'An outline for a talk', 'A meeting agenda', 'Interview questions'], '', 38)}</div><p class="note">You do not get one answer. You get <b>options to react to</b>. That is the real value.</p>`));

S.push(slide('Job 1 · Live demo', 'Brainstorm together', prompt('TYPE THIS', 'I am organising a school fundraiser for 400 students. Give me 10 ideas to raise money.') + `<div style="height:24px"></div>` + plain(['<b>Pick the two ideas</b> you like best.', 'Then ask: <b>&ldquo;Make idea 3 cheaper and easier to run.&rdquo;</b> Refine, do not restart.']) + ask('Which two did you pick, and why? The chatbot does not know your school. You decide.')));

S.push(slide('Job 1 · Three habits', 'How to brainstorm well', list([
    '<b>Ask for many ideas at once.</b> Ten is better than one. The best idea is often number seven.',
    '<b>Pick the best two and refine them.</b> Do not try to polish all ten.',
    '<b>Treat answers as inspiration, then make them yours.</b> Chatbot ideas can sound alike, so bend them and add what only you know.'])));

S.push(slide('Job 2 · Draft', 'AI drafts. You edit. You send.', `<div class="grid3"><div class="card"><h3>AI drafts</h3>The first version, in seconds.</div><div class="card"><h3>You edit</h3>The facts, the tone, and your own voice.</div><div class="card" style="border-color:#6d28d9"><h3>You send</h3>Only after you have <b>read it</b>.</div></div><p class="note"><b>Tone</b> is how a message feels: friendly, formal, warm. The right tone for your landlord is not the right tone for your best friend. Like a tailor&rsquo;s pinned cloth, a draft is <b>not the finished shirt</b>.</p>`));

S.push(slide('Job 2 · Live demo', 'Draft, refine, then check', prompt('TYPE THIS', 'Write a polite follow-up email to a client who has not replied to my quote for five days. Keep it short and friendly.') + `<div style="height:22px"></div><div>${pills(['&ldquo;Make it warmer.&rdquo;', '&ldquo;Make it shorter.&rdquo;', '&ldquo;Give me three versions.&rdquo;'], '', 38)}</div>` + ask('Read the draft slowly. Is there a sentence you would never say, or a detail that is not true?')));

S.push(slide('Job 2 · Finish in your own voice', 'Never send the first draft', `<div class="card" style="border-color:#dc2626;background:#fef2f2"><p>The chatbot wrote: &ldquo;<b class="red">As we discussed on the phone…</b>&rdquo; But we never spoke. It made that up to sound natural.</p></div><div style="height:24px"></div>` + list(['<b>Add your name.</b> A message without it is just a template.', '<b>Add one personal detail</b> only you would know.', '<b>Fix anything untrue:</b> dates, amounts, names, promises.'])));

S.push(slide('Job 3 · Summarise', 'Make long and messy short and clear', `<div class="grid3"><div class="card"><h3>A long document</h3>A few <b>bullet points</b>. <i>&ldquo;Summarize this report into 3 key takeaways.&rdquo;</i></div><div class="card"><h3>Meeting notes</h3>The <b>action items</b>: tasks someone has to do.</div><div class="card"><h3>Messy notes</h3>A <b>table</b>: task, owner, due date.</div></div><p class="note">A summary can leave out something important, or change a number or a name. <b>Always check it against the original.</b></p>`));

S.push(C + slide('Job 3 · Live demo', 'Messy notes into an action table', `<div class="card" style="font-size:32px;line-height:1.5"><div class="muted" style="font-size:26px;color:#57534e;margin-bottom:6px">Paste these sample notes</div>&ldquo;Planning call, Friday. Grace will send venue quotes by Monday. We need to confirm 40 guests. Joseph says catering budget is 2 million. Brian to design the invitation, needs it before the 14th. Still not sure if the hall is free on the 20th.&rdquo;</div><div style="height:22px"></div>` + prompt('THEN TYPE', 'Make a table with three columns: task, owner, due date. If something is missing, write not stated.')));

S.push(C + slide('Job 3 · Check the table', 'Check every row against the notes', table(['Task', 'Owner', 'Due date'], [['Send venue quotes', 'Grace', 'Monday'], ['Confirm 40 guests', '<b class="green">Not stated</b>', '<b class="green">Not stated</b>'], ['Design the invitation', 'Brian', 'Before the 14th']]) + `<p class="note"><b>Why &ldquo;not stated&rdquo;?</b> A chatbot may fill a gap with a guess, like making Grace the owner because her name is nearby. &ldquo;Not stated&rdquo; gives it a safe way to say the notes do not say.</p><p class="note">Then ask: <b>&ldquo;What information in the notes is not in the table?&rdquo;</b> You get the catering budget and the hall question.</p>`));

S.push(C + slide('Job 4 · Automate without writing code', 'Ask for a spreadsheet formula in plain words', prompt('TYPE THIS', 'My monthly sales are in column B, starting at B2. Write a formula in C3 that shows growth compared with last month as a percentage, and explain it in simple words.') + `<div style="height:20px"></div><div class="card"><p>It should look like <b class="violet">=(B3-B2)/B2</b>, formatted as a percentage. <b>Ask for the explanation</b>: if you do not understand it, you cannot check it.</p></div><p class="note">Also: step-by-step help when software misbehaves, and small macros for repetitive work. Use AI to speed up while you <b>learn</b> the skill, not to avoid learning it.</p>`));

S.push(slide('Job 4 · Test before you trust', 'Test it on one row, with a calculator', `<div class="grid2"><div class="card"><p>February <b>1,380,000</b><br>January <b>1,200,000</b></p><p style="margin-top:16px">1,380,000 − 1,200,000 = <b>180,000</b><br>180,000 ÷ 1,200,000 = <b>0.15</b> = <b class="green">15%</b></p></div><div class="card" style="border-color:#16a34a;background:#f0fdf4"><p>Spreadsheet: <b>15%</b><br>Calculator: <b>15%</b></p><p class="green" style="font-size:52px;font-weight:700;margin-top:10px">They match ✔</p></div></div><p class="note"><b>What if last month is zero?</b> It divides by zero and shows an error. Refine: <i>&ldquo;Change the formula so it does not show an error if last month&rsquo;s sales are zero.&rdquo;</i> Then test again.</p>`));

S.push(C + slide('Module 3 · Key words', 'The lesson on one page', keywords([
    ['Co-pilot', 'AI that helps while you stay in charge', 'AI drafts, you edit and decide'],
    ['Draft', 'A first version, not the final one', 'An email you will edit'],
    ['Summarise', 'Make something long shorter, keeping the main points', '&ldquo;3 key takeaways&rdquo;'],
    ['Formula', 'An instruction a spreadsheet follows to calculate', '=(B3-B2)/B2']]) + `<p class="note">Before you use anything AI made, ask three questions: <b>Is it true? Is it right for my reader? Is it safe to share?</b></p>`));

// ---- Module 4
S.push(slide('Module 4 · When AI gets it wrong · Lesson 1', 'AI can sound completely sure, and be completely wrong', `<p class="lead">Picture a man at a taxi stop in Kampala. Someone asks which bus goes to Entebbe. He does not know, but he does not want to look foolish. &ldquo;<b>That one, with the blue stripe.</b>&rdquo; He is calm. He sounds sure. He may be completely wrong.</p><div class="prompt" style="margin-top:28px"><div class="t">HALLUCINATION</div><div class="q">When AI states <b class="red">something false</b> as if it were <b class="green">true</b>: invented facts, quotes, sources and numbers.</div></div>`));

S.push(slide('Module 4 · Lesson 1', 'Why it happens, and how to catch it', `<p class="lead">AI <b>predicts what sounds likely</b>. It does <b>not</b> check what is true. A made-up answer can look <b>more convincing</b> than a true one: smooth, detailed, with a nice name and a year.</p><div style="height:22px"></div>` + prompt('LIVE DEMO · TYPE THIS', 'Tell me about the 1987 book The Golden Boda of Nansana and its main characters.') + `<p class="note">I made that book up. Then ask: <b>&ldquo;Give me three sources for that.&rdquo;</b> Try to find them. <b>Confidence is not evidence.</b></p>`));

S.push(slide('Module 4 · Lesson 2 · Real case 1', '2023: the lawyers', `<div class="list"><div class="item"><span>Two New York lawyers filed court papers citing <b>six cases</b>.</span></div><div class="item" style="border-color:#dc2626;background:#fef2f2"><span><b>ChatGPT had invented all six.</b> They did not exist, but they sounded real.</span></div><div class="item"><span>The judge fined them and their firm <b>$5,000 in total</b>.</span></div><div class="item hl"><span>The judge: using AI for help is <b>not improper</b>, but lawyers <b>must check</b> what they file.</span></div></div>`));

S.push(slide('Module 4 · Lesson 2 · Real case 2', '2024: the airline', `<div class="list"><div class="item"><span>Air Canada&rsquo;s website <b>chatbot</b> told a customer he could claim a <b>bereavement discount after his trip</b>.</span></div><div class="item" style="border-color:#dc2626;background:#fef2f2"><span>The airline&rsquo;s real policy said <b>otherwise</b>.</span></div><div class="item"><span>A tribunal held <b>the airline responsible</b> and ordered it to pay about <b>CA$812</b>.</span></div></div>`));

S.push(slide('Module 4 · Lesson 2', 'What the two cases have in common', list([
    'Both mistakes <b>looked believable</b>. Neither looked like a mistake.',
    'In both, <b>a person or company was held responsible</b>. Not the chatbot.',
    'You cannot say <b>&ldquo;The AI told me.&rdquo;</b> If you use what AI gives you, you answer for it. <b>Using AI is fine. Checking what you use is your job.</b>'], true) + ask('Before you use anything AI told you, ask: <b>&ldquo;If this is wrong, who will be responsible?&rdquo;</b>')));

S.push(slide('Module 4 · Lesson 3', 'How to fact-check in three steps', list([
    '<b>Mark the claims that matter:</b> names, numbers, dates, quotes, sources and laws.',
    '<b>Check them outside the chatbot:</b> an official website, a textbook, a trusted news source, or an expert. Asking the same chatbot &ldquo;Are you sure?&rdquo; is not a check.',
    '<b>Ask for sources, then open them.</b> If the link does not exist, or does not say that, <b class="red">do not use the claim.</b>'])));

S.push(slide('Module 4 · Lesson 3', 'The riskier the topic, the more you check', `<div>${pills(['Health', 'Law', 'Money', 'Safety'], 'red', 46)}</div><p class="note" style="margin-top:24px">For these four, treat the chatbot as <b>a place to start, not a place to finish</b>: ask a doctor or pharmacist, read the law from an official source, check money questions with a trusted source, and never guess when safety is at stake.</p><div class="prompt" style="margin-top:26px"><div class="q">You can <b class="green">reduce</b> hallucinations: give it the text to work from, ask it to say when it does not know, ask for sources. You <b class="red">cannot remove</b> them, so the fact-check stays.</div></div>`));

S.push(C + slide('Module 4 · Key words', 'The lesson on one page', keywords([
    ['Hallucination', 'When AI states something false as if it were true', 'An invented book or a fake source'],
    ['Fact-check', 'Verify a claim with a trusted source outside the chatbot', 'Checking a figure on an official website']]) + `<p class="note">Treat AI like a <b>fast, well-read assistant who sometimes makes things up</b>. Very useful, and always checked.</p>` + act('Ask your chatbot for a short paragraph with a number and a source. Mark the claims, check one outside the chatbot, then open its source.')));

S.push(slide('What we covered, and what is next', 'Today in one minute', `<div class="grid2"><div class="card"><h3>Module 3</h3><p><b>Brainstorm, draft, summarise, automate.</b> AI drafts, you decide. Never send the first draft. Use &ldquo;not stated&rdquo;. Test a formula on one row.</p></div><div class="card"><h3>Module 4</h3><p>AI predicts what sounds likely, so it can be <b class="red">sure and wrong</b>. Two real cases. <b>Mark, check outside, open the sources.</b></p></div></div><p class="note"><b>Next steps:</b> take the Module 3 and Module 4 quizzes (the lessons count because you came to class), and join <b>Class 3 on Friday, 2:00 pm</b>: Modules 5 and 6, fair and private, and using AI responsibly.</p>`));

S.push(`<div class="center" style="text-align:center">${E('Questions · Thank you')}<h1>Questions?<br><span class="violet">Thank you for learning with us</span></h1><p class="lead" style="margin-top:40px">Ask now, or in the Q&amp;A tab under any lesson. See you on Friday at 2:00 pm.</p><p class="sub" style="margin-top:18px">Use it. Check it. Protect people.</p></div>`);

export default { file: 'Live-class-2-Wednesday-Modules-3-and-4', title: 'Live class 2 · Modules 3 and 4', short: 'AI Fundamentals', part: 'Live class 2 of 3 · Wednesday', slides: S };
