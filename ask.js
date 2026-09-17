/* ask.js — the resident assistant
   A hand-built retrieval Q&A, fully client-side: a curated knowledge
   base and a keyword scorer. It answers only from what it knows and
   says so when it doesn't — no API, no key, no hallucination.
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
      a: 'Louis works on the science of AI evaluation, asking what benchmark scores measure, when they predict performance beyond the test, and what decisions the evidence can support. He draws on psychometrics, the statistics of human testing, alongside statistical modelling and economics, with a growing interest in evaluations of interactive and tool-using systems.' },
    { k: 'question questions four layers trust measure predict decide programme program arc',
      a: 'Four questions organise the work. Q1, can the score be trusted (judges, harness stability)? Q2, what does the score measure? Q3, what does it predict outside the evaluation? Q4, when should a decision rely on it? Each paper on the site is tagged with the question it serves.' },
    { k: 'next direction thesis dissertation msc plan predictive validity deployment professional interactive tool agentic',
      a: 'His next study asks whether pre-deployment evaluations predict independently assessed task performance outside the original test conditions. Professional work is one possible setting, and he is particularly interested in what changes when tools, interaction and human judgement become part of the system being evaluated. The design is still being developed with supervisors, so the site does not describe it in detail.' },
    { k: 'oxford oii msc masters degree study studying university current incoming',
      a: 'He is an MSc student at the Oxford Internet Institute, University of Oxford (2026–27), at St Antony’s College.' },
    { k: 'ucl undergraduate bsc bachelor sts science technology studies degree',
      a: 'He read Science & Technology Studies at UCL (2023–26), graduating with first-class honours, ranked first in the department’s cohort.' },
    { k: 'phd doctorate doctoral future plan 2027',
      a: 'He is preparing for doctoral study from 2027, on when evaluation evidence transfers across changes in task, interaction and system context.' },
    { k: 'publication paper papers published wrote writing research output selected',
      a: 'His selected work is "One Capability or Many?" (under review at ICLR 2027, arXiv preprint), "The Price of Intelligence" and "Silent Revision" (arXiv preprints, under review at NeurIPS 2026 workshops), "Three Ways Classical Test Theory Misleads for LLM Judges" (under review, JUDGe workshop), "From Advisor to Voting Teammate" (a CHI 2026 workshop paper) and the EvalEval Coalition’s "Science of Evaluations" (in preparation). His first journal article, on neural evidence and welfare economics, is accepted at the UCL Journal of Economics. Further work, other research outside the evaluation programme, and dormant projects are listed separately in the research section, each with its status.' },
    { k: 'price intelligence index inference cost hedonic',
      a: '"The Price of Intelligence" constructs a quality-adjusted price index for AI inference from public data, with 21,024 posted-price observations across 3,208 models and 86 providers over 31 months, joined to benchmark scores through a latent quality index. 87% of the decline in the price of capability is invisible to standard matched-model methods, and excluding contamination-flagged benchmarks leaves rankings intact at 0.998 while moving the index by 0.49 log points a year. Pre-registered validity audit on OSF; under review at the NeurIPS 2026 EconML workshop, with a full version in preparation for FAccT 2027. Preprint arXiv 2608.29843; dataset on Zenodo and Hugging Face.' },
    { k: 'capability factor benchmark battery economic validity one many incremental',
      a: '"One Capability or Many? Structural and Predictive Tests of Benchmark Validity Disagree About Economic Benchmarks for Frontier AI" examines whether economically framed benchmarks measure a distinct capability, across 421 model configurations and a twelve-benchmark battery. Under a pre-specified dimensionality rule they form no distinct factor, yet a multi-factor model predicts held-out economic scores better than a single general index (pooled ΔMSE 0.037, 95% interval [0.019, 0.055]), so the two tests disagree, and that is the finding. Pre-specified hypotheses with the analysis plan deposited retrospectively on OSF. Under review at ICLR 2027, with the workshop version under review at the NeurIPS 2026 TAE workshop; mentored by Dr Marcos Barreto and Dr Thomas Robinson at LSE Statistics. Preprint arXiv 2608.29420; code and data on GitHub.' },
    { k: 'mmlu dissertation validity argument harness unassembled',
      a: 'His BSc dissertation, "The Unassembled Validity Argument", follows MMLU through six years of construction, repair and re-scoring. Its contribution is that harness-dependent instability propagates into the leaderboards and capability claims built on the score. It won the STS Best Dissertation Prize; a manuscript is in preparation.' },
    { k: 'judge judges llm ctt classical test theory reliability',
      a: '"Three Ways Classical Test Theory Misleads for LLM Judges" examines when reliability statistics answer the wrong question in LLM-judge pipelines, with an empirical item bank and simulation studies. Under review at the NeurIPS 2026 workshop on reliable evaluation (JUDGe), with a full version in preparation for NeurIPS 2027 Evaluations and Datasets. The paper and the code are linked from the research section.' },
    { k: 'chi advisor voting teammate agent group simulation abm',
      a: '"From Advisor to Voting Teammate" is a workshop paper at the Workshop on Human-Agent Collaboration, CHI 2026, co-authored with Tian, Zhang and colleagues at UCL Computer Science. It studies how an AI agent’s institutional role and access to information affect group decisions, in an agent-based simulation of 1.1 million runs. The title in the research section links to the PDF.' },
    { k: 'silent revision safety framework frameworks disclosure undisclosed developers corpus commitments',
      a: '"Silent Revision" measures how much of their safety-framework revisions frontier AI developers actually disclose. It builds a versioned, hash-pinned corpus of every public version of the twelve frontier safety frameworks and traces 710 commitment instances across consecutive versions. Two-thirds of material change (67%, 95% interval 62 to 72) is not identifiable from the developer’s own account, and weakening changes are more often undisclosed than strengthening ones. Preprint arXiv 2609.08789, under review at the NeurIPS 2026 AI & Science workshop (AISciK) with a full version in preparation for FAccT 2027; corpus and code on Zenodo and GitHub.' },
    { k: 'repair history score travel stewardship meta science peer review norms',
      a: '"A Score Should Travel With Its Repair History" is a position paper. Benchmarks adjudicate the way peer review does, without its stewardship, so scores should carry their repair history with them. One manuscript, derived from his MMLU dissertation, under review at two NeurIPS 2026 workshops (AI for Meta-Science, and AI & Science, AISciK), with a full version in preparation for the ICML 2027 Position Paper Track. Preprint at doi.org/10.31235/osf.io/7bg8r_v1.' },
    { k: 'evaleval coalition hugging face standards science evaluations',
      a: 'With the EvalEval Coalition (Hugging Face, Edinburgh, EleutherAI) he is a core contributor to the "Science of Evaluations" paper, a collaborative account of open problems in AI evaluation in preparation for TMLR. He contributes the sections on validity and the evidence needed to support evaluation claims, and he also contributes to Every Agent Ever, the coalition's shared schema for reporting, storing and analysing agent evaluation runs.' },
    { k: 'benchprobe tool package library software psychometrics toolkit code released',
      a: 'benchprobe is his Python psychometrics library for AI benchmark scores, released as v0.1.0 under MIT on 11 September 2026. It covers reliability and grader agreement, factor structure controlled for release date, leave-one-benchmark-out predictive validity and item-response scaling with anchor linking, on any model by benchmark matrix. Every estimator is validated by reproducing the published numbers of three studies from hash-pinned data, with 44 acceptance tests, a per-number reproducibility ledger and an independent cross-family review on record. Building it surfaced three corrections to his own published archives, all documented. Repository github.com/louisyzhu/benchprobe, DOI 10.5281/zenodo.22705351.' },
    { k: 'neural neuroeconomics welfare brain data policy',
      a: '"Neural Evidence and Behavioural Welfare Economics: When Can Neuroeconomics Inform Policy?" is his journal article, accepted and in production at the UCL Journal of Economics, doi 10.14324/111.444.2755-0877.2257 (the revised article is forthcoming at the DOI). It is a critical framework for when neural evidence should count in behavioural welfare economics, outside his evaluation programme.' },
    { k: 'wage wages automation risk panel occupation ashe ons',
      a: '"Automation Exposure and the UK Labour Market: Employment, Pay and the Wage Floor, 2014 to 2020" asks how real wages evolved in occupations scored as high automation risk, in a descriptive occupation-year panel of ONS risk scores and ASHE occupation-level wages with two-way fixed effects. An SSRN working paper, now at v2, outside his evaluation programme; code on GitHub.' },
    { k: 'disclosure signalling signal capital markets sec act firms regulation mandatory',
      a: '"Mandatory AI-Risk Disclosure as a Signalling Device in Capital Markets" is a conference paper, shortlisted and presented at Explore Econ 2025 at UCL. If firms must disclose AI risk, disclosure becomes a signal, analysed as a game of audits, costs and penalties under the EU AI Act and the SEC’s proposed rules. The paper is on SSRN.' },
    { k: 'future work hidden labour labor octavia measurement evidence',
      a: '"Who Makes the Future of Work? Measurement, Hidden Labour and the Evidence on AI" is a review article with Dr Joanna Octavia at UCL (Louis first author), funded by the UCL MAPS Summer Research Internship scheme and built from a systematic review of 81 sources. The first draft is complete, for submission to the International Labour Review. It is a branch on AI and work, not part of the evaluation programme, and asks who gets counted in the evidence base behind claims about AI and work.' },
    { k: 'captcha xai cognitive load trust dormant earlier holistic',
      a: 'Two earlier projects are dormant, adversarial CAPTCHAs that humans pass and AI agents fail (UCL Computer Science and Holistic AI), and a study of cognitive load, XAI and trust in human–AI teams (UCL Computer Science), whose design is complete.' },
    { k: 'relit eth zurich ash legal nlp benchmark perturbation',
      a: 'Relit (relit.ink) is an LLM-based tool from Prof Elliott Ash's group at ETH Zurich that audits whether a paper's claims are supported by and cited to the economics literature. Louis is a research contributor on its benchmark workstream, mapping and clearing benchmark issues, running the build, audit and score cycle for perturbation testing and assessing annotator-agreement indices, in a large Python codebase under a full test suite and stated invariants.' },
    { k: 'experience job worked roles history employment',
      a: 'Recent roles include a research project on benchmark measurement at LSE Statistics (mentors Dr Marcos Barreto and Dr Thomas Robinson), core contributor with the EvalEval Coalition, research contributor on Relit at ETH Zurich (with Prof Elliott Ash), Departmental Associate and summer research intern at UCL STS (designing a module on AI and work, May to September 2026), and earlier work with Holistic AI, UCL Computer Science, the Institute of Economic Affairs and the UCL Institute for Global Prosperity. Details in the experience section.' },
    { k: 'teach teaching module course ucl associate labour',
      a: 'He designed a new UCL undergraduate module on AI, automation and platform labour from the evidence base up, as a Departmental Associate in a funded UCL MAPS commission, and was a teaching assistant on UCL’s Responsible Innovation and Governance of Emerging Technologies courses.' },
    { k: 'award prize won recognition medawar proctor honours',
      a: 'Peter Medawar Prize (UCL Science & Technology Studies, top-ranked graduate across the three-year BSc), STS Best Dissertation Prize, first in the departmental cohort, and the Joan Beauchamp Proctor Prize for top Year 2 performance in the department.' },
    { k: 'reviewer review service reviewing peer',
      a: 'He is an Invited Reviewer for three NeurIPS 2026 workshops, Trust-AI-Eval (TAE), which examines when AI evaluations and the claims drawn from them can be trusted, EconML, and JUDGe, the workshop on reliable evaluation for language models.' },
    { k: 'talk talks conference presented presentation speaking',
      a: 'Talks include a paper presentation at the Workshop on Human-Agent Collaboration, CHI 2026; an invitation to present the MMLU validity work at the UCL Centre for Responsible Innovation; and Explore Econ 2025 at UCL.' },
    { k: 'method methods statistics stats skills irt technical tools',
      a: 'In regular use are item response theory, exploratory factor analysis, generalisability theory, Krippendorff’s alpha, cross-validation, panel fixed effects and DoubleML, in Python, R and Stata. He builds evaluation pipelines that run and probe models, and has implemented language models in PyTorch. He is partway through the MITx MicroMasters in Statistics and Data Science, online.' },
    { k: 'hobby hobbies fun free time hockey ski skiing piano music sport',
      a: 'Off the desk, ice hockey, alpine ski racing, and piano.' },
    { k: 'language languages speak chinese cantonese mandarin french english',
      a: 'English, Cantonese and Mandarin, plus conversational French.' },
    { k: 'contact email reach write message touch hire collaborate',
      a: 'Email him at ' + EMAIL + ' — or use the button in the contact section. Data, code and analysis plans are linked from each paper.' },
    { k: 'linkedin github scholar orcid profile links social',
      a: 'All linked at the top of the page, LinkedIn (linkedin.com/in/yiven-z), Google Scholar, GitHub (github.com/louisyzhu) and ORCID.' },
    { k: 'landscape terrain frontier banner animation ascii art top page what is 3d illustration',
      a: 'The banner is a generative illustration, a three-dimensional ASCII landscape drawn in typed characters. It encodes no data; the benchmark names are labels on an imaginary terrain. Hover deforms the surface, drag to orbit it through a full 360 degrees, and click to send a pulse. Hand-written JavaScript, no libraries.' },
    { k: 'who you bot assistant this chat are real ai gpt model',
      a: 'I’m a small hand-built assistant, not a language model — no API behind me, just this page’s facts and a keyword matcher. Whatever I can’t answer, Louis can, at ' + EMAIL + '.' },
    { k: 'name yiven pronounce louis called',
      a: 'Louis Yiven Zhu — Louis to colleagues.' },
    { k: 'where live location based city oxford london',
      a: 'Oxford, UK, for the MSc at the Oxford Internet Institute; before that, London.' }
  ];

  KB.forEach(function (e) { e.keys = e.k.split(' '); });

  var FALLBACK = 'That one’s beyond what this page knows — I only answer from what’s here. For anything else, ' + EMAIL + ' reaches the person himself.';

  function answer(q) {
    var words = q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length > 2; })
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

  bubble('lz', 'Ask me about Louis — his research, experience, papers, or anything on this page.', false);
}());
