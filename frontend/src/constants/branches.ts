export const BRANCH_ABBREVIATIONS: Record<string, string> = {
  "Bachelor of Architecture (B.Arch)": "B.Arch",
  "Bachelor of Business Administration (BBA)": "BBA",
  "Bachelor of Design (B.Des)": "B.Des",
  "Biotechnology": "Biotech",
  "Civil Engineering": "CE",
  "COE (Computer Engineering)": "COE",
  "Computer Science Engineering": "CSE",
  "Computer Science Engineering (Artificial Intelligence)": "CSAI",
  "Computer Science Engineering (Big Data Analytics)": "CSDA",
  "Computer Science Engineering (Data Science)": "CSDS",
  "Computer Science Engineering (IoT)": "CIOT",
  "Doctor of Philosophy (Ph.D)": "Ph.D",
  "Electrical Engineering": "EE",
  "Electronics and Communication Engineering": "ECE",
  "Electronics and Communication Engineering (ECAM)": "ECAM",
  "Electronics Engineering (VLSI Design)": "EVDT",
  "Geoinformatics (GI)": "GI",
  "Information Technology": "IT",
  "Information Technology (Network Security)": "ITNS",
  "Instrumentation and Control Engineering": "ICE",
  "Master of Arts (M.A)": "M.A",
  "Master of Business Administration (MBA)": "MBA",
  "Master of Science (M.Sc)": "M.Sc",
  "Master of Technology (M.Tech)": "M.Tech",
  "Mathematics and Computing (MAC)": "MAC",
  "Mechanical Engineering": "ME",
  "Mechanical Engineering - Electric Vehicles (MEEV)": "MEEV",
  "MPAE (Manufacturing Processes and Automation Engineering)": "MPAE",
};

export const BRANCHES = Object.keys(BRANCH_ABBREVIATIONS) as readonly string[];

export const CAMPUSES = ["Main Campus", "East Campus", "West Campus"] as const;

export type Branch = (typeof BRANCHES)[number];
export type Campus = (typeof CAMPUSES)[number];
