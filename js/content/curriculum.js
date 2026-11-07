// Cambridge Lower Secondary Global Perspectives, Stage 8 (Grade 7) learning objectives,
// copied from the school's "Cambridge Learning Objectives Stage 8 Grade 7" sheet.
export const OBJECTIVES = {
  "78Rs.01": { skill: "Research", name: "Constructing research questions", text: "Construct relevant research questions." },
  "78Rs.02": { skill: "Research", name: "Information skills", text: "Identify and begin to reference a range of print and multimedia sources and use them to locate relevant information and answer research questions." },
  "78Rs.03": { skill: "Research", name: "Conducting research", text: "Select an appropriate method and conduct research to test predictions and begin to answer a research question." },
  "78Rs.04": { skill: "Research", name: "Recording findings", text: "Select, organise and record relevant information from a range of sources and findings from primary research, using appropriate methods." },
  "78A.01": { skill: "Analysis", name: "Identifying perspectives", text: "Identify ideas and evidence from different perspectives within different sources, on a given issue." },
  "78A.02": { skill: "Analysis", name: "Interpreting data", text: "Explain how graphical or numerical data supports an argument or a perspective." },
  "78A.03": { skill: "Analysis", name: "Making connections", text: "Explain causes of a local or global issue and consequences on others." },
  "78A.04": { skill: "Analysis", name: "Solving problems", text: "Suggest and justify different actions to make a positive difference to a national or global issue." },
  "78E.01": { skill: "Evaluation", name: "Evaluating sources", text: "Evaluate sources, considering the author and purpose, recognising that some sources may be more credible than others." },
  "78E.02": { skill: "Evaluation", name: "Evaluating perspectives and arguments", text: "Discuss the effectiveness of an argument, making explicit reference to its structure and use of evidence." },
  "78Rf.01": { skill: "Reflection", name: "Personal contribution", text: "Explain personal contribution to teamwork and identify targets for improvement." },
  "78Rf.02": { skill: "Reflection", name: "Teamwork", text: "Consider the benefits and challenges of teamwork experienced when working together to achieve a shared outcome." },
  "78Rf.03": { skill: "Reflection", name: "Personal perspectives", text: "Consider ways that personal perspective on an issue may have changed as a result of conducting research or exploring different perspectives." },
  "78Rf.04": { skill: "Reflection", name: "Personal learning", text: "Identify skills learned or improved during an activity and relate to personal strengths and areas for improvement." },
  "78Cl.01": { skill: "Collaboration", name: "Working together", text: "Work positively within a team to achieve a shared outcome and improve teamwork." },
  "78Cl.02": { skill: "Collaboration", name: "Being an effective team", text: "The team assigns roles and divides tasks fairly, considering the skills of team members and the time available, resolves disagreements and works together to achieve a shared outcome." },
  "78Cm.01": { skill: "Communication", name: "Communicating information", text: "Present information and arguments clearly with some reasoning, referencing sources where appropriate." },
  "78Cm.02": { skill: "Communication", name: "Listening and responding", text: "Listen to ideas and information and offer relevant and well-judged contributions that demonstrate understanding of the issue." }
};

export const SKILLS = ["Research", "Analysis", "Evaluation", "Reflection", "Collaboration", "Communication"];
export const SKILL_ICON = { Research: "🔎", Analysis: "🧩", Evaluation: "⚖️", Reflection: "🪞", Collaboration: "🤝", Communication: "📣" };

// Blocks: small thinking moves with prerequisites. Only the blocks this prototype has content for are listed.
// More strands are added as content is written. Every block names the objective codes it trains.
export const BLOCKS = {
  R2: { skill: "Research", name: "Choose a focused research question", needs: [], objectives: ["78Rs.01"] },
  E1: { skill: "Evaluation", name: "Say who made a source and why", needs: [], objectives: ["78E.01"] },
  E2: { skill: "Evaluation", name: "Judge reliability (CRAAP: currency, accuracy, authority)", needs: ["E1"], objectives: ["78E.01"] },
  E3: { skill: "Evaluation", name: "Spot bias and emotive language", needs: ["E1"], objectives: ["78E.01"] },
  E4: { skill: "Evaluation", name: "Judge how strong the evidence is", needs: ["E2"], objectives: ["78E.01"] },
  E5: { skill: "Evaluation", name: "Judge an argument: claim, reason, evidence", needs: ["E3", "E4"], objectives: ["78E.02"] },
  F2: { skill: "Reflection", name: "Explain how my view changed, and why", needs: [], objectives: ["78Rf.03"] },
  // Signal Point (Challenge 3, Improving communication): from the C3 lessons on audience, barriers, listening, PEEL and rebuttals.
  M1: { skill: "Communication", name: "Fit a message to its audience, purpose and mode", needs: [], objectives: ["78Cm.01"] },
  M2: { skill: "Communication", name: "Spot the barrier that blocks a message", needs: ["M1"], objectives: ["78Cm.01"] },
  M3: { skill: "Communication", name: "Listen, paraphrase and disagree respectfully", needs: [], objectives: ["78Cm.02"] },
  M4: { skill: "Communication", name: "Build a point with PEEL and a named source", needs: ["M1"], objectives: ["78Cm.01"] },
  M5: { skill: "Communication", name: "Rebut: they said, however, because, so", needs: ["M3", "M4"], objectives: ["78Cm.02"] },
  M6: { skill: "Communication", name: "Open and close a debate speech", needs: ["M4"], objectives: ["78Cm.01"] },
  T1: { skill: "Collaboration", name: "Share roles and tasks fairly", needs: [], objectives: ["78Cl.02"] },
  T2: { skill: "Collaboration", name: "Keep the team working together", needs: [], objectives: ["78Cl.01"] },
  F3: { skill: "Reflection", name: "Weigh the benefits and challenges of teamwork", needs: [], objectives: ["78Rf.02"] }
};

// Thinking traps: tagged on wrong options so the app (and the teacher) can see which traps catch each student.
export const TRAPS = {
  "vested-interest-missed": { name: "Missed who benefits", tip: "Ask: who made this, and what do they gain?" },
  "author-not-checked": { name: "Didn't check the author", tip: "Look for who wrote it before you trust it." },
  "old-source": { name: "Ignored the date", tip: "Check when it was made. Is it still true today?" },
  "emotive-hook": { name: "Hooked by feelings", tip: "Strong feelings are not evidence. Look for facts." },
  "anecdote-as-proof": { name: "One story as proof", tip: "One person's story is not proof for everyone." },
  "small-sample": { name: "Tiny sample", tip: "How many people were asked? Who were they?" },
  "wrong-group": { name: "Evidence about a different group", tip: "Is the evidence about the same people as your question?" },
  "all-or-nothing": { name: "All or nothing", tip: "Most sources are partly useful. Say what is strong and what is weak." },
  "claim-no-evidence": { name: "Claim with no evidence", tip: "A strong argument needs a reason and evidence." },
  "correlation-cause": { name: "Link means cause", tip: "Two things together does not prove one caused the other." },
  "vague-question": { name: "Vague question", tip: "A good research question is focused: not too broad and not too narrow." },
  "wrong-audience": { name: "Wrong audience", tip: "Ask: who will read this? Change the words, tone and mode to suit them." },
  "attack-person": { name: "Attacked the person", tip: "Challenge the idea, not the person." },
  "not-listening": { name: "Didn't really listen", tip: "Paraphrase first: 'So you think that…'. Keep the speaker's meaning." },
  "shut-down": { name: "Shut the talk down", tip: "Disagree with a reason, so the conversation keeps going." },
  "off-topic": { name: "Off the point", tip: "Answer what was said, and link back to the motion." },
  "unfair-roles": { name: "Unfair share", tip: "Share jobs by skills and time, so everyone does a fair part." },
  "yes-no-question": { name: "Yes/no question", tip: "A research question should start with How, Why, What or To what extent, so it can't be answered with just yes or no." }
};

// The four English support levels (the second dial). The task stays the same; only the wrapping changes.
export const SUPPORT = [
  { id: "full", name: "Full support", desc: "Short texts, read-aloud on, word help shown, sentence frames." },
  { id: "guided", name: "Guided", desc: "Short texts, tap words for help, sentence frames." },
  { id: "light", name: "Light", desc: "Longer texts, help when you ask." },
  { id: "open", name: "Open", desc: "Full texts, help only if you ask." }
];

// Ranks per skill, from the share of that skill's blocks mastered.
export const RANKS = ["Explorer", "Investigator", "Analyst", "Strategist", "Ambassador"];
