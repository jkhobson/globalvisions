// Mission content: "The Cup Mountain" on Ember Reef (End of Semester 1 project: How can we use resources sustainably?).
// Built from the EOS1 brief and lessons: project launch and research questions (L1), life cycles and renewable resources (L2),
// needs, wants and trade-offs (L3), personal/local/global impacts, the source check and trust scores (L4),
// section slides, charts, perspectives, who should act and peer feedback (L5), and the reflection sheet (L6).
// All places, people, shops and figures here are invented for practice. PearlPop Tea is a made-up shop.
// It practises the project's skills; students still do the real project in their Team Workspace.
//
// Same rules as fizz.js and signal.js: every source has a short and a long text; every item has a simple and a standard stem,
// a hint and an explanation; the right option is listed first and every wrong option says why it doesn't work.
// Sentence jumbles (kind: "order") list their sentences in the right order; each sentence's "why" says what job that place does.

export const GLOSSARY = {
  recyclable: "Can be made into something new after use, if it is sorted and cleaned.",
  landfill: "A place where rubbish is buried in the ground.",
  sponsored: "Paid for by a company, often to sell something.",
  survey: "Asking many people the same questions."
};

export const SOURCES = {
  "ad-cup": {
    kind: "Advert", icon: "🧋", author: "PearlPop Tea, the island's biggest bubble tea shop", year: 2026,
    short: "NEW! Our cups are 100% **recyclable** and kind to the planet. Drink more, worry less!",
    long: "NEW at PearlPop Tea! Our shiny cups are 100% **recyclable** and kind to the planet. Every drink comes with a free straw and a free lid. Drink more, worry less! Buy five drinks this week and get the sixth free."
  },
  "report-waste": {
    kind: "Official report", icon: "♻️", author: "Ember Reef Waste Office, the island council's rubbish and recycling service", year: 2026,
    short: "Our trucks collect about 4,000 drink cups a day. Only about 1 in 10 is recycled. Most go to **landfill**.",
    long: "Yearly Report 2026. Our trucks collect about 4,000 plastic drink cups every day. Only about 1 in 10 is recycled. The rest go to **landfill**, because the cups still have tea and pearls inside, or are mixed with other rubbish. Cups with a shiny coating cannot be recycled on the island at all."
  },
  "post-reef": {
    kind: "Social media post", icon: "📱", author: "@ReefVibes, a lifestyle account. At the bottom: '#ad, **sponsored** by PearlPop Tea'", year: 2026,
    short: "Plastic cups are NOT a problem!! The sea washes everything away. Enjoy your tea 🧋✨",
    long: "Plastic cups are NOT a problem!! 🙄 People worry way too much. The sea washes everything away and the beach still looks amazing. Enjoy your tea 🧋✨ Go and try the new mango flavour today!"
  },
  "news-reef": {
    kind: "News report", icon: "📰", author: "Lan Vo, environment reporter, Reef Daily newspaper", year: 2026,
    short: "Cups are piling up on the beaches, says a marine scientist. A cup factory manager says paper cups would cost more.",
    long: "Cups are piling up on Ember Reef's beaches. 'On our last beach clean, 3 in every 10 pieces of rubbish were drink cups or lids,' said Dr Kai Mendes, a marine scientist at Ember Reef College. Ben Osei, manager of the island's cup factory, said paper cups are possible, 'but they will cost more, and somebody will have to pay.'"
  },
  "survey-eco": {
    kind: "Survey results", icon: "📋", author: "Ember Reef School Eco Club", year: 2026,
    short: "We asked 150 students. 112 buy bubble tea every week. 90 would bring their own cup for a small discount.",
    long: "Eco Club **Survey**, October 2026. We asked 150 students aged 11 to 15 at Ember Reef School. 112 buy bubble tea at least once a week, and most buy two or three drinks. 90 said they would bring their own cup if shops gave a small discount. We did not ask adults or shop owners."
  },
  "leaflet-old": {
    kind: "Leaflet", icon: "📄", author: "Ember Reef Tourist Office", year: 2009,
    short: "Every plastic cup on Ember Reef is recycled into a new cup! Our island is clean and green.",
    long: "Welcome to Ember Reef! Every plastic cup on our island is recycled into a new cup, so our island stays clean and green. Enjoy our golden beaches, our coral reef and our famous tea."
  },
  "voice-farmer": {
    kind: "Interview (written down)", icon: "🍃", author: "Mai Tran, a tea farmer on Ember Reef's hills", year: 2026,
    short: "Shops buy my tea leaves very cheaply. If people buy fewer drinks, I earn less.",
    long: "I grow the tea leaves for the island's bubble tea shops. They buy my leaves very cheaply, so I need to sell a lot. If people buy fewer drinks, I earn less, and my family needs that money. But I also see cups blowing into my fields. I want a fair price, not just more cups."
  }
};

// The job of each sentence in a section slide (Lesson 5: point, evidence, explain, link). Used as the "why" for each place in a jumble.
const SECTION = [
  "A section starts with your Point: the one idea this slide proves.",
  "Next comes the Evidence: a fact or number with its source and year.",
  "Then Explain what the evidence shows ('This shows that…').",
  "Last, Link back to your recommendation: what should the audience do?"
];
const steps = texts => texts.map((t, i) => ({ t, why: SECTION[i] }));

export const ITEMS = [
  /* ---------- Project Launch: research questions (R2) ---------- */
  { id: "r2-ember-01", block: "R2", demand: 0,
    stem: { simple: "Your team chose bubble tea cups. Which research question is best?",
            std: "Your team has chosen plastic bubble tea cups for its project. Which of these is the strongest research question?" },
    options: [
      { t: "How could students on Ember Reef use fewer plastic cups?" },
      { t: "Are plastic cups bad?", trap: "yes-no-question",
        why: "This starts with Are, so it can be answered yes or no. It doesn't say where or who." },
      { t: "What is bubble tea?", trap: "vague-question",
        why: "One quick search answers this. It isn't about a sustainability issue." },
      { t: "How many cups did PearlPop sell on Monday?", trap: "vague-question",
        why: "This is one small number from one day. It's too narrow to explain the issue." }],
    hint: "A strong question can't be answered with yes or no, and names the place, the people and the issue.",
    explain: "The best question starts with How, names the place, the people and the issue, and needs research and evidence to answer." },
  { id: "r2-ember-02", block: "R2", demand: 1,
    stem: { simple: "Which is the best research question for the cup project?",
            std: "Which question would make the strongest research question for a project about drink cups on Ember Reef?" },
    options: [
      { t: "Why do so few drink cups on Ember Reef get recycled?" },
      { t: "Should everyone stop drinking bubble tea forever?", trap: "yes-no-question",
        why: "This starts with Should, so the answer is just yes or no, and it is far too big." },
      { t: "Do students like bubble tea?", trap: "yes-no-question",
        why: "This starts with Do, so it's yes or no. Liking tea isn't the sustainability issue." },
      { t: "What happens to all the things in the world?", trap: "vague-question",
        why: "This is far too broad. Which resource? Which place?" }],
    hint: "Look for a question that starts with How, Why or What, and is about one resource in one place.",
    explain: "'Why do so few cups get recycled?' is focused on one resource and one place, and you need evidence to answer it." },
  { id: "r2-ember-03", block: "R2", demand: 2,
    stem: { simple: "Your teammate wrote: 'Is plastic bad for Ember Reef?' Which question is a better one?",
            std: "Your teammate's draft research question is 'Is plastic bad for Ember Reef?'. Which version turns it into a strong research question?" },
    options: [
      { t: "To what extent do plastic cups harm Ember Reef's beaches?" },
      { t: "Is plastic really very bad for Ember Reef?", trap: "yes-no-question",
        why: "Adding 'really very' doesn't help. It still starts with Is, so the answer is yes or no." },
      { t: "Is plastic bad for the whole world?", trap: "yes-no-question",
        why: "This is bigger, not better, and it can still be answered with yes or no." },
      { t: "What colour are the cups on Ember Reef?", trap: "vague-question",
        why: "This needs no research and says nothing about the cups' impact." }],
    hint: "Starting with 'To what extent' or 'How' turns a yes/no question into one you must research.",
    explain: "'To what extent' asks how much, so you must weigh evidence. It also names one resource (cups) and one place." },

  /* ---------- Project Launch: life cycles and renewable resources (L1) ---------- */
  { id: "l1-stage-01", block: "L1", demand: 0,
    stem: { simple: "A cup's life cycle: origin, make, use, end. Which stage is 'Oil is pumped out of the ground'?",
            std: "A plastic cup's life cycle has four stages: origin, make, use and end of life. Which stage is 'Oil is pumped out of the ground'?" },
    options: [
      { t: "Origin" },
      { t: "Make", why: "Make is when a factory turns materials into the product. Has the oil reached a factory yet?" },
      { t: "Use", why: "Use is when people drink from the cup. Nobody has a cup yet." },
      { t: "End of life", why: "End of life is what happens after use: reuse, recycle or rubbish." }],
    hint: "Where does the cup's material come from before anything is made?",
    explain: "The origin is where the material comes from. Plastic cups start as oil taken from the ground." },
  { id: "l1-renew-02", block: "L1", demand: 1,
    stem: { simple: "Which part of a bubble tea comes from a non-renewable resource?",
            std: "A bubble tea uses several resources. Which one is non-renewable, so it will run out?" },
    options: [
      { t: "The oil used to make the plastic cup" },
      { t: "The tea leaves grown on the hills",
        why: "Tea plants grow again each year, so tea is renewable if farms are cared for." },
      { t: "The sunlight that helps the tea grow",
        why: "Sunlight arrives again every day, so it is renewable." },
      { t: "The rainwater used to brew the tea",
        why: "Rain refills water, so it is renewable, though it can still be overused." }],
    hint: "Non-renewable means nature can't replace it in our lifetime, like oil or coal.",
    explain: "Oil takes millions of years to form, so it is non-renewable. Tea, sunlight and rain can be replaced by nature." },
  { id: "l1-end-03", block: "L1", demand: 2, source: "report-waste",
    stem: { simple: "Which stage of the cup's life cycle does this report tell you most about?",
            std: "Read the Waste Office report. Which stage of a cup's life cycle does it give you the most evidence about?" },
    options: [
      { t: "End of life: after the drink" },
      { t: "Origin: where the plastic comes from",
        why: "The report doesn't mention oil or where the plastic comes from." },
      { t: "Make: how the factory makes cups",
        why: "The factory isn't in this report. Look at what the trucks collect." },
      { t: "Use: how many drinks people buy",
        why: "It counts cups collected as rubbish, not drinks being bought." }],
    hint: "Look at what the report counts. Where are the cups when the trucks collect them?",
    explain: "The report is about cups after use: collected, recycled or sent to landfill. That's the end of the life cycle." },

  /* ---------- Project Launch: needs, wants and trade-offs (N1) ---------- */
  { id: "n1-need-01", block: "N1", demand: 0,
    stem: { simple: "Which of these is a need, not a want?",
            std: "A need is something you must have to survive and live safely. Which of these is a need?" },
    options: [
      { t: "Clean drinking water" },
      { t: "A large mango bubble tea", why: "Tea is nice, but you could live without it. That makes it a want." },
      { t: "A new phone case", why: "A phone case is useful, but nobody needs one to live safely." },
      { t: "A games console", why: "It's fun, but you can live safely without it." }],
    hint: "Could you survive and stay safe without it?",
    explain: "You can't live without clean water, so it is a need. The others make life easier or more fun, so they are wants." },
  { id: "n1-trade-02", block: "N1", demand: 1,
    stem: { simple: "In the balloon debate your team kept medicine and gave up the phone. Which sentence explains the trade-off best?",
            std: "In the balloon debate, your team kept medicine and threw out the phone. Which sentence explains your trade-off best?" },
    options: [
      { t: "We kept medicine instead of a phone because it keeps us alive, even though we can't call home." },
      { t: "We kept medicine because medicine is good.",
        why: "This gives the choice but not what you gave up. A trade-off names both." },
      { t: "Phones are boring, so we didn't want one.",
        why: "This is an opinion with no real reason, and it doesn't say what you gained." },
      { t: "We kept medicine. The end.",
        why: "There's no reason and no trade-off, so others can't understand your choice." }],
    hint: "Use the frame: We chose ___ instead of ___ because ___, even though ___.",
    explain: "A strong trade-off sentence says what you chose, what you gave up, why, and what it cost you." },
  { id: "n1-agree-03", block: "N1", demand: 2,
    stem: { simple: "Two teammates want to keep the internet. Two want the bicycle. What should the team do next?",
            std: "In your balloon debate, two teammates want to keep internet access and two want the bicycle. What is the best next step for the team?" },
    options: [
      { t: "Each side gives its reason, then the team decides" },
      { t: "The loudest person decides for everyone", trap: "unfair-roles",
        why: "Then only one voice counts. Everyone in the team should be heard." },
      { t: "Keep both and throw out the clean water",
        why: "Water is a need. Giving up a need to keep two wants is a poor trade-off." },
      { t: "Stop talking and leave the slide empty", trap: "shut-down",
        why: "Leaving it empty doesn't finish the task. The team still needs to agree." }],
    hint: "How can a team agree fairly when people disagree?",
    explain: "Hearing each side's reasons, then deciding together, is fair and helps the team reach a shared outcome." },

  /* ---------- Project Launch: team roles (T1) ---------- */
  { id: "t1-ember-01", block: "T1", demand: 0,
    stem: { simple: "Which team role finds the statistics and plans the chart?",
            std: "Your project team has four roles. Who is responsible for finding the statistics and planning the team's chart?" },
    options: [
      { t: "The Data analyst" },
      { t: "The Designer", why: "The Designer makes the slides clear and consistent, not the statistics." },
      { t: "The Leader", why: "The Leader keeps the team on task and on time, and makes sure everyone is heard." },
      { t: "Nobody: charts are optional", why: "The presentation must have at least one chart, so someone has to plan it." }],
    hint: "Which role's name is about numbers?",
    explain: "The Data analyst finds the statistics and plans the chart. Everyone still writes and presents one section." },
  { id: "t1-ember-02", block: "T1", demand: 1,
    stem: { simple: "Your team has 5 people. The roles are Leader, Researcher, Data analyst and Designer. What does the 5th person do?",
            std: "A team of five has four roles: Leader, Researcher, Data analyst and Designer. What role does the fifth person take?" },
    options: [
      { t: "A second Researcher" },
      { t: "A second Leader", why: "Two leaders can pull the team in different directions." },
      { t: "Nothing: they just watch", trap: "unfair-roles",
        why: "Everyone must research, write and present one section. Nobody just watches." },
      { t: "The teacher's helper", why: "The teacher checks the work, but each student belongs to the team's work." }],
    hint: "Which job has the most to do: finding and checking lots of sources?",
    explain: "In a team of five, two people share the Researcher role, because finding and checking sources is a big job." },
  { id: "t1-ember-03", block: "T1", demand: 2,
    stem: { simple: "Tavi is the Designer. Tavi says: 'I only make the slides look nice, so I don't need to research.' What's wrong?",
            std: "Tavi, the team's Designer, says: 'My job is making the slides look good, so I don't need to do any research.' What is the problem?" },
    options: [
      { t: "Every role also researches and presents a section" },
      { t: "Nothing: designers never research", trap: "unfair-roles",
        why: "Every student, whatever their role, writes a section, and that needs research." },
      { t: "Tavi should do everyone's research instead", trap: "unfair-roles",
        why: "That's unfair the other way. Each person researches their own section." },
      { t: "Tavi should swap roles with the Leader",
        why: "Swapping roles doesn't fix it. The rule is the same for every role." }],
    hint: "What does every student do, whatever their role?",
    explain: "Roles add a job; they don't replace the shared work. Everyone researches, writes and presents one section." },

  /* ---------- Source Lab: personal, local and global impacts (I1) ---------- */
  { id: "i1-sort-01", block: "I1", demand: 0,
    stem: { simple: "What kind of impact is this? 'I throw away about 3 cups every week.'",
            std: "Sort this impact: 'I throw away about three bubble tea cups every week.' Is it personal, local or global?" },
    options: [
      { t: "Personal" },
      { t: "Local", why: "Local means a city or a country. This is about one person's own life." },
      { t: "Global", why: "Global means the whole world. This is only about one person." },
      { t: "No impact at all", why: "Cups that are thrown away go somewhere, so there is an impact." }],
    hint: "Who is this about: you, your city or country, or the whole world?",
    explain: "It is about one person's own habits, so it is a personal impact." },
  { id: "i1-sort-02", block: "I1", demand: 1, source: "report-waste",
    stem: { simple: "What kind of impact does this report show?",
            std: "Read the Waste Office report. Which kind of impact does it give evidence about?" },
    options: [
      { t: "Local: on Ember Reef" },
      { t: "Personal: on one family", why: "The report counts cups from the whole island, not from one family." },
      { t: "Global: on the whole world", why: "It only counts cups on Ember Reef, not around the world." },
      { t: "No impact: the cups are collected", why: "Collected cups mostly go to landfill. That is still an impact." }],
    hint: "Whose rubbish does the report count?",
    explain: "The report is about one island's rubbish, so it shows a local impact. In your project, local means Vietnam or your city." },
  { id: "i1-sort-03", block: "I1", demand: 2,
    stem: { simple: "Your team needs one global impact of plastic cups. Which one is it?",
            std: "Your Sources slide needs a personal, a local and a global impact. Which of these is the global impact of plastic cups?" },
    options: [
      { t: "Plastic reaches oceans all over the world" },
      { t: "Cups fill the bins at Ember Reef School", why: "That's about one school on the island, so it's a local impact." },
      { t: "I spend pocket money on drinks each week", why: "That's about you and your money, so it's a personal impact." },
      { t: "The island's beach clean found many lids", why: "That's about one island's beach, so it's a local impact." }],
    hint: "Global means it affects people and places around the whole world.",
    explain: "Plastic from many countries ends up in the world's oceans, so it is a global impact." },

  /* ---------- Source Lab: who made it and why (E1) ---------- */
  { id: "e1-ember-01", block: "E1", demand: 0, source: "ad-cup",
    stem: { simple: "Who made this advert, and why?",
            std: "Read to the end. Who made this advert, and what is its purpose?" },
    options: [
      { t: "A tea shop, to sell more drinks" },
      { t: "Scientists, to share research", trap: "author-not-checked",
        why: "Check the line at the bottom. There's no research in this advert." },
      { t: "The Waste Office, to warn people", trap: "author-not-checked",
        why: "The Waste Office didn't make this. Read who it's by." },
      { t: "Students, to start a debate", trap: "author-not-checked",
        why: "Read the line at the bottom. It wasn't made by students." }],
    hint: "Look at the line under the text. What does the maker want you to do?",
    explain: "PearlPop Tea made it to sell drinks ('Buy five drinks'). A company that sells cups may only show the good side." },
  { id: "e1-ember-02", block: "E1", demand: 1, source: "post-reef",
    stem: { simple: "Why should you be careful with this post?",
            std: "Read the whole post, including the line at the bottom. What is the main reason to be careful with it?" },
    options: [
      { t: "PearlPop paid for it" },
      { t: "It uses too many emojis", trap: "emotive-hook",
        why: "Emojis don't make a post true or false. Check who is behind it." },
      { t: "It is about the sea", why: "The topic is fine. The problem is who is behind the post." },
      { t: "It is too old", trap: "old-source", why: "It was posted in 2026, so the date isn't the problem here." }],
    hint: "Read the last line about the author. What does '#ad' mean?",
    explain: "It is sponsored by PearlPop Tea, the shop that sells the cups. A paid post has a reason to say cups are fine, and gives no evidence." },
  { id: "e1-ember-03", block: "E1", demand: 2, source: "news-reef",
    stem: { simple: "What is the main purpose of this news report?",
            std: "Who wrote this news report, and what is its main purpose?" },
    options: [
      { t: "To inform, with more than one view" },
      { t: "To sell paper cups", trap: "vested-interest-missed",
        why: "The reporter isn't selling anything. A factory manager is quoted, but he isn't the author." },
      { t: "To make readers angry at students", trap: "emotive-hook",
        why: "It doesn't blame students. It reports what a scientist and the factory say." },
      { t: "To entertain with a funny story", why: "It's a serious report with quotes from experts, not a joke." }],
    hint: "Who is quoted? Does the reporter want you to buy something?",
    explain: "A reporter wrote it to inform. It quotes a scientist and the factory manager, so it shows more than one side: that's balance." },

  /* ---------- Source Lab: trust scores (E2) ---------- */
  { id: "e2-ember-01", block: "E2", demand: 0, source: "leaflet-old",
    stem: { simple: "Your teammate wants to use this leaflet. What is the biggest problem?",
            std: "A teammate wants to use this leaflet as evidence that cups are recycled. Using the source check, what is its biggest problem?" },
    options: [
      { t: "It was made in 2009" },
      { t: "It is too short", trap: "old-source", why: "Short sources can still be useful. Check when it was made." },
      { t: "It is about tea", trap: "old-source", why: "The topic fits your project. Look at the date." },
      { t: "It has no pictures", trap: "old-source", why: "Pictures don't make a source more reliable. Check the date." }],
    hint: "Use the source check: who, purpose, date, balance. Which one is a problem here?",
    explain: "It is from 2009, so it may no longer be true. It was also made to attract tourists, not to give data." },
  { id: "e2-ember-02", block: "E2", demand: 1, source: "report-waste",
    stem: { simple: "What trust score (1 to 5) fits this report, and why?",
            std: "Give this report a trust score from 1 (don't trust) to 5 (trust a lot). Which score and reason fit best?" },
    options: [
      { t: "4 or 5: the council counted it" },
      { t: "1: governments always lie", trap: "all-or-nothing",
        why: "That's all or nothing. A council counting its own trucks' rubbish is a strong source." },
      { t: "1: it is boring to read", why: "Boring isn't a reason to distrust. Ask who made it and why." },
      { t: "2: it is too old", trap: "old-source", why: "The report is from 2026, so the date isn't the problem." }],
    hint: "Who made it? Do they gain anything by changing the numbers?",
    explain: "The Waste Office counts the cups itself, the report is recent, and it isn't selling anything, so it earns a high trust score." },
  { id: "e2-ember-03", block: "E2", demand: 2,
    stem: { simple: "Which source should you trust most about how many cups are recycled?",
            std: "Your team has four sources about cup recycling on Ember Reef. Which one deserves the highest trust score?" },
    options: [
      { t: "The Waste Office report (2026)" },
      { t: "PearlPop Tea's advert (2026)", trap: "vested-interest-missed",
        why: "PearlPop wants to sell drinks, so it may only show the good side." },
      { t: "The @ReefVibes post (2026)", trap: "vested-interest-missed",
        why: "The post was paid for by PearlPop and gives no evidence." },
      { t: "The Tourist Office leaflet (2009)", trap: "old-source",
        why: "It's from 2009, and it was made to attract visitors." }],
    hint: "Check all four: who, purpose, date and balance.",
    explain: "The Waste Office counts the cups itself, is recent and isn't selling anything. The others want to sell, were paid, or are out of date." },

  /* ---------- Source Lab: recording sources (R4) ---------- */
  { id: "r4-ref-01", block: "R4", demand: 0,
    stem: { simple: "Which is a full reference for your Sources slide?",
            std: "Each source on your Sources slide needs the title, author, date and link. Which reference is complete?" },
    options: [
      { t: "Waste Office, 'Yearly Report', 2026, + link" },
      { t: "I found it on Google", why: "Google is a search tool, not the source. Name who made it." },
      { t: "A report about cups", why: "This has no author, date or link, so nobody can find it again." },
      { t: "The chatbot told me", trap: "chatbot-source",
        why: "A chatbot is not a source. Find the fact in a real source." }],
    hint: "Could someone else find this exact source again from what you wrote?",
    explain: "A full reference names the author, the title, the date and the link, so anyone can find and check it." },
  { id: "r4-chat-02", block: "R4", demand: 1,
    stem: { simple: "A chatbot says '9 in 10 cups are not recycled.' What should you do first?",
            std: "A chatbot tells you that nine out of ten cups are not recycled. What should you do before you use this number?" },
    options: [
      { t: "Find it in a real source and cite that" },
      { t: "Cite the chatbot as your source", trap: "chatbot-source",
        why: "A chatbot is not a source. It can even make numbers up." },
      { t: "Use it: chatbots are always right", trap: "chatbot-source",
        why: "Chatbots can be wrong, and the project rules say a chatbot is not a source." },
      { t: "Make the number bigger to shock people", trap: "changed-data",
        why: "Changing data is dishonest. Give each number exactly as the source gives it." }],
    hint: "What do the project's AI rules say about chatbots?",
    explain: "AI can help you understand, but a chatbot is not a source. Find the number in a real source, like the Waste Office report, and cite that." },
  { id: "r4-fact-03", block: "R4", demand: 2, source: "survey-eco",
    stem: { simple: "Which key fact from this survey would you write on your Sources slide?",
            std: "You need one key fact from this survey, in your own words, for your Sources slide. Which one is accurate?" },
    options: [
      { t: "90 of 150 students would bring a cup for a discount" },
      { t: "All students on the island love bubble tea", trap: "wrong-group",
        why: "It asked 150 students if they buy tea, not if they love it, and not all students." },
      { t: "Adults on the island buy three drinks a day", trap: "wrong-group",
        why: "The survey says it did not ask adults." },
      { t: "Bubble tea is bad for everyone's health", trap: "claim-no-evidence",
        why: "The survey says nothing about health. Record what it actually found." }],
    hint: "Read the survey to the end. Who did it ask, and what did it find?",
    explain: "A key fact says exactly what the source found, about the people it asked. Keep the numbers as the source gives them." },

  /* ---------- Pitch Room: data and charts (D1) ---------- */
  { id: "d1-chart-01", block: "D1", demand: 0,
    stem: { simple: "You want to show how many cups are recycled out of all the cups. Which chart is best?",
            std: "You want to show what part of all collected cups is recycled, and what part goes to landfill. Which chart fits best?" },
    options: [
      { t: "A pie chart" },
      { t: "A line graph", trap: "wrong-chart", why: "A line graph shows change over time. Is your data about time?" },
      { t: "A table of 100 numbers", trap: "wrong-chart", why: "A table suits lots of exact numbers. You have parts of one whole." },
      { t: "A map of the island", trap: "wrong-chart", why: "A map shows where things are, not parts of a whole." }],
    hint: "Your data is the parts of one whole. Which chart shows that?",
    explain: "A pie chart shows the parts of a whole, like recycled cups compared with all the cups collected." },
  { id: "d1-chart-02", block: "D1", demand: 1,
    stem: { simple: "You want to compare how many cups three schools threw away. Which chart is best?",
            std: "You want to compare the number of cups that three schools threw away last month. Which chart fits best?" },
    options: [
      { t: "A bar chart" },
      { t: "A pie chart", trap: "wrong-chart", why: "A pie chart shows parts of one whole, not three separate amounts." },
      { t: "A line graph", trap: "wrong-chart", why: "A line graph shows change over time. You're comparing three amounts." },
      { t: "A life cycle diagram", trap: "wrong-chart", why: "A life cycle diagram shows stages, not amounts." }],
    hint: "You are comparing amounts side by side.",
    explain: "A bar chart compares amounts, so the three schools can be seen side by side." },
  { id: "d1-sent-03", block: "D1", demand: 2, source: "report-waste",
    stem: { simple: "Which evidence sentence uses this report best?",
            std: "Your section slide needs an evidence sentence with an in-text reference. Which one uses this report best?" },
    options: [
      { t: "According to the Waste Office (2026), only 1 in 10 cups is recycled. This shows most are wasted." },
      { t: "The Waste Office says lots of cups are bad, which proves everyone must stop.",
        why: "'Lots' isn't the number the source gives, and 'everyone must stop' goes too far." },
      { t: "Only 1 in 10 cups is recycled, so we are right about everything.",
        why: "There's no source or year, and it doesn't explain what the number shows." },
      { t: "According to the Waste Office (2026), 9 in 10 cups are recycled. This shows it's fine.", trap: "changed-data",
        why: "Check the number. Give it exactly as the source gives it." }],
    hint: "Use 'According to ... (year), ...', give the exact number, then 'This shows that ...'.",
    explain: "A strong evidence sentence names the source and year, gives the number exactly, and explains what it shows." },

  /* ---------- Pitch Room: section slide jumbles (M4) ---------- */
  { id: "m4-ember-01", block: "M4", demand: 0, kind: "order",
    stem: { simple: "Put this section slide in order: point, evidence, explain, link.",
            std: "Tap these sentences into the order of a strong section slide: point, evidence, explanation, then a link to the recommendation." },
    parts: steps([
      "Plastic cups are a big problem on Ember Reef.",
      "According to the Waste Office (2026), only 1 in 10 cups is recycled.",
      "This shows that most cups end up in landfill.",
      "So, students should bring their own cups to buy tea."]),
    hint: "Point, Evidence, Explain, Link. Which sentence has the source? Which one says 'So'?",
    explain: "A section slide gives one idea, proves it with a sourced fact, explains it, and links to what the audience should do." },
  { id: "m4-ember-02", block: "M4", demand: 1, kind: "order",
    stem: { simple: "Put this section slide about farmers in order: point, evidence, explain, link.",
            std: "This section slide is about the producers' view. Tap the sentences into the order point, evidence, explanation, link." },
    parts: steps([
      "Cheap tea prices hurt farmers on Ember Reef.",
      "Tea farmer Mai Tran (2026) says shops buy her leaves 'very cheaply'.",
      "This means farmers must sell more tea just to earn enough.",
      "So, PearlPop Tea should pay farmers a fair price."]),
    hint: "The evidence is the one that names who said it and when. The link says what someone should do.",
    explain: "Even a slide about producers follows the same shape: point, sourced evidence, what it means, then the recommendation." },
  { id: "m4-ember-03", block: "M4", demand: 2, kind: "order",
    stem: { simple: "Put this section slide in order. There are no signal words this time.",
            std: "This section slide has no signal words to help you. Tap the sentences into the order point, evidence, explanation, link." },
    parts: steps([
      "Students could cut cup waste quickly.",
      "In the Eco Club survey (2026), 90 of 150 students said they would bring their own cup for a discount.",
      "Many students are ready to change if it saves them money.",
      "Shops on Ember Reef should give a discount to anyone who brings a cup."]),
    hint: "Find the sentence with a number and a source first. What comes before the proof, and what comes after?",
    explain: "Without signal words the shape is the same: the idea, the proof with its source, what it means, then who should act." },

  /* ---------- Pitch Room: perspectives and who should act (P1) ---------- */
  { id: "p1-voice-01", block: "P1", demand: 0, source: "voice-farmer",
    stem: { simple: "Whose perspective is this?",
            std: "Your presentation needs producers, manufacturers, consumers and waste authorities. Whose perspective does this interview give?" },
    options: [
      { t: "A producer" },
      { t: "A consumer", trap: "one-perspective", why: "Consumers buy and use the product. Mai grows the tea." },
      { t: "A waste authority", trap: "one-perspective", why: "Waste authorities deal with rubbish. Mai works at the start of the life cycle." },
      { t: "A manufacturer", trap: "one-perspective", why: "Manufacturers turn materials into products in factories. Mai grows the leaves." }],
    hint: "Producers take the resource from nature: farmers, miners and growers.",
    explain: "Mai grows the tea, so she is a producer. Her view shows that using less can hurt people at the start of the life cycle." },
  { id: "p1-missing-02", block: "P1", demand: 1,
    stem: { simple: "A team quoted a tea farmer, the cup factory and students who buy tea. Whose voice is missing?",
            std: "A team's presentation quotes a tea farmer, the cup factory manager and students who buy bubble tea. Which perspective is still missing?" },
    options: [
      { t: "The waste authority" },
      { t: "Another student who buys tea", trap: "one-perspective",
        why: "Consumers are already in. Who deals with the cups after use?" },
      { t: "The cup factory manager again", trap: "one-perspective",
        why: "Manufacturers are already in. Think about the end of the life cycle." },
      { t: "A second tea farmer", trap: "one-perspective",
        why: "Producers are already in. Who handles the rubbish?" }],
    hint: "Go through the life cycle: who grows it, who makes it, who uses it, who deals with it at the end?",
    explain: "The team has producers, a manufacturer and consumers. The Waste Office would add the view from the end of the life cycle." },
  { id: "p1-act-03", block: "P1", demand: 2,
    stem: { simple: "Which recommendation to the island council is best supported by evidence?",
            std: "Your audience is the island council. Which recommendation says who should act and is best justified by evidence?" },
    options: [
      { t: "Shops give a discount for own cups: 90 of 150 students would use one" },
      { t: "Ban every drink on the island tomorrow, because cups are bad",
        why: "This is far too extreme, and 'cups are bad' gives no evidence." },
      { t: "Do nothing at all, because the sea washes the cups away",
        why: "That claim comes from a paid post with no evidence behind it." },
      { t: "Make students feel guilty every time they buy a bubble tea",
        why: "Guilt isn't an action. Who should do what, and what evidence shows it works?" }],
    hint: "A strong recommendation says who should act, what they should do, and which evidence shows it would work.",
    explain: "It names who should act (shops), what to do (a discount), and gives evidence from the survey that students would take part." },

  /* ---------- Pitch Room: peer feedback (G1) ---------- */
  { id: "g1-fb-01", block: "G1", demand: 0,
    stem: { simple: "Which feedback helps another team the most?",
            std: "You listened to another team's draft. Which piece of feedback is kind, specific and helpful?" },
    options: [
      { t: "Your pie chart made the recycling problem clear." },
      { t: "It was good.", trap: "vague-feedback", why: "Kind, but not specific. What exactly was good?" },
      { t: "You need more stuff.", trap: "vague-feedback", why: "Which stuff? The team can't act on this." },
      { t: "I didn't like it.", trap: "vague-feedback", why: "This isn't kind or specific, and gives no way to improve." }],
    hint: "Good feedback is kind, specific and linked to the success criteria.",
    explain: "It names exactly what worked (the pie chart) and why (it made the problem clear), so the team knows what to keep." },
  { id: "g1-fb-02", block: "G1", demand: 1,
    stem: { simple: "Another team's slides have numbers but no sources. Which suggestion helps most?",
            std: "Another team's draft has statistics but no sources on the slides. Which suggestion would help them most?" },
    options: [
      { t: "Add the source and year under each number" },
      { t: "Your numbers are probably all fake", trap: "attack-person",
        why: "This sounds like an attack and gives them no way to fix it." },
      { t: "Make the numbers bigger so they shock people", trap: "changed-data",
        why: "Changing data is dishonest. The problem is the missing sources." },
      { t: "Take all the numbers out", why: "Data makes an argument stronger. Keep it and add the sources." }],
    hint: "Which suggestion matches a rule from the checklist: every statistic has a source?",
    explain: "A useful suggestion is specific and can be acted on: add the source and year for every statistic." },
  { id: "g1-fb-03", block: "G1", demand: 2,
    stem: { simple: "Which comment best judges how a team used its evidence?",
            std: "You are judging another team's argument. Which comment best judges how well they used evidence?" },
    options: [
      { t: "Strong survey data, but one survey can't speak for the whole island" },
      { t: "Your slides are a really nice colour", trap: "vague-feedback",
        why: "Colour isn't evidence. Judge how the argument uses its data." },
      { t: "I agree with you, so your argument is great",
        why: "Agreeing isn't judging. Say what the evidence does well or badly." },
      { t: "You talked a bit too fast", why: "That's about delivery. The question asks about the evidence." }],
    hint: "Judging evidence means saying what it shows well, and what it can't show.",
    explain: "It praises the data and names its limit (who was asked). That helps the team add another source to make the argument stronger." }
];

const phaseIntro = (simple, std) => ({ simple, std });
export const MISSION = {
  id: "ember", world: "ember", title: "The Cup Mountain",
  from: "🌊 Message from the Ember Reef Council",
  brief: {
    simple: "Agent, Ember Reef has a cup problem. People buy lots of bubble tea, and the plastic cups are piling up. The island council wants a team presentation: how can the island use cups more sustainably? Plan the project, check the sources, and build a strong pitch.",
    std: "Agent, Ember Reef is buried in bubble tea cups. The island council will listen to one team presentation before it decides what to do. Plan the project, follow the cup's life cycle, check which sources you can trust, and build a persuasive pitch with data and a clear recommendation."
  },
  phases: [
    { kind: "briefing", title: "Project Launch", skill: "Research",
      items: [["r2-ember-01", "r2-ember-02", "r2-ember-03"], ["l1-stage-01", "l1-renew-02", "l1-end-03"],
              ["n1-need-01", "n1-trade-02", "n1-agree-03"], ["t1-ember-01", "t1-ember-02", "t1-ember-03"]] },
    { kind: "dossier", title: "Source Lab", skill: "Evaluation", icon: "🔬", go: "Open the lab",
      intro: phaseIntro("Now find the impacts and check the sources. Read each source to the end.",
        "The team has collected sources from all over the island. Sort the impacts, check who made each source and why, give trust scores, and record the facts properly."),
      items: [["i1-sort-01", "i1-sort-02", "i1-sort-03"], ["e1-ember-01", "e1-ember-02", "e1-ember-03"],
              ["e2-ember-01", "e2-ember-02", "e2-ember-03"], ["r4-ref-01", "r4-chat-02", "r4-fact-03"]] },
    { kind: "board", title: "Pitch Room", skill: "Communication", icon: "📊", go: "Go to the pitch room",
      intro: phaseIntro("Now build the presentation: charts, section slides, perspectives and feedback.",
        "The council meeting is close. Pick the right charts, build section slides, make sure every voice is heard, choose who should act, and give another team useful feedback."),
      items: [["d1-chart-01", "d1-chart-02", "d1-sent-03"], ["m4-ember-01", "m4-ember-02", "m4-ember-03"],
              ["p1-voice-01", "p1-missing-02", "p1-act-03"], ["g1-fb-01", "g1-fb-02", "g1-fb-03"]] },
    { kind: "debrief", title: "Debrief", skill: "Reflection" }
  ],
  debrief: {
    block: "F4",
    intro: "Think about your own team's project, not Ember Reef. There are no wrong answers here. It's good practice for your reflection sheet in Lesson 6.",
    prompts: [
      { q: "What did you think about your team's resource before the project? What do you think now?", frame: "Before, I thought ___. Now I think ___." },
      { q: "Which piece of evidence changed your mind the most?", frame: "The evidence that changed my mind was ___ from ___, because ___." },
      { q: "Which skill improved the most, and what will you do differently from now on?", frame: "My ___ skill improved the most. From now on, I will ___." }
    ]
  },
  done: "The council has a strong pitch, and Ember Reef has a plan for its cups.",
  stamp: "Ember Reef is cleaner · new passport stamp",
  bringItHome: "Bring it home: open your Team Workspace. Check one of your own sources with who, purpose, date and balance, give it a trust score, and write one evidence sentence with 'According to … (year)'.",
  // Places on the island map (x, y from 0 to 100; y = 0 is the far side). Sources can be collected where they come from.
  places: [
    { id: "hall", icon: "🏛️", name: "Council Hall", x: 50, y: 14, mission: true },
    { id: "src-farm", icon: "🍃", name: "Tea hills", x: 18, y: 26, source: "voice-farmer" },
    { id: "src-tourist", icon: "ℹ️", name: "Tourist office", x: 82, y: 26, source: "leaflet-old" },
    { id: "src-shop", icon: "🧋", name: "PearlPop Tea", x: 32, y: 44, source: "ad-cup" },
    { id: "src-news", icon: "📰", name: "Reef Daily", x: 68, y: 42, source: "news-reef" },
    { id: "src-waste", icon: "♻️", name: "Waste Office", x: 84, y: 60, source: "report-waste" },
    { id: "src-school", icon: "🏫", name: "School", x: 52, y: 62, source: "survey-eco" },
    { id: "src-beach", icon: "🏖️", name: "Beach", x: 16, y: 62, source: "post-reef" },
    { id: "gym", icon: "🏋️", name: "Think Gym", x: 52, y: 86, go: "#/gym", say: "Five quick questions at your level." },
    { id: "market", icon: "🕵️", name: "Trust or Bust", x: 28, y: 82, go: "#/game", say: "The market game: can you trust it?" },
    { id: "board", icon: "🏆", name: "Noticeboard", x: 76, y: 82, go: "#/board", say: "Class leaderboards (nicknames only)." }
  ]
};
