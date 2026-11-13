import { render, shellFor, on, ON, CSS, nest } from '../lesson-lib.mjs';
const [FF, AUDIO, OUT, TOTALS] = process.argv.slice(2);
const TOTAL = parseFloat(TOTALS || '554.4');
const meta = { mod: 'Module 1 · What is AI?', id: 'm1-l5', title: 'Generative AI and large language models' };
const S = shellFor(meta);
const slides = [];
const fam = [{ label: 'AI' }, { label: 'Machine learning' }, { label: 'Deep learning' }, { label: 'Generative AI' }];
const bubble = (t, side = 'l', extra = '') => `<div style="display:flex;justify-content:${side === 'r' ? 'flex-end' : 'flex-start'}"><div style="max-width:78%;padding:18px 26px;border-radius:26px;font-size:32px;line-height:1.35;${side === 'r' ? 'background:#6d28d9;color:#fff;border-bottom-right-radius:8px' : 'background:#fff;border:1.5px solid #e7e2da;border-bottom-left-radius:8px'};${extra}">${t}</div></div>`;

// 1 title
slides.push({ start: 0, steps: [0, 2.1, 9.9, 15.3], html: n => `<html><head><style>${CSS}</style></head><body>
<div class="bar"><span><b>WELILE SCHOOL OF AI</b> &nbsp;·&nbsp; AI Fundamentals</span><span>${meta.mod}</span></div>
<div class="wrap" style="display:flex;gap:40px;align-items:center"><div style="flex:1"><div class="eyebrow">Lesson 5</div><h1 style="font-size:92px">Generative AI and large language models</h1>
<p class="it ${ON(n,1)}" style="font-size:42px;margin-top:36px;color:#44403c;font-family:Fraunces,serif">We have reached the innermost circle of AI.</p>
<p class="it ${ON(n,2)}" style="font-size:36px;margin-top:20px;color:#57534e">The kind of AI people talk about most.</p>
<div class="it ${ON(n,3)}" style="margin-top:26px"><span class="pill" style="font-size:34px">The kind you will use most in this course, and in your life</span></div></div>
<div style="transform:scale(.62);transform-origin:right center;margin-right:-130px;margin-left:-130px">${nest(fam, [true, true, true, true], n >= 1 ? 3 : -1, 780)}</div></div></body></html>` });

// 2 traditional AI
const trad = [['✉️', 'Is this message spam, or not spam?', 2], ['🙂', 'Is this a face, or not a face?', 3], ['💳', 'Is this payment fraud, or not fraud?', 4]];
slides.push({ start: 18.3, steps: [18.3, 22.5, 28.5, 35.0, 40.0, 43.3, 47.0], html: n => S(`<div class="eyebrow">What AI did before generative AI</div><h2 style="margin-bottom:26px">Traditional AI: it recognises, sorts, scores and predicts</h2>
<div style="display:flex;flex-direction:column;gap:14px">${trad.map(t=>`<div class="card row ${on(n,t[2]-1)}" style="padding:16px 34px"><span style="font-size:48px">${t[0]}</span><span>${t[1]}</span></div>`).join('')}</div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:26px;color:#44403c">In each case the AI looks at something that <b>already exists</b>…</p>
<div class="${on(n,6)}" style="margin-top:14px"><span class="pill" style="font-size:34px">…and gives you a label, a number, or a choice from a list</span></div>`) });

// 3 generative creates
const gen = [['✍️', 'Writes text', 1], ['🎨', 'Makes pictures', 2], ['💻', 'Writes computer code', 3], ['🎵', 'Composes music', 4]];
slides.push({ start: 54.6, steps: [54.6, 58.5, 61.5, 64.0, 67.0, 72.7], html: n => S(`<div class="eyebrow">Generative AI does something very different</div><h1 style="font-size:92px">It creates.</h1>
<div class="grid2" style="margin-top:34px;gap:20px">${gen.map(g=>`<div class="card row ${on(n,g[2])}" style="padding:20px 34px"><span style="font-size:58px">${g[0]}</span><span>${g[1]}</span></div>`).join('')}</div>
<p class="${on(n,5)}" style="font-size:40px;margin-top:30px;color:#5b21b6;font-weight:600">It can produce something that did not exist a moment ago.</p>`) });

// 4 old vs new
slides.push({ start: 80.0, steps: [80.0, 81.9, 86.0], html: n => S(`<div class="center"><div class="eyebrow">Computers used to be good at sorting</div>
<h1 style="font-size:76px;max-width:1700px">Now they can also <span class="violet">draft and create</span>.</h1>
<div class="card hl ${on(n,1)}" style="margin-top:44px;padding:28px 40px"><div class="pill">Remember</div><div class="big ${on(n,2)} it" style="font-size:54px;margin-top:16px;opacity:${n>=2?1:0}">AI is old, but this one kind is new.</div></div></div>`) });

// 5 not look up
slides.push({ start: 89.1, steps: [89.1, 99.1, 104.7, 108.5, 114.0], html: n => S(`<div class="eyebrow">A point that surprises people</div><h2 style="margin-bottom:26px">When you ask generative AI a question…</h2>
<div class="grid2">
<div class="card ${on(n,1)}" style="min-height:330px"><div class="pill red">It does not</div><div style="font-size:40px;margin-top:22px;line-height:1.3">Look up the answer and paste it.</div><div class="${on(n,2)} it" style="font-size:32px;margin-top:18px;color:#57534e;line-height:1.35">It is not searching a huge library for a page to copy out.</div></div>
<div class="card hl ${on(n,3)}" style="min-height:330px"><div class="pill green">Instead, it</div><div style="font-size:40px;margin-top:22px;line-height:1.3"><b>Generates</b> the answer. It builds it fresh from patterns it has learned.</div></div></div>
<p class="${on(n,4)}" style="font-size:36px;margin-top:28px;color:#57534e">Remember the patterns we met in machine learning.</p>`) });

// 6 bakery
slides.push({ start: 118.5, steps: [118.5, 122.0, 128.2, 134.4, 143.6, 150.9], html: n => S(`<div class="eyebrow">Imagine a baker in Kampala</div><h2 style="margin-bottom:22px">Asking a chatbot for a message</h2>
<div style="display:flex;flex-direction:column;gap:14px">
${bubble('Write a short message to my customers about Sunday cake orders.', 'r')}
<div class="${on(n,3)} it">${bubble('<span class="eyebrow" style="font-size:18px;margin-bottom:4px;display:block">Reply 1 · example</span>Sunday cakes are now open for orders! Fresh, soft and baked just for your family. Reply today to reserve yours.')}</div>
<div class="${on(n,5)} it">${bubble('<span class="eyebrow" style="font-size:18px;margin-bottom:4px;display:block">Same question again · Reply 2</span>Planning a Sunday celebration? Order your cake with us today and we will have it ready, warm and beautiful.')}</div></div>
<p class="${on(n,2)}" style="font-size:34px;margin-top:20px;color:#57534e">No ready message is stored in a drawer. It writes one <b>word by word</b>, using patterns it learned.</p>
<p class="${on(n,4)}" style="font-size:34px;margin-top:8px;color:#5b21b6;font-weight:600">Ask the same thing again, and you get different words.</p>`) });

// 7 LLM name
slides.push({ start: 156.6, steps: [156.6, 160.0, 166.0, 171.0, 176.5, 181.0, 186.9], html: n => S(`<div class="eyebrow">A name you will hear again and again</div><h1 style="font-size:92px">Large language model <span class="${on(n,1)} it violet" style="font-size:70px">· LLM</span></h1>
<div class="grid3" style="margin-top:38px">
<div class="card ${on(n,2)}" style="min-height:250px"><div class="big" style="font-size:60px;color:#6d28d9">Large</div><div style="font-size:34px;margin-top:12px;line-height:1.3">A massive amount of text</div></div>
<div class="card ${on(n,3)}" style="min-height:250px"><div class="big" style="font-size:60px;color:#6d28d9">Language</div><div style="font-size:34px;margin-top:12px;line-height:1.3">It works with words</div></div>
<div class="card ${on(n,4)}" style="min-height:250px"><div class="big" style="font-size:60px;color:#6d28d9">Model</div><div style="font-size:34px;margin-top:12px;line-height:1.3">The name for the system</div></div></div>
<p class="${on(n,5)}" style="font-size:36px;margin-top:30px;color:#44403c">A system that learned from a massive amount of text, and works with words.</p>
<p class="${on(n,6)}" style="font-size:38px;margin-top:10px;color:#5b21b6;font-weight:600">It is the engine behind ChatGPT, Gemini and Claude.</p>`) });

// 8 chatbot vs LLM
slides.push({ start: 197.5, steps: [197.5, 199.5, 202.0, 204.3], html: n => S(`<div class="eyebrow">Two words, two things</div><h2>Chatbot, and LLM</h2>
<div class="grid2"><div class="card ${on(n,1)}" style="min-height:300px"><div style="font-size:80px">💬</div><div class="big" style="font-size:54px;margin-top:10px">Chatbot</div><div style="font-size:36px;margin-top:10px">The page you talk to</div></div>
<div class="card hl ${on(n,2)}" style="min-height:300px"><div style="font-size:80px">⚙️</div><div class="big" style="font-size:54px;margin-top:10px">LLM</div><div style="font-size:36px;margin-top:10px">The engine inside it</div></div></div>
<p class="${on(n,3)}" style="font-size:34px;margin-top:30px;color:#57534e">In this course I will usually say “chatbot”, and “LLM” when I mean the engine.</p>`) });

// 9 try it 1: phone keyboard
slides.push({ start: 211.0, steps: [211.0, 219.2, 225.8, 235.0, 244.1, 251.6, 256.0, 260.7], html: n => {
  const text = n < 3 ? '' : n <= 4 ? 'Good' : n === 5 ? 'Good morning' : n === 6 ? 'Good morning to' : 'Good morning to all';
  return S(`<div class="eyebrow">Your first try-it · do it with me</div><h2 style="margin-bottom:24px">What is the engine really doing?</h2>
<div style="display:grid;grid-template-columns:1fr 760px;gap:50px;align-items:start">
<div style="display:flex;flex-direction:column;gap:16px">
<div class="card row ${on(n,2)}" style="padding:18px 30px;font-size:36px"><span class="num" style="width:54px;height:54px;font-size:26px">1</span><span>Open any chat on your phone, such as a messaging app</span></div>
<div class="card row ${on(n,3)}" style="padding:18px 30px;font-size:36px"><span class="num" style="width:54px;height:54px;font-size:26px">2</span><span>Type the word <b>“Good”</b></span></div>
<div class="card row ${on(n,4)}" style="padding:18px 30px;font-size:36px"><span class="num" style="width:54px;height:54px;font-size:26px">3</span><span>Look at the <b>suggestions</b> above the keyboard</span></div>
<div class="card row ${on(n,5)}" style="padding:18px 30px;font-size:36px"><span class="num" style="width:54px;height:54px;font-size:26px">4</span><span>Tap the <b>middle one</b>, again and again</span></div>
<p class="${on(n,7)}" style="font-size:34px;color:#5b21b6;font-weight:600;margin-top:4px">It picks the next word, then the next, then the next. Sometimes it makes sense. Sometimes it is a little silly.</p></div>
<div style="border:10px solid #1c1917;border-radius:44px;background:#fff;padding:22px;box-shadow:0 30px 70px rgba(76,29,149,.2)">
<div style="font-size:24px;color:#78716c;text-align:center;margin-bottom:10px">Messaging app · example</div>
<div style="border:2px solid #e7e2da;border-radius:18px;padding:18px 22px;font-size:40px;min-height:78px;background:#faf8f5">${text}<span style="color:#6d28d9">|</span></div>
<div style="display:flex;gap:10px;margin-top:16px;opacity:${n>=4?1:0}">${(n >= 7 ? ['of', 'the', 'our'] : n >= 6 ? ['you', 'all', 'my'] : n >= 5 ? ['my', 'to', 'everyone'] : ['luck', 'morning', 'evening']).map((w,i)=>`<div style="flex:1;text-align:center;padding:14px 0;border-radius:14px;background:${i===1&&n>=5?'#ede9fe':'#f5f5f4'};font-size:32px;${i===1?'font-weight:700;color:#5b21b6':''}">${w}</div>`).join('')}</div>
<div style="height:200px;margin-top:16px;border-radius:18px;background:repeating-linear-gradient(90deg,#f5f5f4 0 58px,#fff 58px 66px);opacity:.9"></div></div></div>`);
} });

// 10 scale
slides.push({ start: 267.0, steps: [267.0, 273.9, 282.2, 287.5, 292.8], html: n => S(`<div class="eyebrow">Your phone is guessing the next word</div><h2 style="margin-bottom:22px">An LLM does the same thing, on a much bigger scale</h2>
<div class="card hl row" style="padding:22px 36px;font-size:42px"><span class="pill" style="font-size:34px">predict</span>the next word <span class="muted">→</span> then the next <span class="muted">→</span> and the next</div>
<div class="grid2" style="margin-top:28px">
<div class="card ${on(n,2)}" style="min-height:270px"><div class="pill amber">Your phone's suggestion</div><div style="font-size:36px;margin-top:18px;line-height:1.35">Looks at a few words.<br><span class="muted">A silly sentence.</span></div></div>
<div class="card hl ${on(n,3)}" style="min-height:270px"><div class="pill green">A large language model</div><div style="font-size:36px;margin-top:18px;line-height:1.35">Learned from a massive amount of text.<br><span class="${on(n,4)} it violet" style="font-weight:600">A whole polite message.</span></div></div></div>
<p class="${on(n,4)}" style="font-size:34px;margin-top:20px;color:#57534e">The more information it gets, the better it learns.</p>`) });

// 11 most important sentence
slides.push({ start: 298.4, steps: [298.4, 307.4, 312.3, 316.0, 319.0 - 0.01], html: n => S(`<div class="center"><div class="eyebrow">The most important sentence in this whole module</div>
<h1 class="it ${ON(n,1)}" style="font-size:104px;line-height:1.08;max-width:1700px">Sounding right is <span class="violet">not</span> the same as being right.</h1>
<div style="display:flex;gap:22px;margin-top:50px;flex-wrap:wrap"><span class="pill it ${ON(n,2)}" style="font-size:34px">It predicts what fits</span><span class="pill red it ${ON(n,3)}" style="font-size:34px">It does not check what is true</span></div>
<p class="it ${ON(n,4)}" style="font-size:44px;margin-top:34px;color:#44403c">So it can be wrong, and completely sure, at the same time.</p></div>`) });

// 12 student story
slides.push({ start: 319.0, steps: [319.0, 322.5, 326.2, 331.5, 337.6, 342.0, 345.8], html: n => S(`<div class="eyebrow">Why it matters for you</div><h2 style="margin-bottom:22px">A student asks a chatbot for a fact</h2>
<div style="display:flex;flex-direction:column;gap:14px">
<div class="${on(n,1)}">${bubble('What year did the railway reach Kampala?', 'r')}</div>
<div class="${on(n,2)}">${bubble('A clear, confident answer, in words that sound like a textbook.')}</div></div>
<div class="grid2" style="margin-top:22px;gap:18px"><div class="card ${on(n,3)}" style="padding:20px 28px"><div class="pill amber">What happened</div><div style="font-size:32px;margin-top:12px;line-height:1.3">The chatbot was only <b>predicting what fits</b>. It did not look in a textbook.</div></div>
<div class="card ${on(n,4)}" style="padding:20px 28px"><div class="pill red">The risk</div><div style="font-size:32px;margin-top:12px;line-height:1.3">The answer could be wrong, and nothing in the tone would warn you.</div></div></div>
<div class="${on(n,5)}" style="margin-top:22px"><span class="pill green" style="font-size:36px">You stay in charge, and you check it</span></div>
<p class="${on(n,6)}" style="font-size:30px;margin-top:12px;color:#57534e">We spend a whole module on how to check, later in the course.</p>`) });

// 13 try it 2
slides.push({ start: 354.0, steps: [354.0, 357.7, 363.0, 369.0, 372.5, 376.4, 384.6, 392.3, 397.2, 404.6], html: n => S(`<div class="eyebrow">Your second try-it · about 5 minutes</div><h2 style="margin-bottom:22px">See it create, fresh, every time</h2>
<div style="display:flex;flex-direction:column;gap:14px">
<div class="card row ${on(n,1)}" style="padding:16px 30px;font-size:34px"><span class="num" style="width:52px;height:52px;font-size:26px">1</span><span>Open a chatbot on your phone: ChatGPT, Gemini or Claude</span></div>
<div class="card hl ${on(n,2)}" style="padding:16px 30px"><div class="eyebrow" style="font-size:20px;margin-bottom:6px">Type this</div><div style="font-size:36px;line-height:1.3">Write a short message to my landlord asking for two more days to pay rent.</div></div>
<div class="card row ${on(n,3)}" style="padding:16px 30px;font-size:34px"><span class="num" style="width:52px;height:52px;font-size:26px">2</span><span>Read the answer. Then ask <b>the same thing again</b>.</span></div>
<div class="card row ${on(n,5)}" style="padding:16px 30px;font-size:34px"><span class="num" style="width:52px;height:52px;font-size:26px">3</span><span>Compare. What do you notice? <b class="violet">The words are different each time.</b></span></div></div>
<div class="card ${on(n,7)}" style="margin-top:16px;padding:16px 30px;border-style:dashed"><span class="pill amber" style="font-size:24px">Optional extra</span><span style="font-size:32px;margin-left:16px">Ask about a <b>book title you made up</b>. Does it invent details? A safe way to see “sounding right” and being wrong.</span></div>
<div class="${on(n,9)}" style="margin-top:16px"><span class="pill" style="font-size:34px">Pause the video and do both tasks now</span></div>`) });

// 14 quiz
const quiz = [['Face unlock on your phone', 'Traditional', 'it sorts: the owner, or not', 3, 4, 'green'], ['Writing a wedding speech for you', 'Generative', 'it creates new text', 5, 6, 'amber'], ['A spam filter', 'Traditional', 'it sorts', 7, 8, 'green'], ['Making a poster from a description', 'Generative', 'it creates a picture', 9, 10, 'amber']];
slides.push({ start: 413.9, steps: [413.9, 417.5, 421.9, 426.0, 429.0, 439.0, 442.0, 447.1, 449.5, 453.5, 458.6], html: n => S(`<div class="eyebrow">Welcome back · let us test ourselves</div><h2 style="margin-bottom:20px">Traditional, or generative?</h2>
<div style="display:flex;gap:20px;margin-bottom:22px"><span class="pill green ${on(n,1)}" style="font-size:30px">Traditional: sorts, scores or predicts</span><span class="pill amber ${on(n,2)}" style="font-size:30px">Generative: creates</span></div>
<div style="display:flex;flex-direction:column;gap:14px">${quiz.map(r=>`<div class="card row ${on(n,r[3]-0)}" style="padding:16px 34px;justify-content:space-between"><span style="font-size:36px;flex:1">${r[0]}</span><span class="pill ${r[5]} ${on(n,r[4])}" style="font-size:30px">${r[1]} · ${r[2]}</span></div>`).join('')}</div>`) });

// 15 module summary
slides.push({ start: 462.0, steps: [462.0, 467.4, 472.0, 474.3, 479.0, 482.9, 487.0], html: n => S(`<div class="eyebrow">Putting the whole module together</div><h2 style="margin-bottom:26px">AI is not magic</h2>
<p class="${on(n,1)}" style="font-size:44px;margin-bottom:26px;color:#5b21b6;font-weight:600">It is advanced pattern recognition.</p>
<div class="grid2"><div class="card ${on(n,2)}" style="min-height:240px"><div class="pill">Traditional AI</div><div style="font-size:40px;margin-top:18px;line-height:1.3">Finds patterns to <b>sort</b> things.</div></div>
<div class="card hl ${on(n,3)}" style="min-height:240px"><div class="pill">Generative AI</div><div style="font-size:40px;margin-top:18px;line-height:1.3">Uses patterns to <b>create</b> things.</div></div></div>
<p class="${on(n,4)}" style="font-size:38px;margin-top:26px;color:#44403c">And it can be wrong, and sound sure.</p>
<div class="${on(n,5)}" style="margin-top:14px"><span class="pill green" style="font-size:36px">So you stay in charge, and you check</span></div>
<p class="${on(n,6)}" style="font-size:36px;margin-top:18px;color:#57534e">You now have the foundation.</p>`) });

// 16 prompt
slides.push({ start: 489.5, steps: [489.5, 492.0, 502.1, 509.7, 516.4], html: n => S(`<div class="eyebrow">Your task · pause and try this prompt</div><h2 style="margin-bottom:24px">Do it once more, on your own</h2>
<div style="display:flex;flex-direction:column;gap:16px">
<div class="card row ${on(n,1)}" style="padding:18px 34px;font-size:36px"><span class="num">1</span><span>Type <b>“good”</b> in any chat and tap the middle suggestion several times</span></div>
<div class="card row ${on(n,2)}" style="padding:18px 34px;font-size:36px"><span class="num">2</span><span>Ask a chatbot: <b>“Write a short polite message to my landlord asking for two more days to pay rent.”</b></span></div>
<div class="card row ${on(n,3)}" style="padding:18px 34px;font-size:36px"><span class="num">3</span><span>Ask the same thing again, and <b>compare the two answers</b></span></div></div>
<p class="${on(n,4)}" style="font-size:32px;margin-top:22px;color:#57534e">We did this earlier, but you can redo it.</p>`) });

// 17 summary + next
slides.push({ start: 523.8, steps: [523.8, 529.0, 534.5, 542.4, 551.6], html: n => S(`<div class="eyebrow">Summary</div>
<h1 style="font-size:62px;max-width:1700px;line-height:1.15">Generative AI creates new text, pictures, code and audio by <span class="violet">predicting what fits</span>.</h1>
<p class="${on(n,1)}" style="font-size:42px;margin-top:30px;color:#44403c">So it can sound right and be wrong. You stay in charge, and you check.</p>
<div class="card hl ${on(n,2)}" style="margin-top:34px;padding:24px 36px"><span class="pill green" style="font-size:32px">Module 1 complete</span></div>
<p class="${on(n,3)}" style="font-size:38px;margin-top:26px;color:#57534e"><b>Module 2:</b> pick a tool, get set up, and learn how to talk to AI so you get answers you can use.</p>
<p class="${on(n,4)}" style="font-size:34px;margin-top:10px;color:#5b21b6;font-weight:600">See you in Module 2.</p>`) });

await render({ FF, CHROME: process.env.CHROME, AUDIO, OUT, TOTAL, slides, dir: process.env.FRAMES || 'frames-m1-l5' });
