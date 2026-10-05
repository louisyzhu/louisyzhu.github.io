/* ask.js, the resident assistant
   A hand-built retrieval Q&A, fully client-side: a curated knowledge
   base and a keyword scorer. It answers only from what it knows and
   says so when it doesn't. No API, no key, no hallucination.
   (README documents the optional Cloudflare Worker + LLM upgrade.) */

(function () {
  'use strict';

  var log = document.getElementById('chat-log');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-in');
  var chips = document.getElementById('chat-chips');
  if (!log || !form) return;

  var EMAIL = 'yiven.zhu@oii.ox.ac.uk';

  /* Set this to your deployed Cloudflare Worker URL (see worker.js) and
     the chat upgrades itself from the local matcher to a real language
     model, grounded in the same facts. Empty string = local matcher. */
  var LLM_ENDPOINT = '';

  /* -- knowledge ------------------------------------------------------ */
  var KB = [
    { k: 'research study work topic focus what do does interest area science evaluation',
      a: 'Louis works on the science of AI evaluation, treating benchmarks as measurement instruments and asking whether a score can be trusted, what it measures, what it predicts beyond the test and when a decision should rely on it. He works quantitatively, with psychometric models, statistical learning and economics.' },
    { k: 'question questions four layers trust measure predict decide programme program arc',
      a: 'Four questions organise the work. Q1, can the score be trusted? Q2, what does the score measure? Q3, what does it predict outside the evaluation? Q4, when should a decision rely on it? Each paper on the site is tagged with the question it serves.' },
    { k: 'next direction thesis dissertation msc plan predictive validity deployment professional interactive tool agentic',
      a: 'For doctoral study from 2027, he asks whether evaluation results predict how systems perform once deployed, particularly in interactive and agentic settings. The study design is still being developed with supervisors, so the site does not describe it in detail.' },
    { k: 'method methods statistics stats skills irt technical tools quantitative psychometric',
      a: 'He works quantitatively, with psychometric models (factor analysis, item response theory, reliability), statistical learning (nested cross-validation, held-out prediction) and economics (price indices, panel data), in Python, R and Stata. He builds evaluation pipelines that run and probe models and has implemented language models in PyTorch.' },
    { k: 'oxford oii msc masters degree study studying university current student',
      a: 'He is an MSc student at the Oxford Internet Institute, University of Oxford (2026 to 2027), at St Antony’s College, and the elected MSc Student Representative for 2026 to 2027.' },
    { k: 'ucl undergraduate bsc bachelor sts science technology studies degree',
      a: 'He read Science & Technology Studies at UCL (2023 to 2026), graduating with first-class honours, ranked first in the department’s cohort, with the Peter Medawar Prize and the STS Best Dissertation Prize.' },
    { k: 'london economics finance second degree lse achievement marks',
      a: 'He also read the BSc Economics and Finance with the University of London, under the academic direction of LSE (2023 to 2026, weighted average 92% to date). He received a University of London Award for Academic Achievement in 2026 as one of the best performers on the degree, and the highest mark of all candidates in Principles of Asset Pricing and Principles of Corporate Finance.' },
    { k: 'phd doctorate doctoral future plan 2027',
      a: 'He is preparing for doctoral study from 2027, on when evaluation evidence transfers across changes in task, interaction and system context.' },
    { k: 'cv where resume curriculum vitae pdf download',
      a: 'His CV (October 2026) is linked at the top of the page, at louisyzhu.github.io/Louis_Zhu_CV_Oct2026.pdf.' },
    { k: 'publication paper papers published wrote writing research output selected preprints',
      a: 'His five sole-authored 2026 preprints apply psychometric and statistical models to benchmark structure and repair history, LLM-judge reliability, quality-adjusted inference prices and undisclosed change in frontier safety frameworks. Two are accepted at NeurIPS 2026 workshops and one is under review at ICLR 2027, and the analysis layer behind three of them is published as the benchprobe library. Every paper is listed in the research section with its status.' },
    { k: 'under review reviewed submitted pending status currently',
      a: 'Two papers are under review. "One Capability or Many?" is under review at ICLR 2027, and "Who Makes the Future of Work?", with Joanna Octavia, is under review at the International Labour Review.' },
    { k: 'accepted accept acceptance journal workshops',
      a: 'Three papers are accepted. "The Price of Intelligence" at the NeurIPS 2026 EconML workshop, "A Score Should Travel With Its Repair History" at the NeurIPS 2026 workshop on AI for Meta-Science, and "Neural Evidence and Behavioural Welfare Economics" at the UCL Journal of Economics, now in proof.' },
    { k: 'capability factor benchmark battery economic validity one many structural predictive iclr',
      a: '"One Capability or Many? Structural and Predictive Tests of Benchmark Validity Disagree about Economic Benchmarks for Frontier AI" asks whether economically framed benchmarks measure a distinct capability, across 421 model configurations and twelve benchmarks. Under the pre-specified dimensionality rule they form no distinct factor. Under linear learners, a multi-factor representation of the other benchmarks still predicts held-out economic scores better than a mean-score index, and the advantage reverses for tree learners. Preprint arXiv 2608.29420 (v2), under review at ICLR 2027; hypotheses pre-specified, analysis plan deposited retrospectively on OSF.' },
    { k: 'price intelligence index inference cost hedonic econml',
      a: '"The Price of Intelligence" builds a quality-adjusted price index for AI inference on an IRT-estimated capability scale, and audits that scale before relying on it. Quality-adjusted inference prices fell several times faster than matched-model methods record. It is accepted at the NeurIPS 2026 EconML workshop, with a journal version in preparation for the Review of Income and Wealth. The validity audit is pre-registered on OSF, and the dataset is on Zenodo and Hugging Face.' },
    { k: 'repair history score travel stewardship meta science peer review norms position mmlu',
      a: '"A Score Should Travel With Its Repair History" is a position paper, accepted at the NeurIPS 2026 workshop on AI for Meta-Science. It argues from the lifecycle of MMLU that a benchmark score should travel with its repair history, meaning which errors were found, which were repaired, and which version a reported model was evaluated on. A full version is in preparation for the ICML 2027 Position Paper Track; the preprint is on SocArXiv.' },
    { k: 'silent revision safety framework frameworks disclosure undisclosed developers corpus commitments',
      a: '"Silent Revision" builds a versioned, hash-pinned corpus of the safety frameworks published by twelve frontier AI developers and measures how much of each revision the developer’s own account discloses. Under the strict criterion, 67% of material changes went undisclosed (95% interval 62% to 72%), across 710 commitment instances. Preprint arXiv 2609.08789, with a full version in preparation for ACM FAccT 2027; corpus and code on Zenodo.' },
    { k: 'judge judges llm ctt classical test theory reliability mislead',
      a: '"Three Ways Classical Test Theory Can Mislead About LLM Judges" examines when reliability statistics answer the wrong question in LLM-judge pipelines, with an empirical item bank and simulation studies. Preprint arXiv 2609.29709, with a full version in preparation for NeurIPS 2027 Evaluations and Datasets; code on GitHub.' },
    { k: 'chi advisor voting teammate agent group simulation abm',
      a: '"From Advisor to Voting Teammate" is a workshop paper at the Workshop on Human-Agent Collaboration, CHI 2026, with Tian, Zhang and colleagues at UCL Computer Science. It studies how an AI agent’s institutional role and access to information affect group decisions, in an agent-based simulation of 1.1 million runs.' },
    { k: 'evaleval coalition hugging face standards science evaluation every agent ever',
      a: 'With the EvalEval Coalition (Hugging Face, Edinburgh, EleutherAI) he is a core contributor to "The Science of Evaluation", in preparation for TMLR, contributing the treatment of validity and evidentiary standards. He also contributes to Every Agent Ever, the coalition’s reporting schema for agent evaluation runs.' },
    { k: 'benchprobe tool package library software psychometrics toolkit code released',
      a: 'benchprobe is his Python psychometrics library for AI benchmark scores, v0.1.0 under MIT. It covers reliability, factor structure, predictive validity and item-response scaling, and is validated by reproducing the published numbers of three studies from hash-pinned data, with 44 acceptance tests and an independent cross-family review. Repository github.com/louisyzhu/benchprobe, DOI 10.5281/zenodo.22705351.' },
    { k: 'mmlu dissertation validity argument harness unassembled',
      a: 'His BSc dissertation, "The Unassembled Validity Argument", follows MMLU through six years of construction, repair and re-scoring, showing how harness-dependent instability propagates into the leaderboards and capability claims built on the score. It won the STS Best Dissertation Prize, and the repair-history position paper derives from it.' },
    { k: 'neural neuroeconomics welfare brain data policy behavioural',
      a: '"Neural Evidence and Behavioural Welfare Economics: When Can Neuroeconomics Inform Policy?" is accepted at the UCL Journal of Economics, vol. 5, no. 1, now in proof (doi 10.14324/111.444.2755-0877.2257). An earlier version is on arXiv. It sits outside his evaluation programme.' },
    { k: 'future work hidden labour labor octavia ilo international labour review',
      a: '"Who Makes the Future of Work? Measurement, Hidden Labour and the Evidence on Artificial Intelligence", with Dr Joanna Octavia, is under review at the International Labour Review, with a preprint on SSRN. It grew out of a UCL MAPS-funded summer research internship and sits outside the evaluation programme.' },
    { k: 'wage wages automation exposure panel occupation ashe ons labour market',
      a: '"Automation Exposure and the UK Labour Market: Employment, Pay and the Wage Floor, 2014 to 2020" is an SSRN working paper (v2). It is a descriptive occupation-year panel of ONS risk scores and ASHE occupation-level wages with two-way fixed effects, outside his evaluation programme; code on GitHub.' },
    { k: 'disclosure signalling signal capital markets sec act firms regulation mandatory explore econ',
      a: '"Mandatory AI-Risk Disclosure as a Signalling Device in Capital Markets" was shortlisted and presented at Explore Econ 2025 at UCL. If firms must disclose AI risk, disclosure becomes a signal, and audits, costs and penalties become a game, under the EU AI Act and the SEC’s proposed rules.' },
    { k: 'relit eth zurich ash citation audit research assistant law economics',
      a: 'Louis is a research assistant to Prof Elliott Ash at the Center for Law & Economics, ETH Zurich, working on LLM tools that audit citations in economics research. He audits the evaluation and data layers of Relit (relit.ink), the group’s LLM pipeline that checks economics manuscripts against the literature they cite, through code review and data-source analysis reported as issues and commits to the group’s codebase.' },
    { k: 'captcha xai cognitive load trust dormant earlier holistic',
      a: 'Two earlier projects are dormant, adversarial CAPTCHAs that humans pass and AI agents fail (UCL Computer Science and Holistic AI), and a study of cognitive load, XAI and trust in human-AI teams (UCL Computer Science), whose design is complete.' },
    { k: 'experience job worked roles history employment',
      a: 'Recent roles include a research project on benchmark measurement at LSE Statistics (mentors Dr Marcos Barreto and Dr Thomas Robinson), core contributor with the EvalEval Coalition, research on human-agent collaboration at UCL Computer Science, research assistant to Prof Elliott Ash at ETH Zurich, and AI research with Holistic AI. Earlier, a UCL MAPS summer research internship, a wage-panel project at UCL Economics, and the Institute of Economic Affairs.' },
    { k: 'teach teaching module course ucl associate labour',
      a: 'As a Departmental Associate he led the design of a new UCL module for 2026/27 on AI, automation, platform labour and the future of work, a 280-hour funded UCL MAPS commission. He was also a teaching assistant on UCL’s Responsible Innovation and Governance of Emerging Technologies courses.' },
    { k: 'talk talks conference presented presentation speaking cambridge leverhulme',
      a: 'He gives an invited talk on "One Capability or Many?" at a Leverhulme CFI lab meeting in Cambridge on 29 October 2026. Earlier, a paper presentation at the CHI 2026 Workshop on Human-Agent Collaboration, an invitation to present the MMLU work at the UCL Centre for Responsible Innovation, and Explore Econ 2025 at UCL.' },
    { k: 'reviewer reviewing service invited referee',
      a: 'He is an Invited Reviewer for three NeurIPS 2026 workshops, Trust-AI-Eval (TAE), EconML and JUDGe.' },
    { k: 'representative rep society societies leadership fellow roles',
      a: 'He is the elected MSc Student Representative at the Oxford Internet Institute (2026 to 2027), a Fellow of Thinking About Thinking, Director of Engagement at AI for Good Oxford and Sponsorship Lead at the Oxford Artificial Intelligence Society. At UCL he was President of the Political Science & Economy Society and Chairman of the Investment Society.' },
    { k: 'award prize won recognition medawar proctor honours',
      a: 'Peter Medawar Prize (UCL Science & Technology Studies, top-ranked graduate across the three-year BSc), STS Best Dissertation Prize, first in the departmental cohort, the University of London Award for Academic Achievement 2026, the highest mark of all candidates in two University of London papers, and the Joan Beauchamp Proctor Prize for top Year 2 performance.' },
    { k: 'hobby hobbies fun free time hockey ski skiing piano music sport',
      a: 'Off the desk, ice hockey, alpine ski racing, and piano.' },
    { k: 'language languages speak chinese cantonese mandarin french english',
      a: 'English, Cantonese and Mandarin, plus conversational French.' },
    { k: 'contact email reach write message touch hire collaborate',
      a: 'Email him at ' + EMAIL + ', or use the button in the contact section. Data, code and analysis plans are linked from each paper.' },
    { k: 'linkedin github scholar orcid profile links social',
      a: 'All linked at the top of the page, LinkedIn (linkedin.com/in/yiven-z), Google Scholar, GitHub (github.com/louisyzhu) and ORCID.' },
    { k: 'landscape terrain frontier banner animation ascii art top page what is 3d illustration',
      a: 'The banner is a generative illustration, a three-dimensional ASCII landscape drawn in typed characters. It encodes no data; the benchmark names are labels on an imaginary terrain. Hover deforms the surface, drag to orbit it through a full 360 degrees, and click to send a pulse. Hand-written JavaScript, no libraries.' },
    { k: 'who you bot assistant this chat are real ai gpt model',
      a: 'I’m a small hand-built assistant, not a language model. There is no API behind me, just this page’s facts and a keyword matcher. Whatever I can’t answer, Louis can, at ' + EMAIL + '.' },
    { k: 'name yiven pronounce louis called',
      a: 'Louis Yiven Zhu, Louis to colleagues.' },
    { k: 'where live location based city oxford london',
      a: 'Oxford, UK, for the MSc at the Oxford Internet Institute; before that, London.' }
  ];

  KB.forEach(function (e) { e.keys = e.k.split(' '); });

  var FALLBACK = 'That one’s beyond what this page knows, since I only answer from what’s here. For anything else, ' + EMAIL + ' reaches the person himself.';

  function answer(q) {
    var words = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length > 2 || w === 'cv'; })
      .map(function (w) { return w.length > 3 && w.slice(-1) === 's' ? w.slice(0, -1) : w; });
    var best = null, bestScore = 0, bestStrong = false;
    KB.forEach(function (e) {
      var s = 0, strong = false;
      words.forEach(function (w) {
        e.keys.forEach(function (k) {
          var kk = k.length > 3 && k.slice(-1) === 's' ? k.slice(0, -1) : k;
          if (kk === w) {
            s += kk.length;
            if (kk.length >= 5) strong = true;   /* one specific word suffices */
          } else if (kk.length > 4 && (kk.indexOf(w) === 0 || w.indexOf(kk) === 0)) {
            s += Math.max(3, kk.length - 2);
          }
        });
      });
      if (s > bestScore) { bestScore = s; best = e; bestStrong = strong; }
    });
    /* generic words ("what", "who") must not carry a match alone, but a
       single specific word ("email", "award", "benchprobe") should */
    return best && (bestScore >= 6 || bestStrong) ? best.a : FALLBACK;
  }

  /* -- rendering ------------------------------------------------------ */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var typing = 0;

  function bubble(who, text, type) {
    var row = document.createElement('div');
    row.className = 'msg ' + (who === 'you' ? 'is-you' : 'is-bot');
    var tag = document.createElement('span');
    tag.className = 'msg-tag';
    tag.textContent = who;
    var body = document.createElement('p');
    body.className = 'msg-body';
    row.appendChild(tag);
    row.appendChild(body);
    log.appendChild(row);

    if (type && !reduce) {
      var i = 0, my = ++typing;
      (function tick() {
        if (my !== typing) { body.textContent = text; return; }
        body.textContent = text.slice(0, ++i);
        log.scrollTop = log.scrollHeight;
        if (i < text.length) setTimeout(tick, 9);
      }());
    } else {
      body.textContent = text;
    }
    log.scrollTop = log.scrollHeight;
  }

  function ask(q) {
    q = q.trim();
    if (!q) return;
    bubble('you', q, false);

    if (!LLM_ENDPOINT) {
      var a = answer(q);
      setTimeout(function () { bubble('lz', a, true); }, reduce ? 0 : 260);
      return;
    }

    /* real model behind a private relay; local matcher is the fallback */
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctl && setTimeout(function () { ctl.abort(); }, 8000);
    fetch(LLM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
      signal: ctl ? ctl.signal : undefined
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        clearTimeout(timer);
        bubble('lz', (d && d.answer) ? d.answer : answer(q), true);
      })
      .catch(function () {
        clearTimeout(timer);
        bubble('lz', answer(q), true);
      });
  }


  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ask(input.value);
    input.value = '';
    input.focus();
  });

  if (chips) {
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      ask(b.textContent);
    });
  }

  bubble('lz', 'Ask me about Louis, his research, experience and papers, or anything on this page.', false);
}());
