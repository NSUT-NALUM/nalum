export const BRANCHES = [
  "Computer Science Engineering",
  "Electronics and Communication Engineering",
  "Information Technology",
  "Information Technology (Network Secuirty)",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Instrumentation and Control Engineering",
  "MPAE (Manufacturing Processes and Automation Engineering)",
  "COE (Computer Engineering)",
  "Computer Science Engineering (Data Science)",
  "Computer Science Engineering (Artificial Intelligence)",
  "Computer Science Engineering (Big Data Analytics)",
  "Electronics Engineering (VLSI Desgin)",
  "Mathematics and Computing (MAC)",
  "Computer Science Engineering (IoT)",
  "Electronics and Communication Engineering (ECAM)",
  "Geoinformatics (GI)",
  "Mechanical Engineering (MEEV)",
] as const;

export const CAMPUSES = ["Main Campus", "East Campus", "West Campus"] as const;

export type Branch = (typeof BRANCHES)[number];
export type Campus = (typeof CAMPUSES)[number];