// Mission content: "The Ripple Debate" on Signal Point (Challenge 3, Improving communication).
// Built from the C3 lessons: audience, purpose and mode (L2), barriers and misinformation (L2), active listening and
// respectful disagreement (L3), PEEL research notes and sources (L4), rebuttals, openings and closings (L5).
// All places, people, apps and figures here are invented for practice. Ripple is a made-up messaging app.
//
// Same rules as fizz.js: every source has a short and a long text; every item has a simple and a standard stem,
// a hint and an explanation; the right option is listed first and every wrong option says why it doesn't work.
// Sentence jumbles (kind: "order") list their sentences in the right order. The app shows them mixed up, and
// each sentence's "why" says what job that place in the order does, so a wrong order is explained without showing the answer.

export const GLOSSARY = {
  audience: "The people who get the message.",
  purpose: "Why a message is sent: to inform, persuade, ask or entertain.",
  motion: "The idea a debate argues for or against.",
  survey: "Asking many people the same questions.",
  forwarded: "Sent on to you by someone who got it from someone else.",
  official: "From the people in charge, like the Ferry Office."
};

export const SOURCES = {
  "msg-gran": {
    kind: "Voice note (written down)", icon: "👵", author: "Grandma Rosa, who lives on the mainland", year: 2026,
    short: "Ripple let me watch my grandson's school play from the mainland. I cried happy tears!",
    long: "I live three hours away by ferry, so I can't get to Signal Point often. Last week my grandson sent me a video of his school play on Ripple, and we talked on a video call after. I cried happy tears! Before Ripple, I only heard about his life once a month."
  },
  "msg-storm": {
    kind: "Forwarded post", icon: "📲", author: "Unknown: **forwarded** many times", year: 2026,
    short: "FERRY CANCELLED ALL WEEK because of a storm!!! Share now before they delete this!!!",
    long: "⚠️ FERRY CANCELLED ALL WEEK because of a giant storm!!! My cousin's friend works at the port and says the news is hiding it. Share now before they delete this!!!"
  },
  "msg-ferry": {
    kind: "Email", icon: "📧", author: "A student, writing to Ms Rocha, head of the Ferry Office", year: 2026,
    short: "hey ferry ppl ur boat was late AGAIN lol. fix it",
    long: "hey ferry ppl\n\nur 8am boat was late AGAIN today lol. like 5 times this month?? fix it\n\nsent from my phone"
  },
  "msg-group": {
    kind: "Group chat message", icon: "💬", author: "A member of a Youth Council project team", year: 2026,
    short: "Whoever didn't do their slides is ruining EVERYTHING. 😡",
    long: "Whoever didn't do their slides is ruining EVERYTHING. 😡 We present on Friday and half of it is empty. Some people just don't care. Thanks a lot."
  },
  "speech-opp": {
    kind: "Debate speech", icon: "🎤", author: "Tomas Reyes, Opposition team captain", year: 2026,
    short: "Ripple has not made communication better. At the café, families sit together but look at their phones. Our **survey** found 54 of 120 students talk face to face less than last year.",
    long: "Ripple has not made our communication better. At the café, I see families sitting together, all looking at their phones. The Youth Council's own **survey** found that 54 out of 120 students talk face to face less than last year. Messages are quick, but quick is not the same as close. I ask you to vote against the **motion**."
  },
  "survey-ripple": {
    kind: "Survey results", icon: "📊", author: "Signal Point Youth Council", year: 2026,
    short: "We asked 120 students at Signal Point School about Ripple. 87 message family on Ripple every week. 54 say they talk face to face less than last year.",
    long: "Ripple **Survey**, October 2026. The Youth Council asked 120 students aged 11 to 15 at Signal Point School, the island's only secondary school. 87 of them message family on Ripple every week, often relatives on the mainland. 54 said they talk face to face less than they did last year. We did not ask adults, so these results are only about students."
  }
};

// The four steps of a rebuttal and PEEL, from Lesson 4 and Lesson 5. Used as the "why" for each place in a jumble.
const REBUT = [
  "The first sentence repeats the other team's point, so everyone knows what you are answering ('They said…').",
  "The second sentence says you disagree, and how ('However…').",
  "The third sentence gives your reason or evidence ('Because…').",
  "The last sentence says why it matters for the debate ('So…')."
];
const PEEL = [
  "A PEEL paragraph starts with the Point: the one idea you will prove.",
  "Second comes the Evidence for the point, with its source.",
  "Third, Explain what the evidence means.",
  "The last sentence Links back to the motion."
];
const OPEN = [
  "An opening starts by greeting the audience.",
  "Next, state the motion and which side your team is on.",
  "Then preview your points in order, starting with the first.",
  "The preview ends with your last point."
];
const CLOSE = [
  "A closing starts by signalling the end ('To conclude…').",
  "Then sum up your best points. No new points in a closing.",
  "Next, answer the other side's strongest point.",
  "Finish strongly: tell the audience why your side should win."
];
const steps = (whys, texts) => texts.map((t, i) => ({ t, why: whys[i] }));

// Quick sorts for the Debate Dojo: what job does this sentence do? The labels are the options; the right one is first.
const PEEL_LABELS = {
  P: { t: "Point: the main idea", why: "A Point names the idea to prove. Does this sentence give a fact, explain, or link back instead?" },
  E: { t: "Evidence: a fact with its source", why: "Evidence is a fact or number with a source. Look for one in the sentence." },
  X: { t: "Explain: what the evidence means", why: "Explain says what a piece of evidence shows. Is there evidence here to explain?" },
  L: { t: "Link: back to the motion", why: "A Link takes the audience back to the motion. Does this sentence do that?" }
};
const SPEECH_LABELS = {
  O: { t: "Opening statement", why: "An opening greets the audience, says your side and previews your points." },
  R: { t: "Rebuttal", why: "A rebuttal answers a point the other team made ('They said…, however…')." },
  C: { t: "Closing statement", why: "A closing sums up why your side is stronger, at the end of the debate." },
  Q: { t: "Clarifying question", why: "A clarifying question asks what a speaker meant by something unclear." }
};
function sorter(labels, order) {
  return (id, block, demand, right, sentence, extra) => ({
    id, block, demand,
    stem: { simple: `What job does this sentence do? "${sentence}"`, std: `${extra} "${sentence}"` },
    options: [right, ...order.filter(k => k !== right)].map((k, i) => i ? { ...labels[k] } : { t: labels[k].t }),
    hint: block === "M4" ? "Point, Evidence, Explain, Link. Is there a fact with a source? Does it go back to the motion?"
                         : "Where in the debate would you hear this: the start, answering the other side, the end, or a question?",
    explain: block === "M4" ? "Each PEEL sentence does one job. Spotting the job helps you check your own notes have all four."
                            : "Each speech has its own job. Knowing which is which helps you plan who says what, and when."
  });
}
const peel = sorter(PEEL_LABELS, ["P", "E", "X", "L"]), speech = sorter(SPEECH_LABELS, ["O", "R", "C", "Q"]);
const PEEL_ASK = "Motion: 'Phones should be allowed at lunch at Signal Point School.' Which PEEL step is this sentence?";
const SPEECH_ASK = "Which part of a debate is this line from?";

export const ITEMS = [
  /* ---------- Signal Check: audience, purpose, mode (M1) ---------- */
  { id: "m1-mode-01", block: "M1", demand: 0,
    stem: { simple: "The ferry is cancelled tomorrow. Your grandfather doesn't use apps. How should you tell him?",
            std: "Tomorrow's ferry is cancelled, and your grandfather needs to know. He doesn't use phone apps at all. Which mode of communication suits this audience best?" },
    options: [
      { t: "Call him, or tell him in person" },
      { t: "Post it on your Ripple story", trap: "wrong-audience",
        why: "He doesn't use apps, so he would never see a post." },
      { t: "Send a message to your class group chat", trap: "wrong-audience",
        why: "Your class isn't the audience here. Who needs the news?" },
      { t: "Put a poster up in the school hall", trap: "wrong-audience",
        why: "He isn't at school, so a poster there won't reach him." }],
    hint: "Who is the audience? How does he usually hear news?",
    explain: "Choose the mode that reaches your audience. He doesn't use apps, so speaking to him (on the phone or face to face) works best." },
  { id: "m1-gran-02", block: "M1", demand: 1, source: "msg-gran",
    stem: { simple: "Why did Grandma Rosa send this voice note?",
            std: "What is the main purpose of Grandma Rosa's voice note?" },
    options: [
      { t: "To share how happy she felt" },
      { t: "To sell Ripple to other grandparents",
        why: "She isn't selling anything or asking anyone to buy. Listen to how she feels." },
      { t: "To ask her grandson for a ferry ticket",
        why: "She doesn't ask for anything in the message." },
      { t: "To complain that the ferry trip is too long",
        why: "She mentions the distance, but her message is happy, not a complaint." }],
    hint: "Purpose means why it was sent: to inform, persuade, ask or entertain. What feeling does she share?",
    explain: "She is telling her family how she felt. The distance is background; the happy news is the purpose." },
  { id: "m1-email-03", block: "M1", demand: 2,
    stem: { simple: "You want to tell Ms Rocha, head of the Ferry Office, that the 8am ferry was late 5 times this month. Which message is best?",
            std: "You need to tell Ms Rocha, head of the Ferry Office, that the 8am ferry was late five times this month. Which message best fits this audience and purpose?" },
    options: [
      { t: "Dear Ms Rocha, the 8am ferry was late five times this month. Could you please look into it?" },
      { t: "hey ferry ppl ur boat is ALWAYS late lol", trap: "wrong-audience",
        why: "Too casual for the head of an office, and 'always' isn't exact." },
      { t: "THE FERRY IS A DISASTER!!! Everyone on the island is so angry!!!", trap: "emotive-hook",
        why: "Shouting makes the reader defensive, and there are no facts she can act on." },
      { t: "Dear Ms Rocha, I am writing to you today about something important.",
        why: "It's polite, but it never says what the problem is, so she can't act on it." }],
    hint: "The audience is an official. The purpose is to get the problem fixed. Which message is polite AND clear?",
    explain: "An official audience needs a polite greeting, the exact facts and a clear request. That gives her what she needs to act." },

  /* ---------- Signal Check: barriers, with a message to read (M2) ---------- */
  { id: "m2-group-01", block: "M2", demand: 0, source: "msg-group",
    stem: { simple: "What is the problem with this message?",
            std: "Which barrier to communication is the main problem in this group chat message?" },
    options: [
      { t: "Tone: it sounds angry and blames people in front of everyone" },
      { t: "Language: it uses words the team doesn't know",
        why: "The words are simple. Everyone understands them. How does it sound?" },
      { t: "Distractions: the room is too noisy",
        why: "It's a written message, so noise isn't the problem." },
      { t: "Missing context: nobody knows what the slides are",
        why: "The team knows about the slides. Think about how the message feels to read." }],
    hint: "Read it as if you were on the team. How does it make you feel?",
    explain: "The words are clear, but the tone is angry and blames people in front of everyone. A better message: 'Can we check who is doing each part?'" },
  { id: "m2-storm-02", block: "M2", demand: 1, source: "msg-storm",
    stem: { simple: "What is the biggest problem with this post?",
            std: "Which barrier to communication does this forwarded post show?" },
    options: [
      { t: "It may be misinformation: no source, and it pushes you to share fast" },
      { t: "It is too long for people to read",
        why: "It's short. Look at who wrote it and what it wants you to do." },
      { t: "It uses capital letters, so it must be important and true", trap: "emotive-hook",
        why: "Capital letters show strong feeling, not truth." },
      { t: "It is about the weather, which is a boring topic",
        why: "Being boring isn't the issue. Could this be false?" }],
    hint: "Read to the end. Who wrote it? What does it want you to do quickly?",
    explain: "Nobody knows who first wrote it, it gives no official source, and it pushes you to share fast. Check the Ferry Office's own page first." },
  { id: "m2-ferry-03", block: "M2", demand: 2, source: "msg-ferry",
    stem: { simple: "This email went to the head of the Ferry Office. What stops it working?",
            std: "This email was sent to Ms Rocha, head of the Ferry Office. Which barriers stop it working for its audience?" },
    options: [
      { t: "Language and tone: too casual and rude for her" },
      { t: "Distractions: her office is too busy to read emails",
        why: "We don't know that. Look at the words in the email itself." },
      { t: "Misinformation: the ferry is never late",
        why: "Nothing says the ferry is on time. The problem is how it's written." },
      { t: "Missing context: she doesn't know what a ferry is",
        why: "She runs the ferries! Look at the words and how they sound." }],
    hint: "Read it as Ms Rocha. Are the words and the way it sounds right for her?",
    explain: "Short forms like 'ur' and 'lol' are the wrong language for an official, and 'fix it' sounds rude. A fix: 'Dear Ms Rocha, the 8am ferry has been late five times this month. Could it be checked, please?'" },

  /* ---------- Signal Check: barriers in everyday messages (M2) ---------- */
  { id: "m2-k-04", block: "M2", demand: 0,
    stem: { simple: "Your friend texts: 'Can you help me with homework tonight?' You reply 'K.' Your friend feels upset. Why?",
            std: "A friend texts: 'Can you help me with my homework tonight?' You reply 'K.' Your friend feels hurt. Which barrier caused this?" },
    options: [
      { t: "Tone: one letter can sound cold online" },
      { t: "Language: your friend doesn't know the letter K",
        why: "Your friend knows the letter. It's how short and flat it feels." },
      { t: "Misinformation: your reply was false",
        why: "Nothing in it is false. Think about how it sounds without a face or voice." },
      { t: "Mode: you should have written a letter",
        why: "A text is fine for a quick reply. It's how the reply sounds." }],
    hint: "Online, we can't hear a voice or see a face. How does 'K.' sound?",
    explain: "Tone is how a message sounds. Without a face or voice, a very short reply can sound cold. 'Okay! Happy to help 😊' sends the same answer warmly." },
  { id: "m2-slang-05", block: "M2", demand: 1,
    stem: { simple: "A new student from the mainland joins your group chat. Everyone writes 'ngl the fest was mid'. She doesn't understand. What is the barrier?",
            std: "A new student from the mainland joins your class group chat. Everyone writes things like 'ngl the SP fest was mid'. She can't follow the conversation. Which barrier is this?" },
    options: [
      { t: "Language: slang and short forms" },
      { t: "Tone: the messages are rude to her",
        why: "Nobody is being rude to her. She just can't understand the words." },
      { t: "Distractions: she gets too many notifications",
        why: "She read the messages. The words themselves are the problem." },
      { t: "Misinformation: the festival didn't happen",
        why: "Nobody says it is false. She can't understand what it means." }],
    hint: "Could she understand the words if she read them slowly?",
    explain: "Slang and short forms are a language barrier for anyone who doesn't know them. Writing it out ('to be honest, the festival was just OK') lets everyone join in." },
  { id: "m2-call-06", block: "M2", demand: 2,
    stem: { simple: "On a video call, Mr Ito explains the debate rules. Phones keep pinging and two people watch videos. Half the team didn't hear. What fixes it?",
            std: "During a video call, Mr Ito explains the debate rules. Phones keep pinging and two students are watching videos. Afterwards, half the team didn't take in the rules. What is the barrier, and what would fix it?" },
    options: [
      { t: "Distractions: mute alerts and close other apps" },
      { t: "Language: Mr Ito should use simpler words",
        why: "Nobody said the words were hard. Something stopped them listening." },
      { t: "Tone: Mr Ito should sound friendlier",
        why: "His tone isn't the problem. What pulled the team's attention away?" },
      { t: "Misinformation: check the rules with a fact-checker",
        why: "The rules aren't false. Look at what was happening during the call." }],
    hint: "What was happening on the students' screens while he spoke?",
    explain: "Pings and videos are distractions: they pull attention away from the message. Muting notifications and closing other apps removes the barrier." },

  /* ---------- Listening Post: active listening and respectful disagreement (M3) ---------- */
  { id: "m3-reply-01", block: "M3", demand: 0,
    stem: { simple: "Your teammate says: 'Ripple makes everyone lonely.' Which reply keeps the talk going?",
            std: "Your teammate says: 'Ripple makes everyone lonely.' You disagree. Which reply disagrees respectfully and keeps the conversation going?" },
    options: [
      { t: "I see why you think that, but many people use it to talk to family far away." },
      { t: "No. Wrong.", trap: "shut-down",
        why: "It shuts the talk down and gives no reason." },
      { t: "That's a really silly thing to say.", trap: "attack-person",
        why: "This attacks the person, not the idea." },
      { t: "So? Who even cares about that?", trap: "shut-down",
        why: "It sounds rude and doesn't answer the point." }],
    hint: "Challenge the idea, not the person. Which reply gives a reason?",
    explain: "'I see why you think that, but…' shows you listened, then gives a reason. That keeps the talk going." },
  { id: "m3-para-02", block: "M3", demand: 1,
    stem: { simple: "Kai says: 'Ripple is great for news, but people share false stories too fast.' Which is the best paraphrase?",
            std: "Kai says: 'Ripple is great for getting news, but people share false stories too fast.' Which reply paraphrases Kai's point most accurately?" },
    options: [
      { t: "So you think Ripple helps with news, but false stories spread quickly." },
      { t: "So you think Ripple is bad and should be banned.", trap: "not-listening",
        why: "Kai never said ban. A paraphrase keeps the speaker's meaning." },
      { t: "So you think news is boring.", trap: "not-listening",
        why: "Kai didn't say that. Say what was really said, in your own words." },
      { t: "So you agree with me that Ripple is perfect.", trap: "not-listening",
        why: "Kai named a problem too. Don't change their point to match yours." }],
    hint: "A paraphrase says the same idea in your own words. Did Kai say one thing, or two?",
    explain: "A good paraphrase keeps both halves of Kai's point: the good part (news) and the problem (false stories)." },
  { id: "m3-signs-03", block: "M3", demand: 0,
    stem: { simple: "Which one shows active listening?",
            std: "Your partner is explaining their debate point. Which of these shows active listening?" },
    options: [
      { t: "Looking at them, nodding, then asking a question" },
      { t: "Looking at your phone, but saying 'yeah' sometimes", trap: "not-listening",
        why: "Your attention is on the phone. They can tell you aren't really listening." },
      { t: "Planning your own answer while they're still talking", trap: "not-listening",
        why: "That's half listening: waiting to talk, not trying to understand." },
      { t: "Finishing their sentences so they talk faster", trap: "not-listening",
        why: "Interrupting stops them explaining their own point." }],
    hint: "Active listening means full attention, to understand, not just to reply.",
    explain: "Eye contact, nodding and a question about their point all show full attention. You listen to understand, not just to reply." },

  /* ---------- Listening Post: listening to a debate speech (M3) ---------- */
  { id: "m3-main-04", block: "M3", demand: 1, source: "speech-opp",
    stem: { simple: "What is Tomas's main point?",
            std: "Listen to Tomas's speech. What is his main point?" },
    options: [
      { t: "People talk face to face less" },
      { t: "Ripple should be banned for everyone", trap: "not-listening",
        why: "He never says ban. Listen for what he actually argues." },
      { t: "Phones cost families too much money", trap: "not-listening",
        why: "Price isn't in his speech. What does he say happens with Ripple?" },
      { t: "The Youth Council survey is wrong", trap: "not-listening",
        why: "He uses the survey to support his point. He doesn't attack it." }],
    hint: "What does he say happens at the café, and what number backs it up?",
    explain: "His point is that Ripple has reduced face-to-face talk. The café example and the survey number both support that one idea." },
  { id: "m3-answer-05", block: "M3", demand: 2, source: "speech-opp",
    stem: { simple: "Which reply to Tomas is polite AND answers his point?",
            std: "Which reply to Tomas's speech is respectful and answers the point he actually made?" },
    options: [
      { t: "So you're saying people talk less in person. That's fair, but 87 of 120 still message family weekly." },
      { t: "You're just jealous because nobody messages you.", trap: "attack-person",
        why: "That attacks the person, not the idea." },
      { t: "That's not true, and everyone knows it.", trap: "claim-no-evidence",
        why: "It disagrees, but gives no reason or evidence." },
      { t: "Your speech was far too long and boring.", trap: "off-topic",
        why: "That's about the speech, not the point he made." }],
    hint: "Paraphrase his point first, then disagree with evidence.",
    explain: "It paraphrases his point, admits what's fair, then answers with evidence. That's a respectful and relevant reply." },
  { id: "m3-clarify-06", block: "M3", demand: 1, source: "speech-opp",
    stem: { simple: "You aren't sure what Tomas means by 'close'. Which question helps?",
            std: "You aren't sure what Tomas means by 'quick is not the same as close'. Which question would clarify his meaning?" },
    options: [
      { t: "When you say 'close', do you mean how often people talk, or how well they know each other?" },
      { t: "Why are you against everything?", trap: "attack-person",
        why: "That's a jab at him, not a question about his point." },
      { t: "Can you just stop talking now?", trap: "shut-down",
        why: "It's rude, and you learn nothing about what he meant." },
      { t: "Do you like going to the café?", trap: "off-topic",
        why: "That's off the point. Ask about the part that was unclear." }],
    hint: "To clarify, ask about the exact words you didn't understand.",
    explain: "A clarifying question names the unclear words and asks what they mean. Then you can answer the real point." },

  /* ---------- Listening Post: sharing roles fairly (T1) ---------- */
  { id: "t1-plan-01", block: "T1", demand: 0,
    stem: { simple: "Your team of four has three days to get ready for the debate. What is the fairest plan?",
            std: "Your team of four has three days to prepare for the debate. Which plan shares the work most fairly?" },
    options: [
      { t: "Each person researches one point, then everyone helps rehearse" },
      { t: "The best speaker does everything, so it's perfect", trap: "unfair-roles",
        why: "One person gets all the work, and the others learn nothing." },
      { t: "Everyone researches the same point", trap: "unfair-roles",
        why: "You'd repeat the same work and miss the other points." },
      { t: "Wait until the night before, then decide",
        why: "There won't be enough time to research and rehearse." }],
    hint: "Fair means everyone has a part, and nothing is done twice.",
    explain: "One point each means no repeats and a fair share. Rehearsing together helps the whole team improve." },
  { id: "t1-skills-02", block: "T1", demand: 1,
    stem: { simple: "Chi speaks confidently. Dev is good at finding sources. Ana draws well. Ben loves numbers. Who should give the opening speech?",
            std: "In your team, Chi is a confident speaker, Dev is great at finding sources, Ana draws well and Ben loves numbers. Who should give the opening statement?" },
    options: [
      { t: "Chi, because Chi speaks confidently" },
      { t: "Dev, because finding sources is the hardest job", trap: "unfair-roles",
        why: "Dev's skill is finding sources. Give Dev the research." },
      { t: "Whoever arrives at the meeting first", trap: "unfair-roles",
        why: "That's luck, not skills. Match the job to the person." },
      { t: "Nobody: the teacher should choose for you",
        why: "Your team can decide by looking at each person's skills." }],
    hint: "Match each job to the person whose skills fit it.",
    explain: "Giving roles by skill makes the team stronger: Chi opens, Dev researches, Ben handles the survey numbers and Ana designs the visuals." },
  { id: "t1-time-03", block: "T1", demand: 2,
    stem: { simple: "Minh has two jobs, but he also has a big test tomorrow. What should the team do?",
            std: "Your team gave Minh two jobs, but he has a big test tomorrow and can't do both in time. What should the team do?" },
    options: [
      { t: "Talk with Minh, then move one job to someone free" },
      { t: "Tell Minh to do both anyway, because jobs are jobs", trap: "unfair-roles",
        why: "Ignoring time makes the plan unfair, and the work may be rushed." },
      { t: "Take all of Minh's jobs away without asking him", trap: "unfair-roles",
        why: "Decide together. Minh may still want to do one part." },
      { t: "Say nothing and hope it works out",
        why: "Time problems get worse if the team doesn't plan for them." }],
    hint: "Fair roles think about time as well as skills. Who should be part of the decision?",
    explain: "Fair teams look at the time each person has. Talking with Minh and moving one job keeps the plan fair and on time." },

  /* ---------- Listening Post: keeping the team working together (T2) ---------- */
  { id: "t2-argue-01", block: "T2", demand: 0,
    stem: { simple: "Two teammates argue about which point should go first. What should you do?",
            std: "Two teammates disagree about which point should go first in your speech. What is the best way to settle it?" },
    options: [
      { t: "Hear both reasons, then agree on a choice together" },
      { t: "Let the loudest person win",
        why: "Loud isn't the same as right, and quieter ideas get lost." },
      { t: "Stop talking to each other until everyone calms down",
        why: "The disagreement stays, and the work stops." },
      { t: "Let one of them do the debate alone", trap: "unfair-roles",
        why: "That splits the team instead of solving the problem." }],
    hint: "Which choice listens to both people?",
    explain: "Listening to both reasons and deciding together solves the disagreement and keeps everyone working." },
  { id: "t2-quiet-02", block: "T2", demand: 1,
    stem: { simple: "Mina speaks quietly. Leo keeps talking over her. You lead the meeting. What do you do?",
            std: "In your team meeting, Mina speaks quietly and Leo keeps talking over her. You are leading the meeting. What should you do?" },
    options: [
      { t: "Say: 'Let's hear Mina's idea first, then Leo's.'" },
      { t: "Let Leo keep going, because he has lots of good ideas",
        why: "Mina's ideas get lost, and she may stop trying." },
      { t: "Tell Mina to speak louder or stay quiet",
        why: "That blames Mina. The team needs to make space for her." },
      { t: "Tell Leo that he's really annoying", trap: "attack-person",
        why: "That attacks Leo. Guide the turns instead." }],
    hint: "A good leader encourages everyone to take part. How can you make space?",
    explain: "Giving turns encourages quieter members to join in, without blaming anyone." },
  { id: "t2-chat-03", block: "T2", demand: 2, source: "msg-group",
    stem: { simple: "Someone posts this in your team chat. What is the best reply?",
            std: "A teammate posts this in your team's group chat. Which reply is most likely to get the project back on track?" },
    options: [
      { t: "Can we check who is doing each part, and who needs help?" },
      { t: "It's not my fault. It's yours!", trap: "attack-person",
        why: "Blaming back makes the argument bigger." },
      { t: "I'm leaving this group chat now.",
        why: "Leaving doesn't fix the work, and the team loses you." },
      { t: "Say nothing, and hope someone else replies.",
        why: "The problem stays, and the team keeps arguing." }],
    hint: "Which reply solves the problem instead of finding someone to blame?",
    explain: "Checking who is doing each part, and offering help, turns blame into a plan." },

  /* ---------- Debate Prep: PEEL (M4) ---------- */
  { id: "m4-evid-01", block: "M4", demand: 0,
    stem: { simple: "Point: 'Ripple helps families stay in touch.' Which sentence is the best Evidence?",
            std: "Your Point is: 'Ripple helps families stay in touch when they live far apart.' Which sentence is the strongest Evidence for it?" },
    options: [
      { t: "The Youth Council survey found 87 of 120 students message family every week." },
      { t: "Everyone knows that families love Ripple.", trap: "claim-no-evidence",
        why: "'Everyone knows' is not evidence. Where is it from?" },
      { t: "Ripple has a nice blue logo.", trap: "off-topic",
        why: "That's about the logo, not families staying in touch." },
      { t: "My cousin says Ripple is the best app ever.", trap: "anecdote-as-proof",
        why: "One person's opinion isn't strong evidence for everyone." }],
    hint: "Evidence is a fact with a source that backs up the point.",
    explain: "A number from a named survey is evidence: it is about families, and the audience can check where it came from." },
  { id: "m4-link-02", block: "M4", demand: 1,
    stem: { simple: "Which sentence is the Link at the end of a PEEL point?",
            std: "Your PEEL point argues that Ripple helps families stay in touch. Which sentence is the Link?" },
    options: [
      { t: "So Ripple has made communication better for families." },
      { t: "In the survey, 87 of 120 students message family weekly.",
        why: "That's the Evidence step. The Link goes back to the motion." },
      { t: "Ripple helps families stay in touch.",
        why: "That's the Point. The Link comes at the end, after the explanation." },
      { t: "Also, Ripple has lots of fun stickers.", trap: "off-topic",
        why: "That adds a new idea. A Link connects back to the motion." }],
    hint: "The Link takes the audience back to the motion: has Ripple made communication better?",
    explain: "The Link connects your point back to the motion, so the judges see why it matters for your side." },
  { id: "m4-explain-03", block: "M4", demand: 2,
    stem: { simple: "Point: Ripple helps families stay in touch. Evidence: 87 of 120 students message family every week. Which is the best Explain sentence?",
            std: "Point: Ripple helps families stay in touch. Evidence: 87 of 120 students message family every week. Which sentence best Explains the evidence?" },
    options: [
      { t: "This means distance no longer stops families talking." },
      { t: "This means Ripple is the best app in the whole world.", trap: "claim-no-evidence",
        why: "That goes far beyond the evidence. Explain what the numbers show." },
      { t: "This means that there were 87 students.",
        why: "That just repeats the number. Explain what it means." },
      { t: "This means phones are too expensive for families.", trap: "off-topic",
        why: "That doesn't connect to the evidence about families talking." }],
    hint: "Explain says what the evidence means for your point, without going further than it shows.",
    explain: "The Explain step says what the evidence shows about the point, and no more." },

  /* ---------- Debate Prep: sentence jumble, a PEEL paragraph (M4) ---------- */
  { id: "m4-jumble-01", block: "M4", demand: 0, kind: "order",
    stem: { simple: "Put the PEEL paragraph in order. Tap the sentences from first to last.",
            std: "The Affirmative team's research notes got mixed up. Put this PEEL paragraph in order: tap the sentences from first to last." },
    parts: steps(PEEL, [
      "Ripple helps families stay in touch when they live far apart.",
      "According to the Youth Council survey (2026), 87 of 120 students message family on Ripple every week.",
      "This means living on an island no longer stops families talking every week.",
      "So Ripple has made communication on Signal Point better for families."]),
    hint: "Point, Evidence, Explain, Link. Which sentence names the idea? Which one has a number and a source?",
    explain: "Point, Evidence, Explain, Link: each sentence does one job, and the Link takes the judges back to the motion." },
  { id: "m4-jumble-02", block: "M4", demand: 1, kind: "order",
    stem: { simple: "Put the Opposition's PEEL paragraph in order. Tap the sentences from first to last.",
            std: "Now the Opposition's notes are mixed up. Put their PEEL paragraph in order, from first to last." },
    parts: steps(PEEL, [
      "Ripple makes it easy for false stories to spread.",
      "In October, a post saying the ferry was cancelled all week was shared hundreds of times, but the Ferry Office said it was false.",
      "This shows people share fast on Ripple before they check if something is true.",
      "So Ripple has not made communication on Signal Point better."]),
    hint: "Point, Evidence, Explain, Link. Find the one idea first, then the example that proves it.",
    explain: "The Point names the problem, the Evidence is a real example with its source, the Explain says what it shows, and the Link answers the motion." },
  { id: "m4-jumble-03", block: "M4", demand: 2, kind: "order",
    stem: { simple: "Put this PEEL paragraph in order. Tap the sentences from first to last.",
            std: "This PEEL paragraph has no signal words to help you. Put it in order from first to last." },
    parts: steps(PEEL, [
      "Ripple gives quiet students a way to join in.",
      "Mr Ito's class log shows that 9 students who rarely speak in lessons posted ideas in the class Ripple group.",
      "Writing gives them time to think first, so their ideas are heard too.",
      "That is why Ripple has improved communication at our school."]),
    hint: "Which sentence is the idea? Which is the proof with its source? Which says what the proof means? Which answers the motion?",
    explain: "Even without signal words, a PEEL paragraph has the same shape: the idea, the proof with its source, what it means, then back to the motion." },

  /* ---------- Debate Prep: using the survey as evidence (M4) ---------- */
  { id: "m4-cite-04", block: "M4", demand: 0, source: "survey-ripple",
    stem: { simple: "You want to use this survey in your speech. How should you start the sentence?",
            std: "You want to use this survey as evidence in your speech. Which opening names the source properly?" },
    options: [
      { t: "According to the Signal Point Youth Council survey (2026), …" },
      { t: "I read it somewhere online that…", trap: "author-not-checked",
        why: "Your audience can't check 'somewhere'. Name the source." },
      { t: "Some people say that…", trap: "author-not-checked",
        why: "Who? Name the source so people can trust it." },
      { t: "It is a total fact that…", trap: "claim-no-evidence",
        why: "Calling it a fact doesn't show where it came from." }],
    hint: "Every piece of evidence needs a source: who said it, and where.",
    explain: "'According to…' names who made the evidence and when, so the audience can trust and check it." },
  { id: "m4-side-05", block: "M4", demand: 1, source: "survey-ripple",
    stem: { simple: "The Opposition says Ripple has NOT made communication better. Which fact helps THEM?",
            std: "The Opposition argues that Ripple has not improved communication. Which fact from the survey supports their side?" },
    options: [
      { t: "54 of 120 students talk face to face less than last year." },
      { t: "87 of 120 students message their family on Ripple every week.",
        why: "That helps the other side: it shows Ripple connecting families." },
      { t: "The survey asked 120 students.",
        why: "That's how big the survey was. It doesn't support either side." },
      { t: "The survey was done in October 2026.",
        why: "That's the date, not evidence for a side." }],
    hint: "Which fact shows a way communication got worse?",
    explain: "Less face-to-face talk supports the Opposition. The same survey has evidence for both sides, so read all of it." },
  { id: "m4-fair-06", block: "M4", demand: 2, source: "survey-ripple",
    stem: { simple: "Which sentence uses this survey honestly?",
            std: "Which sentence reports this survey accurately and fairly in a speech?" },
    options: [
      { t: "A survey of 120 students found 87 message family weekly." },
      { t: "The survey proves that everyone on the island loves Ripple.", trap: "wrong-group",
        why: "It asked 120 students, not everyone, and it didn't ask if they love it." },
      { t: "Almost every student messages family every single day.",
        why: "87 of 120 is most, not almost all, and it said every week, not every day." },
      { t: "A survey found something about Ripple and families.",
        why: "Too vague. Say what it found and how many people were asked." }],
    hint: "Check the numbers, who was asked, and how often.",
    explain: "An honest report keeps the exact numbers and says who was asked. Stretching evidence makes your whole speech easier to attack." },

  /* ---------- Debate Prep: rebuttals (M5) ---------- */
  { id: "m5-steps-01", block: "M5", demand: 0,
    stem: { simple: "The Opposition said: 'Ripple makes people lonely.' Which rebuttal is best?",
            std: "The Opposition said: 'Ripple makes people lonely.' Which rebuttal uses the four steps: They said, However, Because, So?" },
    options: [
      { t: "They said it makes us lonely. However, it keeps families close, because 87 of 120 message family weekly. So it helps." },
      { t: "They said Ripple makes us lonely. They are wrong.", trap: "claim-no-evidence",
        why: "It disagrees, but gives no reason or evidence." },
      { t: "Ripple has lots of fun features, like stickers and games.", trap: "off-topic",
        why: "It doesn't answer the point the other team made." },
      { t: "That's a silly idea from a silly team.", trap: "attack-person",
        why: "That attacks the people, not the idea." }],
    hint: "Look for all four steps: their point, your disagreement, your evidence, and why it matters.",
    explain: "A strong rebuttal repeats their point, disagrees, gives evidence, then says why it matters." },
  { id: "m5-because-02", block: "M5", demand: 1,
    stem: { simple: "'They said Ripple spreads false news. However, it can also stop false news. ___ So Ripple can help people find the truth.' What goes in the gap?",
            std: "Fill the 'Because' step: 'They said Ripple spreads false news. However, it can also stop false news. ___ So Ripple can help people find the truth.'" },
    options: [
      { t: "Because the Ferry Office posts official updates there, people can check them." },
      { t: "Because I really like Ripple a lot.", trap: "claim-no-evidence",
        why: "Liking something isn't a reason the audience can check." },
      { t: "Because the other team is wrong about this.", trap: "claim-no-evidence",
        why: "That repeats the disagreement. Give a reason or evidence." },
      { t: "Because false news is bad for everyone.", trap: "off-topic",
        why: "Everyone agrees, but it doesn't show how Ripple can stop it." }],
    hint: "The Because step gives a reason or evidence for your 'However'.",
    explain: "The Because step gives a reason the audience can check. Official updates show how Ripple can stop false news." },
  { id: "m5-strong-03", block: "M5", demand: 2,
    stem: { simple: "The Opposition's best point: 54 of 120 students talk face to face less. How should you answer it?",
            std: "The Opposition's strongest point is that 54 of 120 students talk face to face less. What is the best way to answer it?" },
    options: [
      { t: "Admit what is fair in it, then show with evidence why your side still matters more" },
      { t: "Pretend they never said it",
        why: "The judges heard it. Ignoring their strongest point looks weak." },
      { t: "Say the survey is fake", trap: "claim-no-evidence",
        why: "It's the same survey you use. Calling it fake without proof hurts you." },
      { t: "Add a brand-new point in your closing instead", trap: "off-topic",
        why: "Closings sum up. A new point there doesn't answer theirs." }],
    hint: "Lesson 5: what is fair in their strongest point, and how would you answer it?",
    explain: "Admitting what's fair shows you listened. Then your evidence shows why your side is still stronger." },

  /* ---------- Debate Prep: sentence jumble, a rebuttal (M5) ---------- */
  { id: "m5-jumble-01", block: "M5", demand: 0, kind: "order",
    claim: { by: "The Opposition", t: "Ripple makes people lonely. They stare at screens instead of talking to each other." },
    stem: { simple: "Put the rebuttal in order: They said, However, Because, So. Tap from first to last.",
            std: "Put this Affirmative rebuttal in the four-step order. Tap the sentences from first to last." },
    parts: steps(REBUT, [
      "They said Ripple makes people lonely.",
      "However, many people use it to stay close to family far away.",
      "Because our survey found 87 of 120 students message family every week.",
      "So Ripple helps people feel less lonely, not more."]),
    hint: "They said, However, Because, So. The first words of each sentence help.",
    explain: "They said, However, Because, So: repeat their point, disagree, give evidence, then say why it matters." },
  { id: "m5-jumble-02", block: "M5", demand: 1, kind: "order",
    claim: { by: "The Affirmative", t: "Ripple helps everyone on the island get news fast." },
    stem: { simple: "Put the Opposition's rebuttal in order. Tap from first to last.",
            std: "The Opposition answers the point 'Ripple helps everyone get news fast'. Put their rebuttal in order, from first to last." },
    parts: steps(REBUT, [
      "The Affirmative claimed that Ripple helps everyone get news fast.",
      "But fast news is not always true news.",
      "In October, a false ferry post was shared hundreds of times before the Ferry Office corrected it.",
      "This means quick sharing can spread mistakes, not just news."]),
    hint: "The signal words are different here. Which sentence repeats the other team's claim? Which one gives the example?",
    explain: "Same four steps with different words: their claim, your disagreement ('But…'), evidence, and what it means ('This means…')." },
  { id: "m5-jumble-03", block: "M5", demand: 2, kind: "order",
    claim: { by: "The Opposition", t: "Ripple stops people talking face to face." },
    stem: { simple: "Put this rebuttal in order. Tap from first to last.",
            std: "This rebuttal has no 'However' or 'So' to help you. Put it in order, from first to last." },
    parts: steps(REBUT, [
      "The Opposition told us that Ripple stops people talking face to face.",
      "That may be true for some, but it is not the whole picture.",
      "The same survey shows 87 of 120 students use Ripple to reach family they can't visit.",
      "Ripple adds a way to talk; it doesn't take one away."]),
    hint: "Find their point first. Then the sentence that disagrees, the one with evidence, and the one that sums up why it matters.",
    explain: "Without signal words, the four steps still hold: their point, your disagreement, your evidence, and why it matters." },

  /* ---------- Debate Dojo: more rebuttal jumbles (M5), each answering a claim shown above it ---------- */
  { id: "m5-jumble-04", block: "M5", demand: 0, kind: "order",
    claim: { by: "The Opposition", t: "Online messages cause arguments, because you can't hear someone's tone of voice." },
    stem: { simple: "Answer the claim. Put the rebuttal in order: They said, However, Because, So.",
            std: "You are the Affirmative. Put your rebuttal to this claim in the four-step order, from first to last." },
    parts: steps(REBUT, [
      "They said online messages cause arguments because you can't hear tone.",
      "However, Ripple also has voice notes and video calls.",
      "Because Grandma Rosa could see and hear her grandson after his school play.",
      "So Ripple can carry feelings, not just words."]),
    hint: "Which sentence repeats their claim? Then look for However, Because and So.",
    explain: "They said, However, Because, So: you repeated their claim, disagreed, gave an example, then said why it matters." },
  { id: "m5-jumble-05", block: "M5", demand: 0, kind: "order",
    claim: { by: "The Affirmative", t: "Ripple helps shy students speak up, because typing feels safer than talking." },
    stem: { simple: "Answer the claim. Put the rebuttal in order: They said, However, Because, So.",
            std: "You are the Opposition. Put your rebuttal to this claim in the four-step order, from first to last." },
    parts: steps(REBUT, [
      "They said Ripple helps shy students speak up.",
      "However, typing a message is not the same as speaking out loud.",
      "Because class talks, debates and job interviews still happen face to face.",
      "So shy students still need practice speaking in person."]),
    hint: "Which sentence repeats their claim? Then look for However, Because and So.",
    explain: "They said, However, Because, So: their claim, your disagreement, your reason, and why it matters." },
  { id: "m5-jumble-06", block: "M5", demand: 1, kind: "order",
    claim: { by: "The Opposition", t: "Students just waste time scrolling on Ripple." },
    stem: { simple: "Answer the claim. Put the rebuttal in order. The signal words are different this time.",
            std: "You are the Affirmative. This rebuttal uses different signal words. Put it in order, from first to last." },
    parts: steps(REBUT, [
      "The Opposition argued that students only waste time scrolling on Ripple.",
      "We disagree: most students use it for something useful.",
      "In the Youth Council survey, 87 of 120 students message family every week.",
      "This shows Ripple keeps families connected, not just busy."]),
    hint: "Find the sentence that repeats their claim. Which one has a number from a source?",
    explain: "Same four steps, new words: their claim, 'We disagree', the survey evidence, then 'This shows' why it matters." },
  { id: "m5-jumble-07", block: "M5", demand: 1, kind: "order",
    claim: { by: "The Affirmative", t: "Ripple group chats make teamwork easier." },
    stem: { simple: "Answer the claim. Put the rebuttal in order. The signal words are different this time.",
            std: "You are the Opposition. This rebuttal uses different signal words. Put it in order, from first to last." },
    parts: steps(REBUT, [
      "Our opponents said Ripple group chats make teamwork easier.",
      "That is only half true.",
      "In one Youth Council chat, a member blamed the whole team with an angry message instead of asking who needed help.",
      "So a group chat can cause fights unless the team agrees how to use it."]),
    hint: "Find the sentence that repeats their claim. Which one gives an example?",
    explain: "Same four steps, new words: their claim, 'only half true', the group chat example, then why it matters." },
  { id: "m5-jumble-08", block: "M5", demand: 2, kind: "order",
    claim: { by: "The Opposition", t: "False news spreads faster on Ripple than the truth." },
    stem: { simple: "Answer the claim. Put this rebuttal in order. There are no signal words to help you.",
            std: "You are the Affirmative. This rebuttal has no 'However' or 'So'. Put it in order, from first to last." },
    parts: steps(REBUT, [
      "We heard that false news spreads faster on Ripple than the truth.",
      "Sometimes it does, but Ripple can also stop it.",
      "When the false storm post went round, the Ferry Office posted the real timetable on Ripple the same day.",
      "The app that spreads a mistake can also be where the correction arrives."]),
    hint: "Their claim first. Then the sentence that disagrees, the one with the example, and the one that says why it matters.",
    explain: "Without signal words, the four steps still hold: their point, your disagreement, your evidence, and why it matters." },
  { id: "m5-jumble-09", block: "M5", demand: 2, kind: "order",
    claim: { by: "The Affirmative", t: "Ripple keeps families close, even when they live far apart." },
    stem: { simple: "Answer the claim. Put this rebuttal in order. There are no signal words to help you.",
            std: "You are the Opposition. This rebuttal has no 'However' or 'So'. Put it in order, from first to last." },
    parts: steps(REBUT, [
      "The other team told us that Ripple keeps families close.",
      "Close to faraway family, maybe, but not to the family at the same table.",
      "Tomas Reyes saw families at the café sitting together, all looking at their phones.",
      "A quick message cannot replace talking to the person next to you."]),
    hint: "Their claim first. Then the sentence that disagrees, the one with the example, and the one that says why it matters.",
    explain: "Without signal words, the four steps still hold: their point, your disagreement, your evidence, and why it matters." },

  /* ---------- Debate Dojo: PEEL sort (M4) ---------- */
  peel("m4-sort-01", "M4", 0, "P", "Allowing phones at lunch helps students stay in touch with their families.", PEEL_ASK),
  peel("m4-sort-02", "M4", 1, "E", "The school office log shows 31 calls home from the office phone last month, mostly at lunch.", PEEL_ASK),
  peel("m4-sort-03", "M4", 1, "X", "This shows that students already need to contact home during the school day.", PEEL_ASK),
  peel("m4-sort-04", "M4", 0, "L", "Therefore, phones at lunch would improve communication at our school.", PEEL_ASK),
  peel("m4-sort-05", "M4", 2, "E", "A 2025 report by the Island Education Office found more students talking in groups at schools with phone-free lunches.", PEEL_ASK),
  peel("m4-sort-06", "M4", 2, "P", "Phone-free lunches give students time to talk face to face.", PEEL_ASK),

  /* ---------- Debate Dojo: which speech is it? (M6) ---------- */
  speech("m6-sort-01", "M6", 0, "O", "Good morning. Today our team will argue that Ripple has made communication better, for three reasons.", SPEECH_ASK),
  speech("m6-sort-02", "M6", 0, "R", "The other team claimed Ripple makes people lonely, but our evidence shows the opposite.", SPEECH_ASK),
  speech("m6-sort-03", "M6", 0, "C", "To conclude, we have shown that Ripple keeps families close and helps quiet students speak up.", SPEECH_ASK),
  speech("m6-sort-04", "M6", 1, "Q", "What do you mean by 'real friends'? Do you mean people you have met in person?", SPEECH_ASK),
  speech("m6-sort-05", "M6", 1, "O", "Thank you, judges. We are the Opposition, and we will show that quick is not the same as close.", SPEECH_ASK),
  speech("m6-sort-06", "M6", 2, "C", "Tonight you heard both sides, but only one side answered every point. Vote for us.", SPEECH_ASK),
  speech("m6-sort-07", "M6", 2, "R", "That may be true for some families, but the survey tells a bigger story.", SPEECH_ASK),

  /* ---------- Debate Dojo: opening and closing jumbles (M6) ---------- */
  { id: "m6-jumble-01", block: "M6", demand: 0, kind: "order",
    stem: { simple: "Put the opening statement in order. Tap from first to last.",
            std: "Put the Affirmative team's opening statement in order: greet, motion and side, then the preview of points." },
    parts: steps(OPEN, [
      "Good morning, judges and classmates.",
      "Today we will argue that Ripple has made communication on Signal Point better.",
      "First, we will show that it keeps families close.",
      "Then we will show that it helps quiet students join in."]),
    hint: "Greet, say the motion and your side, then preview your points: first, then next.",
    explain: "An opening greets the audience, states the motion and your side, then previews your points in order." },
  { id: "m6-jumble-02", block: "M6", demand: 1, kind: "order",
    stem: { simple: "Put the closing statement in order. Tap from first to last.",
            std: "Put the Affirmative team's closing statement in order, from first to last." },
    parts: steps(CLOSE, [
      "To conclude, we have shown why Ripple has made communication better.",
      "It keeps families close, and it gives quiet students a voice.",
      "The Opposition said people talk less face to face, but our survey shows most students use Ripple to reach family.",
      "So tonight, vote for the side that answered every point."]),
    hint: "Signal the end, sum up, answer their strongest point, then finish strongly.",
    explain: "A closing signals the end, sums up your best points, answers their strongest point, and finishes with why you should win." },
  { id: "m6-jumble-03", block: "M6", demand: 2, kind: "order",
    stem: { simple: "Put the Opposition's opening in order. Tap from first to last.",
            std: "Put the Opposition's opening statement in order, from first to last." },
    parts: steps(OPEN, [
      "Thank you, everyone, for coming tonight.",
      "We are the Opposition: we believe Ripple has not made communication better.",
      "Our first point is that false stories spread too fast on Ripple.",
      "Our second point is that people talk face to face less than before."]),
    hint: "Thank the audience, say your side, then preview your points in order.",
    explain: "Even the Opposition opens the same way: greet, say the motion and your side, then preview your points in order." }
];

const phaseIntro = (simple, std) => ({ simple, std });
export const MISSION = {
  id: "signal", world: "signal", title: "The Ripple Debate",
  from: "📻 Message from the Youth Council",
  brief: {
    simple: "Agent, Signal Point needs you. Everyone on the island uses a new app called Ripple. On Friday there is a big debate: has Ripple made communication better? Help the teams send clear messages, listen well, and build strong arguments.",
    std: "Agent, Signal Point's Youth Council is holding a debate on Friday. The motion: 'Ripple has made communication on Signal Point better.' Messages are being misread, teams are arguing, and nobody's notes are in order. Your job: fix the messages, help the teams listen and work together, and build arguments that can win."
  },
  phases: [
    { kind: "briefing", title: "Signal Check", skill: "Communication",
      items: [["m1-mode-01", "m1-gran-02", "m1-email-03"], ["m2-group-01", "m2-storm-02", "m2-ferry-03"], ["m2-k-04", "m2-slang-05", "m2-call-06"]] },
    { kind: "dossier", title: "Listening Post", skill: "Communication", icon: "🎧", go: "Start listening",
      intro: phaseIntro("Now help the teams listen and work together. Read each one carefully.",
        "The debate teams are practising. Help them listen, disagree respectfully, share the work fairly and settle arguments."),
      items: [["m3-reply-01", "m3-para-02", "m3-signs-03"], ["m3-main-04", "m3-answer-05", "m3-clarify-06"],
              ["t1-plan-01", "t1-skills-02", "t1-time-03"], ["t2-argue-01", "t2-quiet-02", "t2-chat-03"]] },
    { kind: "board", title: "Debate Prep", skill: "Communication", icon: "🎤", go: "Go to the prep room",
      intro: phaseIntro("Now help the teams build their arguments: PEEL points and rebuttals.",
        "Debate night is close. Build PEEL points with named sources, fix jumbled notes, and plan rebuttals that answer the other side."),
      items: [["m4-evid-01", "m4-link-02", "m4-explain-03"], ["m4-jumble-01", "m4-jumble-02", "m4-jumble-03"],
              ["m4-cite-04", "m4-side-05", "m4-fair-06"], ["m5-steps-01", "m5-because-02", "m5-strong-03"],
              ["m5-jumble-01", "m5-jumble-02", "m5-jumble-03"]] },
    { kind: "debrief", title: "Debrief", skill: "Reflection" }
  ],
  debrief: {
    block: "F3",
    intro: "Think about your own debate team in class. There are no wrong answers here.",
    prompts: [
      { q: "What went well when your team worked together?", frame: "Our team worked well when ___." },
      { q: "What was hard about working as a team, and what did you do about it?", frame: "It was hard when ___, so we ___." },
      { q: "What will you do differently in your next team?", frame: "Next time, I will ___." }
    ]
  },
  done: "The debate teams are ready, and messages on Signal Point are clearer.",
  stamp: "Signal Point is clear · new passport stamp",
  bringItHome: "Bring it home: find a message in a family or class chat that someone misunderstood (leave out names). What was the barrier? Rewrite it so it works, and show your teacher.",
  // Places on the island map (x, y from 0 to 100; y = 0 is the far side). Sources can be collected where they come from.
  places: [
    { id: "tower", icon: "📡", name: "Radio Tower", x: 50, y: 16, mission: true },
    { id: "src-gran", icon: "☕", name: "Video café", x: 17, y: 30, source: "msg-gran" },
    { id: "src-storm", icon: "⛴️", name: "Ferry port", x: 80, y: 28, source: "msg-storm" },
    { id: "src-ferry", icon: "📮", name: "Post office", x: 30, y: 50, source: "msg-ferry" },
    { id: "src-speech", icon: "🎤", name: "Debate hall", x: 70, y: 47, source: "speech-opp" },
    { id: "src-group", icon: "🛹", name: "Youth club", x: 82, y: 64, source: "msg-group" },
    { id: "src-survey", icon: "🏫", name: "School", x: 52, y: 64, source: "survey-ripple" },
    { id: "dojo", icon: "🥋", name: "Debate Dojo", x: 18, y: 70, go: "#/dojo", say: "Quick rounds to practise PEEL, rebuttals, openings and closings." },
    { id: "gym", icon: "🏋️", name: "Think Gym", x: 52, y: 86, go: "#/gym", say: "Five quick questions at your level." },
    { id: "market", icon: "🕵️", name: "Trust or Bust", x: 30, y: 80, go: "#/game", say: "The market game: can you trust it?" },
    { id: "board", icon: "🏆", name: "Noticeboard", x: 70, y: 80, go: "#/board", say: "Class leaderboards (nicknames only)." }
  ]
};
