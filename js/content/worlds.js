// The archipelago: one fictional island per Grade 7 challenge, in the order of the 2026-27 yearly plan.
// Fictional places let students judge sources and disagree without judging anyone's real home or beliefs.
// "Bring it home" steps then connect each island to the students' own lives and Vietnam.
export const WORLDS = [
  { id: "mirror", challenge: "C1", title: "Who am I?", island: "Mirror Isle", icon: "🪞", lead: "Research, Reflection", weeks: "W1–5" },
  { id: "harvest", challenge: "C2", title: "Beliefs about food", island: "Harvest Key", icon: "🥭", lead: "Analysis, Evaluation", weeks: "W5–10", missions: ["fizz"] },
  { id: "signal", challenge: "C3", title: "Improving communication", island: "Signal Point", icon: "📡", lead: "Communication, Collaboration", weeks: "W10–12" },
  { id: "ember", challenge: "EOS1", title: "Using resources sustainably", island: "Ember Reef", icon: "🌱", lead: "All six skills", weeks: "W13–16" },
  { id: "tomorrow", challenge: "C4", title: "Predicting the future", island: "Tomorrow Rock", icon: "🔭", lead: "Analysis, Evaluation", weeks: "W20–23" },
  { id: "haven", challenge: "C5", title: "What everyone needs", island: "Haven", icon: "🏠", lead: "Collaboration, Evaluation", weeks: "W23–28" },
  { id: "crossings", challenge: "C6", title: "Migration", island: "Crossings Bay", icon: "⛵", lead: "Research, Communication", weeks: "W29–32" },
  { id: "harbour", challenge: "EOS2", title: "Making a difference", island: "Home Harbour", icon: "🤲", lead: "All six skills", weeks: "W33–38" }
];

// Islands open by default in the demo. The teacher page can open or close any island (kept in this browser).
export const DEFAULT_OPEN = ["harvest"];
