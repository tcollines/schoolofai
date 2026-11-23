// Live class 2 of 2 (Friday, 2:00-4:00 pm EAT): Module 4 + Module 5 + Module 6.
// Built from the Module 4 slides of lecture-2 and lecture-3 (Modules 5 and 6).
import { E, list, plain, slide, prompt, ask, demo, act, pills, center, keywords, table } from './helpers.mjs';
import l2 from './lecture-2.mjs';
import l3 from './lecture-3.mjs';
const S = [];
const n3 = l3.slides.length;

S.push(center('Live class 2 of 2 · Friday', 'When AI gets it wrong,<br><span class="violet">fair and private, and using AI responsibly</span>', 'Modules 4, 5 and 6', 'Hallucinations and fact-checking · Bias and privacy · Green, amber, red · Your 30-day plan'));

S.push('<!--compact-->' + slide('Welcome back', 'Where we are', `<p class="lead">In Class 1 we learnt what AI is, how to ask it clearly, and four everyday jobs: <b>brainstorm, draft, summarise, automate</b>.</p><div style="height:24px"></div>` + plain([
    '<b>First, Module 4:</b> what happens when AI gets it wrong, and <b>how to fact-check</b>.',
    '<b>Then, Module 5:</b> two limits of AI that depend on us: <b>bias</b> and <b>privacy</b>.',
    '<b>Last, Module 6:</b> one simple guide, <b>green, amber, red</b>, and your own <b>30-day plan</b>.',
    'This is the last class. After it: the module quizzes, the final assessment, and your <b>certificate</b>.'])));

for (let i = 15; i <= 22; i++) S.push(l2.slides[i]); // Module 4

S.push(`<div class="center" style="text-align:center">${E('Short break')}<h1>Five minutes<br><span class="violet">Stretch, drink water, come back</span></h1><p class="lead" style="margin-top:40px">After the break: <b>Module 5</b> (bias and privacy) and <b>Module 6</b> (using AI responsibly).</p></div>`);

for (let i = 2; i <= n3 - 3; i++) S.push(l3.slides[i]); // Module 5, Module 6 up to the 30-day plan

S.push(slide('What we covered', 'Today in one minute', `<div class="grid3"><div class="card"><h3>Module 4</h3><p>AI predicts what sounds likely, so it can be <b class="red">sure and wrong</b>. <b>Mark the claims, check outside, open the sources.</b></p></div><div class="card"><h3>Module 5</h3><p>AI copies patterns, including <b>unfair</b> ones. Keep <b>personal information</b> out of public tools. <b>Describe the problem, not the person.</b></p></div><div class="card"><h3>Module 6</h3><p><b>Green, amber, red.</b> Stay the <b>human in the loop</b>. Use it. Check it. Protect people.</p></div></div>`));

S.push(l3.slides[n3 - 2]); // what comes next
S.push(l3.slides[n3 - 1]); // thank you

export default { file: 'Live-class-2-Friday-Modules-4-to-6', title: 'Live class 2 · Modules 4, 5 and 6', short: 'AI Fundamentals', part: 'Live class 2 of 2 · Friday', slides: S };
