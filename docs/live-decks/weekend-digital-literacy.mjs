// Weekend lecture (Saturday, 10:00 am-12:00 pm EAT): Digital literacy and AI, for everyday people.
import { E, list, plain, slide, prompt, ask, demo, act, pills, center, keywords, table } from './helpers.mjs';
const C = '<!--compact-->';
const S = [];
const RED = '#991b1b', GRN = '#166534', AMB = '#92400e';
const msg = (who, t) => `<div class="card" style="font-size:36px;line-height:1.45"><div style="font-size:26px;color:#57534e;margin-bottom:6px">${who}</div>${t}</div>`;

S.push(center('Weekend lecture · Saturday', 'Digital literacy and AI<br><span class="violet">for everyday life</span>', 'Stay safe online, spot the fakes, and make AI work for your shop, your work and your family', 'Welile School of AI · Free for everyone'));

S.push(slide('Welcome', 'Who this is for', `<p class="lead">This class is for <b>everyone</b>: shop owners, traders, boda riders, students, youth groups, council members, parents.</p><div style="height:24px"></div>` + plain([
    'You do <b>not</b> need to know any technology. If you can use WhatsApp, you can follow this class.',
    'Please keep your <b>phone</b> with you. We will try things together.',
    'Ask questions at any time. <b>There are no silly questions.</b>'])));

S.push(slide('Today', 'Four parts, two hours', list([
    '<b>Part 1: Your phone and your accounts.</b> Passwords, PINs and codes.',
    '<b>Part 2: Scams and safety.</b> How to spot a trick before it costs you money.',
    '<b>Part 3: What is real online?</b> Fake news, fake photos and fake voices.',
    '<b>Part 4: AI for everyday life.</b> Real jobs in your shop and your work. Then, how to keep learning for free.'])));

// ---- Part 1
S.push(slide('Part 1 · Your phone and your accounts', 'What is digital literacy?', `<p class="lead">Digital literacy is being able to <b>use</b> digital tools, <b>understand</b> what you see on them, <b>stay safe</b> on them, and <b>create</b> something useful with them.</p><div style="height:24px"></div><div class="grid2"><div class="card"><h3>Use</h3>Call, message, pay, search, apply</div><div class="card"><h3>Understand</h3>Is this true? Who made it? Why?</div><div class="card"><h3>Stay safe</h3>Protect your money, your accounts and your name</div><div class="card"><h3>Create</h3>Write, design, sell, learn, solve problems</div></div>`));

S.push(slide('Part 1', 'Your phone holds your whole life', `<p class="lead">Think about what is on your phone right now.</p><div style="height:20px"></div><div>${pills(['Your <b>mobile money</b>', 'Your <b>contacts</b> and chats', 'Your <b>photos</b>', 'Your <b>email</b> and social media', 'Your <b>customers</b> and orders', 'Your <b>ID</b> photos and documents'], '', 38)}</div><p class="lead" style="margin-top:28px">Whoever gets into your phone or accounts gets into <b>all of this</b>.</p>` + ask('If you lost your phone today, what is the first thing you would worry about?')));

S.push(slide('Part 1 · Passwords and PINs', 'Four rules that protect most people', list([
    '<b>Longer is stronger.</b> A phrase of four or five words you can remember beats a short password with a number.',
    '<b>Never use the same password</b> for your email and everything else. If one leaks, the rest fall.',
    '<b>Do not use</b> your birthday, your phone number, your name, or <b>1234</b>.',
    '<b>Never share a PIN or a code.</b> Not with a friend, not with someone who says they work for the company.'])));

S.push(slide('Part 1 · Codes', 'The code that arrives by SMS belongs to you', `<div class="prompt"><div class="t">OTP · ONE-TIME CODE</div><div class="q">A short code sent to your phone to <b>prove it is you</b>. It works once. If you give it away, you give away your account.</div></div><div style="height:24px"></div>` + plain([
    'Turn on <b>two-step verification</b> for WhatsApp, email and your social accounts. It adds a second lock.',
    '<b>No real company, bank or mobile money agent needs your PIN or your code.</b> If someone asks, it is a trick.'])));

S.push(slide('Part 1 · Activity', 'Password makeover', table(['These are made up', 'Strong or weak?'], [
    ['<b>kampala123</b>', '<b class="red">Weak.</b> A place and a simple number.'],
    ['<b>0772000000</b>', '<b class="red">Weak.</b> A phone number is easy to guess.'],
    ['<b>blue-matooke-sings-at-dawn</b>', '<b class="green">Stronger.</b> Long, easy for you to remember.']]) + act('Think of a new phrase of four words that only you would know. <b>Do not say it out loud, and do not type it in the chat.</b>')));

// ---- Part 2
S.push(slide('Part 2 · Scams and safety', 'The tricks are old. The tools are new.', `<p class="lead">Scammers work on your <b>feelings</b>, not your phone. They want you to act <b>fast</b>, before you think.</p><div style="height:20px"></div><div>${pills(['Fear: &ldquo;Your account will be blocked&rdquo;', 'Greed: &ldquo;You have won a prize&rdquo;', 'Trust: &ldquo;Hi, it is me, I have a new number&rdquo;', 'Pity: &ldquo;Please help, it is an emergency&rdquo;', 'Authority: &ldquo;This is the bank / the police&rdquo;'], '', 34)}</div>`));

S.push(slide('Part 2 · Spot the scam', 'Which of these messages is a trick?', `<div class="grid2" style="gap:22px">${msg('Message 1 (made up)', '&ldquo;Congratulations! You have won UGX 5,000,000. Send UGX 50,000 now to claim your prize.&rdquo;')}${msg('Message 2 (made up)', '&ldquo;Sorry, I sent you money by mistake. Please send it back to this number.&rdquo;')}${msg('Message 3 (made up)', '&ldquo;Your mobile money account will be blocked today. Reply with your PIN to keep it open.&rdquo;')}${msg('Message 4 (made up)', '&ldquo;Hi, your delivery arrives at 4pm. Call us on the number on your order if you need to change it.&rdquo;')}</div>` + ask('Which ones are tricks, and what gave them away?')));

S.push(C + slide('Part 2 · Spot the scam', 'The answers', table(['Message', 'Verdict', 'Why'], [
    ['1 Prize', '<b class="red">Trick</b>', 'You never pay to receive a prize. Real prizes do not ask for money first.'],
    ['2 Sent by mistake', '<b class="red">Likely a trick</b>', 'Check your <b>own</b> balance and messages. Ask your provider. Do not send money back on a stranger&rsquo;s word.'],
    ['3 Account blocked', '<b class="red">Trick</b>', 'Asking for your PIN is the giveaway. Nobody real needs it.'],
    ['4 Delivery', '<b style="color:#92400e">Check first</b>', 'It asks for no money or PIN, but confirm using the number you already have, not a new one.']])));

S.push(slide('Part 2', 'Five red flags', list([
    '<b>Hurry:</b> &ldquo;Do it now or lose it.&rdquo;',
    '<b>Secret codes:</b> it asks for your <b>PIN, OTP or password</b>.',
    '<b>Money first:</b> you must pay a fee to receive something.',
    '<b>A strange link</b> or a number you do not know.',
    '<b>Too good to be true</b>, or &ldquo;do not tell anyone&rdquo;.'], true)));

S.push(C + slide('Part 2 · WhatsApp', 'Safe habits on WhatsApp', list([
    '<b>A friend asks for money from a new number?</b> Call their old number, or someone who knows them, before you send anything.',
    '<b>Do not tap strange links</b> or install apps sent in a chat, even from a contact. Their account may have been taken over.',
    '<b>Check before you forward.</b> If you cannot say where a message came from, do not pass it on.',
    '<b>Be careful what you share in big groups.</b> Photos of ID, tickets and children are best kept private.'])));

S.push(slide('Part 2', 'If you think you have been tricked', list([
    '<b>Act fast.</b> Call your mobile money or bank provider on their <b>official line</b> and tell them what happened.',
    '<b>Change your passwords</b> and PIN, starting with email and mobile money.',
    '<b>Tell people</b> who might be next: family, your group, your customers.',
    '<b>Report it</b> to the police. <b>Do not be ashamed.</b> Clever people get tricked. Telling early is what helps.'])));

// ---- Part 3
S.push(slide('Part 3 · What is real online?', 'Not everything online is true', `<p class="lead">Anyone can post anything. A message can be shared a thousand times and still be <b>false</b>.</p><div style="height:22px"></div><div>${pills(['Fake <b>health cures</b>', 'Fake <b>job and visa</b> offers', 'Fake <b>news</b> and made-up quotes', 'Old photos shown as new events'], '', 38)}</div><p class="note">Sharing something false hurts people, and it hurts your name.</p>`));

S.push(slide('Part 3 · New problem', 'Photos, voices and videos can now be faked', `<div class="prompt"><div class="t">DEEPFAKE</div><div class="q">A photo, voice or video that looks <b>real</b> but was <b>made or changed by a computer</b>. AI makes this cheap and fast.</div></div><div style="height:24px"></div>` + plain([
    'Someone can copy a voice from a short recording and ask your family for money.',
    '<b>Seeing and hearing is no longer proof.</b> Check before you believe, and before you pay.'])));

S.push(slide('Part 3', 'How to check in one minute', list([
    '<b>Who posted it?</b> A known source, or an account with no history?',
    '<b>Does anyone else report it?</b> Search for it. Check a trusted news source.',
    '<b>When was it made?</b> Old pictures are often shared as new.',
    '<b>For a call or voice note asking for money,</b> hang up and call the person back on the number you already have. Or ask a question only they can answer.'])));

S.push(slide('Part 3 · Activity', 'Would you share it?', `<div class="card" style="font-size:38px;line-height:1.5">&ldquo;<b>URGENT!</b> Drinking hot water with lemon cures every illness. Doctors do not want you to know. <b>Forward to 10 people.</b>&rdquo; <span style="font-size:26px;color:#57534e">(made up for this class)</span></div><div style="height:24px"></div>` + list(['Does it ask you to <b>hurry</b> or forward it?', 'Who is the source? Can you <b>name one</b>?', 'Would you check with a <b>doctor or pharmacist</b> before acting?']) + ask('Would you share it? What would you do instead?')));

// ---- Part 4
S.push(slide('Part 4 · AI for everyday life', 'You already use AI', `<p class="lead">AI is a computer doing a job that normally needs <b>human thinking</b>.</p><div style="height:20px"></div><div>${pills(['Your phone suggests the <b>next word</b>', 'YouTube or TikTok shows videos <b>you like</b>', 'Your phone unlocks with <b>your face</b>', 'Maps guesses your <b>arrival time</b>', 'Spam goes into its <b>own folder</b>'], '', 38)}</div><p class="note">Now there is a new kind: <b>chatbots</b> like ChatGPT, Gemini and Claude. You type in everyday words, and they answer in everyday words.</p>`));

S.push(slide('Part 4', 'How to ask a chatbot: context, task, format', `<div class="grid3"><div class="card" style="border-color:#6d28d9;background:#f5f3ff"><h3 style="color:#5b21b6">Context</h3><b>Who you are</b> and the situation.</div><div class="card" style="border-color:#2563eb;background:#eff6ff"><h3 style="color:#1e40af">Task</h3><b>What you want</b> it to do.</div><div class="card" style="border-color:#d97706;background:#fffbeb"><h3 style="color:#92400e">Format</h3><b>How you want it</b>: short, simple, a table.</div></div><p class="note"><b>Weak:</b> &ldquo;Write a message.&rdquo;<br><b>Strong:</b> &ldquo;I sell second-hand clothes in Mbale. Write a friendly WhatsApp message reminding a customer to collect her order. Keep it under 50 words.&rdquo;</p>`));

S.push(C + slide('Demo 1 · Your shop', 'Add up a week of sales', `<div class="card" style="font-size:34px;line-height:1.5"><div style="font-size:26px;color:#57534e;margin-bottom:6px">Paste this made-up list</div>Monday 120,000 · Tuesday 95,000 · Wednesday 140,000 · Thursday 110,000 · Friday 210,000 · Saturday 260,000</div><div style="height:22px"></div>` + prompt('THEN TYPE', 'These are my shop sales for the week in UGX. Give me the total, the best day, the slowest day, and the average per day. Show it as a small table.') + `<p class="note"><b>Now check it with a calculator.</b> It can add wrongly. The total is the number to test.</p>`));

S.push(slide('Demo 2 · Write a message', 'A polite reminder, in seconds', prompt('TYPE THIS', 'I sell phone accessories in Kampala. Write a polite, friendly WhatsApp message to a customer who owes me UGX 30,000 from last week. Keep it under 50 words.') + `<div style="height:22px"></div><div>${pills(['&ldquo;Make it warmer.&rdquo;', '&ldquo;Make it shorter.&rdquo;', '&ldquo;Give me two versions.&rdquo;'], '', 38)}</div>` + ask('Would you send it as it is? Read it. Change anything that does not sound like you.')));

S.push(slide('Demo 3 · Translate and simplify', 'Say it in words your customer understands', prompt('TYPE THIS', 'Translate this into simple Luganda: &ldquo;Your order is ready. Please collect it before 6pm on Friday.&rdquo;') + `<div style="height:22px"></div>` + plain(['Quality in Luganda and other local languages can be uneven. <b>Ask a fluent speaker to check</b> anything important before you send it.', 'You can also paste a long, hard message and ask: <b>&ldquo;Explain this in simple words.&rdquo;</b>'])));

S.push(slide('Demo 4 · A small business plan', 'Let it ask you the questions', prompt('TYPE THIS', 'I want to start selling roasted maize near a school. Ask me the questions you need, one at a time, then help me make a simple plan: costs, price, and what I should do first.') + `<p class="note">Answer the questions with your <b>real numbers</b>. The plan is a start. <b>You know your area. AI does not.</b></p>`));

S.push(slide('For groups, councils and youth clubs', 'AI for the office and the community', `<div class="grid2"><div class="card"><h3>Write</h3>A notice for a meeting, a short speech, a letter to a ward leader.</div><div class="card"><h3>Summarise</h3>Long minutes or a long policy into five clear points.</div><div class="card"><h3>Translate</h3>Messages into the local language, then checked by a speaker.</div><div class="card"><h3>Plan</h3>An agenda, a budget outline, a list of questions for a community meeting.</div></div><p class="note">Do not paste people&rsquo;s names, phone numbers or ID details. Describe the situation instead.</p>`));

S.push(slide('Part 4 · Be careful', 'AI can be wrong while sounding sure', `<div class="grid2"><div class="card" style="border-color:#dc2626;background:#fef2f2"><h3>It makes mistakes</h3>It can get numbers wrong and invent facts, names and sources. It sounds confident anyway.</div><div class="card" style="border-color:#16a34a;background:#f0fdf4"><h3>You check</h3>Check numbers with a calculator. Check facts on an official or trusted source. For <b>health, law and money</b>, ask a real expert.</div></div><div class="prompt" style="margin-top:26px"><div class="q" style="text-align:center;font-weight:700;font-size:52px">AI drafts. <span class="violet">You decide.</span></div></div>`));

S.push(slide('Part 4 · Privacy', 'What never goes into a chatbot', `<div>${pills(['Passwords and PINs', 'OTP codes', 'Mobile money and bank details', 'ID numbers', 'Other people&rsquo;s private details', 'Secret work or business information'], 'red', 36)}</div><p class="note" style="margin-top:24px">Free chatbots may keep what you type. Free does not mean private.</p><div class="prompt" style="margin-top:26px"><div class="q">Instead of the customer&rsquo;s name and number, write: <b>&ldquo;A customer says her order was two days late. Write a polite reply.&rdquo;</b> <b>Describe the problem, not the person.</b></div></div>`));

S.push(slide('Interactive', 'Would you paste it?', `<div class="grid3" style="gap:20px">${['A customer&rsquo;s <b>name and phone number</b>, to write a reply', 'A made-up list of <b>weekly sales</b>, to find the total', 'Your <b>mobile money PIN</b>, so it can help you with a problem', 'A <b>description</b> of a late delivery, with no names', 'Your <b>ID number</b>, to fill in a form faster', 'A paragraph you wrote, to <b>improve the wording</b>'].map((t, i) => `<div class="card"><div style="display:inline-flex;width:54px;height:54px;border-radius:50%;background:#6d28d9;color:#fff;font-weight:700;font-size:30px;align-items:center;justify-content:center">${i + 1}</div><div style="margin-top:12px">${t}</div></div>`).join('')}</div>` + ask('For each: green (go), amber (check) or red (stop)? Say why.')));

S.push(C + slide('Interactive', 'The answers', table(['Case', 'Colour', 'Why'], [
    ['1 Name and phone number', '<b class="red">Red</b>', 'Personal information. Describe the problem instead.'],
    ['2 Made-up weekly sales', '<b class="green">Green</b>', 'No private details. Still check the total with a calculator.'],
    ['3 Mobile money PIN', '<b class="red">Red</b>', 'Never. Not to a person, not to a chatbot.'],
    ['4 Late delivery, no names', '<b class="green">Green</b>', 'Describes the problem, not the person.'],
    ['5 ID number', '<b class="red">Red</b>', 'Never paste ID numbers into a public tool.'],
    ['6 Your own paragraph', '<b class="green">Green</b>', 'If it has no private details, and you check the result.']])));

S.push(slide('Why this matters', 'AI should work for everyone, not only a few', `<p class="lead">Most talk about AI is for big companies and experts. But most people are <b>shop owners, traders, farmers, students and families</b>, and more of them are getting online every year.</p><div style="height:22px"></div>` + plain(['When everyday people learn to use AI <b>safely and simply</b>, they save time and make better decisions.', 'It also means local needs, languages and businesses are <b>part of the story</b>, and not left out.'])));

S.push(slide('Your 30-day habit plan', 'Small steps, every week', `<div class="grid2" style="gap:22px"><div class="card"><div class="pill">Week 1</div><p style="margin-top:10px"><b>Make your accounts safer.</b> New email password, two-step verification on WhatsApp, and never share a code.</p></div><div class="card"><div class="pill">Week 2</div><p style="margin-top:10px"><b>Try AI on one real job</b> in your shop or work. Note the time you save.</p></div><div class="card"><div class="pill">Week 3</div><p style="margin-top:10px"><b>Teach one person</b> how to spot a scam, or how to ask a chatbot clearly.</p></div><div class="card"><div class="pill">Week 4</div><p style="margin-top:10px"><b>Review.</b> What worked, what did not? Keep what saves you time and keeps you safe.</p></div></div>`));

S.push(slide('Keep learning, free', 'Join the AI Fundamentals course', `<div class="prompt"><div class="t">FREE · WITH A CERTIFICATE</div><div class="q"><b>AI Fundamentals: Use AI with Confidence.</b> Six short modules, quizzes, and a certificate with a unique ID anyone can verify.</div></div><div style="height:24px"></div><div class="grid2"><div class="card"><h3>Live classes</h3><b>Wednesday and Friday</b>, 2:00 pm East Africa Time. Optional. Recorded lessons are there any time.</div><div class="card"><h3>Sign up</h3><b>www.welileschoolofai.org/learn/ai-fundamentals</b><br>Free. Works on your phone.</div></div><p class="note">Tell a friend or colleague. Learning is easier together.</p>`));

S.push(`<div class="center" style="text-align:center">${E('Questions · Thank you')}<h1>Questions?<br><span class="violet">Thank you for learning with us</span></h1><p class="lead" style="margin-top:40px">Stay safe. Check before you share. Use it, check it, protect people.</p><p class="sub" style="margin-top:18px">Join the free course: <b>www.welileschoolofai.org/learn/ai-fundamentals</b></p></div>`);

export default { file: 'Weekend-Lecture-Saturday-Digital-Literacy-and-AI', title: 'Weekend lecture · Digital literacy and AI', short: 'Digital literacy and AI', part: 'Weekend lecture · Saturday', slides: S };
