// Live class 1 of 2 (Wednesday, 2:00-4:00 pm EAT): Welcome + Module 1 + Module 2 + Module 3.
// Built from lecture-1 (welcome, Modules 1 and 2) and the Module 3 slides of lecture-2.
import { E, list, plain, slide, prompt, ask, demo, act, pills, center, keywords, table } from './helpers.mjs';
import l1 from './lecture-1.mjs';
import l2 from './lecture-2.mjs';
const C = '<!--compact-->';
const S = [];

S.push(center('Live class 1 of 2 · Wednesday', 'AI Fundamentals:<br><span class="violet">Use AI with Confidence</span>', 'Welcome, and Modules 1, 2 and 3', 'What AI really is · How to talk to AI · Make AI work for you'));
S.push(l1.slides[1]); // welcome

S.push(slide('How the live classes work', 'Two classes, three modules each', table(['Class', 'When', 'Modules'], [
    ['<b>Class 1</b> · today', 'Wednesday, 2:00 pm EAT', '<b>1, 2 and 3</b>: What AI really is · How to talk to AI · Make AI work for you'],
    ['<b>Class 2</b>', 'Friday, 2:00 pm EAT', '<b>4, 5 and 6</b>: When AI gets it wrong · Fair and private · Using AI responsibly']]), 'Six modules, two classes. Come to both and you have seen the whole course. Each class is about two hours, with a short break.'));

S.push(l1.slides[3]); // how the course and certificate work
for (let i = 4; i <= 22; i++) S.push(l1.slides[i]); // Module 1 and Module 2

S.push(`<div class="center" style="text-align:center">${E('Short break')}<h1>Five minutes<br><span class="violet">Stretch, drink water, come back</span></h1><p class="lead" style="margin-top:40px">After the break: <b>Module 3</b>, where AI starts doing real work for you.</p></div>`);

S.push(slide('Welcome back', 'Where we are', `<p class="lead">So far we learnt what AI is, and how to ask it clearly: <b>context, task, format</b>.</p><div style="height:24px"></div>` + plain([
    '<b>Now, Module 3:</b> put AI to work on four everyday jobs. <b>Brainstorm, draft, summarise, automate.</b>',
    '<b>Friday, Class 2:</b> Modules 4, 5 and 6. When AI gets it wrong, fair and private, and using AI responsibly.'])));

for (let i = 2; i <= 14; i++) S.push(l2.slides[i]); // Module 3

S.push(slide('What we covered, and what is next', 'Today in one minute', `<div class="grid3"><div class="card"><h3>Module 1</h3><p>AI does jobs that need human thinking. Machine learning learns from <b>examples</b>. Generative AI <b>creates</b>. <b class="red">Sounding right is not being right</b>.</p></div><div class="card"><h3>Module 2</h3><p>Pick one tool. Ask with <b>context, task and format</b>. <b>Refine</b>, do not restart. Keep private details out.</p></div><div class="card"><h3>Module 3</h3><p><b>Brainstorm, draft, summarise, automate.</b> AI drafts, you decide. Never send the first draft. Test a formula on one row.</p></div></div><p class="note"><b>Next steps:</b> take the quizzes for Modules 1, 2 and 3 (the lessons already count because you came to class), install the app, and join <b>Class 2 on Friday, 2:00 pm</b>: Modules 4, 5 and 6.</p>`));

S.push(`<div class="center" style="text-align:center">${E('Questions · Thank you')}<h1>Questions?<br><span class="violet">Thank you for learning with us</span></h1><p class="lead" style="margin-top:40px">Ask now, or in the Q&amp;A tab under any lesson. See you on Friday at 2:00 pm.</p><p class="sub" style="margin-top:18px">Tell your friends and family: the course is <b>free</b>. Use it. Check it. Protect people.</p></div>`);

export default { file: 'Live-class-1-Wednesday-Modules-1-to-3', title: 'Live class 1 · Welcome, Modules 1, 2 and 3', short: 'AI Fundamentals', part: 'Live class 1 of 2 · Wednesday', slides: S };
