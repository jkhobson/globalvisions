// Mission content: "The Fizz Files" on Harvest Key (Challenge 2, Beliefs about food).
// All places, people, companies and figures here are invented for practice.
//
// Every source has two texts: "short" (used at Full and Guided support) and "long" (Light and Open).
// Words in **double stars** are glossary words: students can tap them for a simple meaning.
// Every item has two stems: "simple" (Full and Guided) and "std" (Light and Open). The thinking task is the same.
// The right option is listed first; options are shuffled on screen.

export const GLOSSARY = {
  advert: "A message made to make people buy something.",
  energy: "The power to move, work or think.",
  survey: "Asking many people the same questions.",
  "tooth decay": "When teeth get holes and go bad.",
  poison: "Something that can hurt or kill you.",
  sales: "How many things people buy.",
  "paid for": "Gave the money to make it happen.",
  link: "When two things happen together.",
  interview: "Asking one person questions and writing down the answers.",
  evidence: "Facts that show something is true.",
  reliable: "You can trust it.",
  biased: "Showing only one side, often to help yourself.",
  emotive: "Made to give you strong feelings.",
  ban: "To say people are not allowed to do something."
};

export const SOURCES = {
  "src-zap": {
    kind: "Advert", icon: "🥤", author: "ZapFizz Drinks Ltd", year: 2026,
    short: "ZapFizz! The drink for winners! Feel the **energy**! 9 out of 10 students love the taste. Drink ZapFizz before every test!",
    long: "ZapFizz! The drink for WINNERS! Feel the **energy** from the first sip! 9 out of 10 students love the taste.* Drink ZapFizz before every test and shine! Now with real fruit flavour.**\n\n*Asked at the ZapFizz Summer Camp, 10 students.\n**Flavour only. Contains 9 teaspoons of sugar per can."
  },
  "src-report": {
    kind: "Report", icon: "📊", author: "Harvest Key Health Service", year: 2025,
    short: "We did a **survey** of 2,400 students aged 11 to 16. 41% drink two or more sugary drinks every day. These students had more **tooth decay**. We suggest free water at school.",
    long: "Teen Drinks Survey 2025. The Harvest Key Health Service asked 2,400 students aged 11 to 16 in 12 schools what they drank in one week. 41% drank two or more sugary drinks every day. Dentists then checked a smaller group of 300 students: those who drank more sugary drinks had more **tooth decay**. The survey shows a **link**, but it does not prove that sugary drinks are the only cause. We recommend free drinking water in every school."
  },
  "src-lina": {
    kind: "Social media post", icon: "📱", author: "@FitLifeLina (300,000 followers)", year: 2026,
    short: "SUGAR IS **POISON**!!! 😱 I stopped sweet drinks and lost 5 kg in ONE week. Buy my 7-Day Clean Plan, link in bio!",
    long: "SUGAR IS **POISON**!!! 😱😱 I stopped ALL sweet drinks and lost 5 kg in ONE week. Doctors don't want you to know this!!! My life is totally different now. If you love your family, share this. Buy my 7-Day Clean Plan, link in bio 💪"
  },
  "src-news": {
    kind: "Newspaper article", icon: "📰", author: "Harvest Key Times", year: 2009,
    short: "Fizzy drink **sales** fall. Families on Harvest Key now buy more fruit juice. Shops say fizzy drinks are less popular.",
    long: "Fizzy drink **sales** fall as island families choose juice. Shops across Harvest Key say sales of fizzy drinks fell by a fifth this year, while fruit juice sales rose. 'People want something healthier,' said one shop owner. Experts expect the trend to continue."
  },
  "src-study": {
    kind: "Research study", icon: "🧪", author: "Beverage Research Institute", year: 2024,
    short: "We studied 300 adults. We found no clear **link** between soft drinks and weight gain. (Small print: this study was **paid for** by the Island Soft Drinks Association.)",
    long: "A two-year study of 300 adults aged 25 to 60 found no clear **link** between soft drink consumption and weight gain. The authors conclude that soft drinks can be part of a balanced diet.\n\nFunding: this research was **paid for** by the Island Soft Drinks Association."
  },
  "src-nurse": {
    kind: "Interview", icon: "🩺", author: "Nurse Kemi Adeyemi, Harvest Key Middle School", year: 2026,
    short: "This year I see more students with headaches after lunch. Many bring energy drinks. I have not counted it carefully. It is what I see in my office.",
    long: "Our reporter asked the school nurse what she sees. 'This year more students come to me with headaches in the afternoon. Many of them bring energy drinks from home or buy them at the gate. I haven't counted it scientifically, so I can't give you numbers, but it's a pattern I notice nearly every week.'"
  }
};

export const ITEMS = [
  // Briefing: research question (Research, R2)
  { id: "r2-fizz-01", block: "R2", demand: 0,
    stem: { simple: "The island wants to know about sugary drinks at school. Which question is best to research?",
            std: "Harvest Key's council asks your team to investigate sugary drinks in school shops. Which research question is the most focused and useful?" },
    options: [
      { t: "Should Harvest Key stop school shops selling sugary drinks, and what would change for students?" },
      { t: "Are sugary drinks bad for people all around the world, or not?", trap: "vague-question" },
      { t: "Do the students at Harvest Key Middle School like the taste of ZapFizz?", trap: "vague-question" },
      { t: "How many cans of drink did the school shop on Harvest Key sell yesterday afternoon?", trap: "vague-question" }],
    hint: "A good question is about the real issue and can't be answered with just yes or no.",
    explain: "The best question names the place, the issue and who is affected, and it needs research to answer." },

  // E1: who made it and why
  { id: "e1-zap-01", block: "E1", demand: 0, source: "src-zap",
    stem: { simple: "Why did ZapFizz make this advert?", std: "What is the main purpose of the ZapFizz advert?" },
    options: [
      { t: "To sell more ZapFizz drinks" },
      { t: "To help students do well in tests", trap: "vested-interest-missed" },
      { t: "To share health research", trap: "author-not-checked" },
      { t: "To warn people about sugar", trap: "author-not-checked" }],
    hint: "Who made this advert? What do they sell?",
    explain: "ZapFizz makes and sells the drink, so the advert's purpose is to sell. That is why it only shows good things." },
  { id: "e1-lina-01", block: "E1", demand: 0, source: "src-lina",
    stem: { simple: "What does @FitLifeLina want you to do?", std: "Read the whole post. What does @FitLifeLina most want readers to do?" },
    options: [
      { t: "Buy her 7-Day Clean Plan" },
      { t: "Go and see a doctor", trap: "emotive-hook" },
      { t: "Read a science report", trap: "author-not-checked" },
      { t: "Drink more water at school", trap: "emotive-hook" }],
    hint: "Look at the end of the post. What is she selling?",
    explain: "The post ends with an advert for her plan. A source that sells something has a reason to exaggerate." },
  { id: "e1-report-01", block: "E1", demand: 1, source: "src-report",
    stem: { simple: "Who made this report, and why?", std: "Who produced the Teen Drinks Survey, and what was its purpose?" },
    options: [
      { t: "The island's Health Service, to learn what students drink" },
      { t: "A drinks company, to make people buy more of its sugary drinks", trap: "author-not-checked" },
      { t: "A student at the school, as part of a short homework project", trap: "author-not-checked" },
      { t: "A water company, to sell bottled water", trap: "author-not-checked", b: "E1" }],
    hint: "Find the author's name at the top of the card.",
    explain: "The Health Service made it to learn about students' health. It sells nothing, which is one reason it is more credible." },

  // E2: reliability (CRAAP)
  { id: "e2-news-01", block: "E2", demand: 0, source: "src-news",
    stem: { simple: "Our question is about students today. Is this article useful?", std: "Your research question is about students today. How useful is this article as evidence?" },
    options: [
      { t: "Not very useful: it is from 2009, so it may be out of date" },
      { t: "Very useful: newspapers check their facts, so it is still true", trap: "old-source" },
      { t: "Very useful: it shows that island families now choose healthy drinks", trap: "old-source" },
      { t: "Useful: the shop owners it quotes know a lot about health", trap: "author-not-checked" }],
    hint: "Look at the date. How many years ago was that?",
    explain: "Currency is the C in CRAAP. An article from 2009 tells us about the past, not about students today." },
  { id: "e2-report-01", block: "E2", demand: 1, source: "src-report",
    stem: { simple: "Why is this survey a strong source?", std: "Using CRAAP, which reason best explains why the Health Service survey is credible?" },
    options: [
      { t: "It asked 2,400 students and explains how it was done" },
      { t: "It uses lots of numbers, so it must be true", trap: "all-or-nothing" },
      { t: "It agrees with what I already think about sugary drinks", trap: "emotive-hook" },
      { t: "It is short, clear and easy for students to read and share", trap: "author-not-checked" }],
    hint: "Think about Accuracy and Authority. How many people? Who did it?",
    explain: "A large survey by a health organisation that explains its method is accurate and has authority. Numbers alone don't make a source true." },
  { id: "e2-nurse-01", block: "E2", demand: 2, source: "src-nurse",
    stem: { simple: "Can we trust the nurse?", std: "How reliable is the nurse's interview as evidence for your question?" },
    options: [
      { t: "Partly: she sees students daily, but hasn't counted cases" },
      { t: "Completely: she is a nurse, so everything she says must be right", trap: "all-or-nothing" },
      { t: "Not at all: one person's view is useless, so we should ignore it", trap: "all-or-nothing" },
      { t: "Completely: she works at a school and sees what students drink", trap: "anecdote-as-proof", b: "E1" }],
    hint: "What does she know well? What does she say she has NOT done?",
    explain: "Good judgements are often 'partly'. Her experience is useful local evidence, but without counting it is not proof." },

  // E3: bias and emotive language
  { id: "e3-lina-01", block: "E3", demand: 0, source: "src-lina",
    stem: { simple: "Which words are emotive? (They try to make you feel, not think.)", std: "Which part of the post uses emotive language to persuade?" },
    options: [
      { t: "\"SUGAR IS POISON!!! 😱\"" },
      { t: "\"I stopped sweet drinks\"", trap: "emotive-hook" },
      { t: "\"7-Day Clean Plan\"", trap: "emotive-hook" },
      { t: "\"link in bio\"", trap: "emotive-hook" }],
    hint: "Look for capital letters, !!! and scary words.",
    explain: "Words like POISON, capitals and emojis try to scare you. Feelings are not evidence." },
  { id: "e3-zap-01", block: "E3", demand: 1, source: "src-zap",
    stem: { simple: "Why does the advert say \"Feel the energy!\"?", std: "Why does the advert use the phrase \"Feel the energy!\"?" },
    options: [
      { t: "To make you excited, so you want to buy it" },
      { t: "To give scientific evidence that the drink gives you energy", trap: "emotive-hook" },
      { t: "To explain clearly how much sugar is in each can", trap: "emotive-hook" },
      { t: "To compare ZapFizz fairly with other drinks", trap: "claim-no-evidence" }],
    hint: "Does the phrase give a fact, or a feeling?",
    explain: "It is a feeling, not a fact. Adverts use emotive phrases to make you want the product." },
  { id: "e3-study-01", block: "E3", demand: 2, source: "src-study",
    stem: { simple: "Read the small print. Why might this study be biased?", std: "Read the funding note. Why might this study be biased?" },
    options: [
      { t: "It was paid for by soft drink companies" },
      { t: "It only studied 300 people for two years", trap: "small-sample" },
      { t: "It is from 2024, so the results are too old", trap: "old-source" },
      { t: "It is a scientific study, so it can't be biased", trap: "vested-interest-missed", b: "E1" }],
    hint: "Who gave the money? What would they like the study to say?",
    explain: "When the people who pay for research sell the product, they gain from a 'no link' result. That is a vested interest." },

  // E4: strength of evidence
  { id: "e4-zap-01", block: "E4", demand: 0, source: "src-zap",
    stem: { simple: "\"9 out of 10 students love the taste.\" Why is this weak evidence?", std: "Read the small print. Why is \"9 out of 10 students love the taste\" weak evidence?" },
    options: [
      { t: "Only 10 students were asked, at a ZapFizz camp" },
      { t: "It is strong: 9 out of 10 is nearly all the students", trap: "small-sample" },
      { t: "It is strong: real students said it, not the company", trap: "small-sample" },
      { t: "It is weak because taste is not important for health", trap: "claim-no-evidence" }],
    hint: "How many students? Where were they?",
    explain: "10 students at the company's own camp is a tiny, chosen group. It tells us almost nothing about all students." },
  { id: "e4-compare-01", block: "E4", demand: 1,
    stem: { simple: "Which source is the strongest evidence about teens on Harvest Key?", std: "Which source gives the strongest evidence about the drinking habits and health of teenagers on Harvest Key?" },
    options: [
      { t: "The Health Service survey of 2,400 students" },
      { t: "@FitLifeLina's post about losing 5 kg in a week", trap: "anecdote-as-proof" },
      { t: "The ZapFizz advert with its student taste test", trap: "vested-interest-missed" },
      { t: "The two-year research study of 300 adults", trap: "wrong-group" }],
    hint: "Which one is about teenagers, asked many people, and sells nothing?",
    explain: "The survey is large, recent, about teenagers on the island and made by a body that sells nothing." },
  { id: "e4-study-01", block: "E4", demand: 2, source: "src-study",
    stem: { simple: "The study found \"no link\" for adults. Does it show sugary drinks are fine for 12-year-olds?", std: "The study found \"no clear link\" in adults. Does it show that sugary drinks are safe for 12-year-olds?" },
    options: [
      { t: "No: it studied adults, not children, and drink makers paid" },
      { t: "Yes: a research study is always proof, whoever it studied", trap: "all-or-nothing" },
      { t: "Yes: 300 people over two years is a lot of evidence", trap: "wrong-group" },
      { t: "No: research studies are always wrong, so we can ignore it", trap: "all-or-nothing" }],
    hint: "Who was in the study? Who is in your question?",
    explain: "Evidence about adults may not apply to children, and the funding gives a reason to doubt it." },

  // E5: judge an argument
  { id: "e5-arg-01", block: "E5", demand: 0,
    stem: { simple: "Which argument is stronger?\nA: \"Ban sugary drinks at school. The Health Service asked 2,400 students: 41% drink two or more a day, and they had more tooth decay.\"\nB: \"Ban them because sugar is poison and everyone knows it!\"",
            std: "Compare the two arguments.\nA: \"The school shop should stop selling sugary drinks, because the Health Service survey of 2,400 students found 41% drink two or more a day, and those students had more tooth decay.\"\nB: \"Sugar is poison and everyone knows it, so ban it now!\"\nWhich is more effective, and why?" },
    options: [
      { t: "A: it gives a reason and evidence from a reliable source" },
      { t: "B: it sounds more sure and makes people feel strongly", trap: "emotive-hook" },
      { t: "B: it is shorter and clearer, so people will remember it", trap: "claim-no-evidence" },
      { t: "They are equally strong because both want the same thing", trap: "claim-no-evidence", b: "E4" }],
    hint: "Which one has evidence? Where does the evidence come from?",
    explain: "A has a claim, a reason and evidence from a credible source. B only has a claim and emotive words." },
  { id: "e5-arg-02", block: "E5", demand: 1,
    stem: { simple: "What is MISSING here?\n\"A ban won't work. Students will just buy drinks outside school.\"",
            std: "Read this argument: \"Banning drinks at school won't work. Students will just buy them outside.\" What is missing from it?" },
    options: [
      { t: "Evidence: it gives a reason, but nothing shows it is true" },
      { t: "A claim: it never says what it thinks about the ban", trap: "claim-no-evidence" },
      { t: "A reason: it never explains why the ban won't work", trap: "claim-no-evidence" },
      { t: "Nothing: it has everything a strong argument needs", trap: "claim-no-evidence" }],
    hint: "Find the claim. Find the reason. What would prove the reason?",
    explain: "Claim: a ban won't work. Reason: students buy outside. Missing: evidence, such as what happened in other schools." },
  { id: "e5-arg-03", block: "E5", demand: 2, source: "src-report",
    stem: { simple: "Someone says: \"Sugary drinks and tooth decay go together, so drinks are the ONLY cause.\" What is the problem?",
            std: "A classmate writes: \"The survey shows students who drink more sugary drinks have more tooth decay, so sugary drinks are the only cause of tooth decay.\" What is wrong with this reasoning?" },
    options: [
      { t: "A link does not prove that drinks are the only cause" },
      { t: "Nothing: the survey of 2,400 students proves it is true", trap: "correlation-cause" },
      { t: "The survey is from 2025, so it is too old to use now", trap: "old-source" },
      { t: "The survey only asked adults, not students like us", trap: "wrong-group" }],
    hint: "Read the last lines of the survey. What does it say it does NOT prove?",
    explain: "Other things, like brushing and sweets, also cause decay. A link shows they happen together, not that one is the only cause." }
];

export const MISSION = {
  id: "fizz", world: "harvest", title: "The Fizz Files",
  brief: {
    simple: "Agent, the island of Harvest Key needs you. Many students drink sugary drinks at school. The council wants to know: should school shops stop selling them? Collect sources. Find out which ones you can trust.",
    std: "Agent, Harvest Key's council is deciding whether school shops should stop selling sugary drinks. Everyone has an opinion, and the sources disagree. Your job: build a research question, check every source in the dossier, and decide which evidence the council can trust."
  },
  phases: [
    { kind: "briefing", title: "Briefing", skill: "Research", items: ["r2-fizz-01"] },
    { kind: "dossier", title: "Field Dossier", skill: "Evaluation",
      items: ["e1-zap-01", "e3-lina-01", "e2-news-01", "e1-report-01", "e3-study-01", "e2-nurse-01"] },
    { kind: "board", title: "Evidence Board", skill: "Evaluation", items: ["e4-compare-01", "e5-arg-01", "e5-arg-02"] },
    { kind: "debrief", title: "Debrief", skill: "Reflection" }
  ],
  debrief: {
    block: "F2",
    prompts: [
      { q: "Before this mission, what did you think about sugary drinks at school?", frame: "Before, I thought ___." },
      { q: "Which source changed your thinking most, and why?", frame: "The ___ changed my mind because ___." },
      { q: "Which source do you trust least? Why?", frame: "I trust the ___ least because ___." }
    ]
  },
  bringItHome: "Bring it home: look at a drink sold near your school or home. Who made it? What does the label or advert want you to believe? Tell your teacher what you found."
};

// Trust or Bust game cards: quick judgements of whether a source can be trusted for a question.
export const TRUST_CARDS = [
  { t: "A government weather office chart of rainfall for the last 10 years", ok: true, why: "Expert author, recent data, no product to sell." },
  { t: "A sweets company's website saying sweets help you study", ok: false, trap: "vested-interest-missed", why: "They sell sweets, so they gain if you believe it." },
  { t: "A video titled 'SHOCKING truth they HIDE from you!!!'", ok: false, trap: "emotive-hook", why: "Shouting and shock words try to make you feel, not think." },
  { t: "A 2008 article about which phone apps teenagers use", ok: false, trap: "old-source", why: "Too old for a question about apps today." },
  { t: "A university study of 5,000 students, with its method explained", ok: true, why: "Large sample, expert author, method shown." },
  { t: "One person's post: 'This tea cured my cold in a day!'", ok: false, trap: "anecdote-as-proof", why: "One story is not proof for everyone." },
  { t: "A national health ministry report on vaccination rates, 2025", ok: true, why: "Official, recent, about the whole country." },
  { t: "A survey of 8 people at a shoe shop about the best shoes", ok: false, trap: "small-sample", why: "8 people at one shop is a tiny, chosen sample." },
  { t: "An encyclopedia entry written by named experts, updated this year", ok: true, why: "Named experts and up to date." },
  { t: "A car company report saying its new car is the safest ever", ok: false, trap: "vested-interest-missed", why: "The company sells the car." },
  { t: "A school's own record of how many students came to the library each week", ok: true, why: "Primary data from the people who counted it." },
  { t: "A blog with no author name and no date", ok: false, trap: "author-not-checked", why: "We can't check who wrote it or when." }
];
