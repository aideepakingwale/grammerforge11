import { BarChart3, BrainCircuit, ClipboardCheck, Crown, Eye, FileCheck2, Flame, Gauge, GraduationCap, KeyRound, Medal, MessageSquareText, Radar, ShieldCheck, Sparkles, Target, Timer, Trophy, Wand2 } from "lucide-react";

export const navItems = [
  ["Experience", "#experience"],
  ["Outcomes", "#outcomes"],
  ["Plans", "#plans"],
  ["Sign in", "#auth"]
];

export const heroSignals = [
  ["4", "11+ subjects", "Maths, English, VR and NVR"],
  ["250+", "syllabus skills", "carefully organised practice"],
  ["50m", "exam rhythm", "realistic timed practice"],
  ["24/7", "review support", "clear next-step guidance"]
];

export const subjectReadiness = [
  { subject: "Maths", topic: "Fractions and ratio", score: 84, trend: "+12%", status: "Strong", color: "sky" },
  { subject: "English", topic: "Inference and vocabulary", score: 72, trend: "+6%", status: "Focus", color: "amber" },
  { subject: "Verbal", topic: "Code sequences", score: 79, trend: "+9%", status: "Improving", color: "blue" },
  { subject: "NVR", topic: "Rotation and nets", score: 88, trend: "+15%", status: "Confident", color: "violet" }
];

export const weeklyPlan = [
  ["Mon", "Fractions sprint", "12 min", "Done"],
  ["Tue", "Inference ladder", "18 min", "Next"],
  ["Wed", "NVR rotation set", "15 min", "Ready"],
  ["Thu", "Timed mixed paper", "50 min", "Premium"]
];

export const featureCards = [
  ["Real Exam Engine", "Subject-specific timing, question navigation, review flags, autosave and final result flow.", ClipboardCheck],
  ["Parent Command Centre", "Topic trends, readiness view, study priorities and simple weekly action plans.", BarChart3],
  ["Fresh Practice Builder", "Balanced practice sets across subject, topic, difficulty and question style.", Wand2],
  ["Reward Missions", "Daily streaks, badges, skill trophies and parent-visible motivation loops.", Trophy],
  ["Student Access Built for Families", "Parent-managed student access for children who may not have their own email address.", KeyRound],
  ["Focused Exam Mode", "A calmer, more disciplined test environment for serious timed practice.", ShieldCheck]
];

export const outcomeStats = [
  ["37", "micro-topics reviewed this month", Radar],
  ["91%", "best NVR section accuracy", Eye],
  ["14", "reward missions completed", Medal],
  ["6", "practice quality checks", FileCheck2]
];

export const platformHighlights = [
  ["Realistic papers", "Maths 50 in 50, English comprehension and SPaG, VR speed sets, NVR section timing.", Timer],
  ["Topic-wise analytics", "Every answer rolls up to subject, topic and subtopic so parents know exactly what to practise.", Target],
  ["Deeper answer support", "Clear explanations help students understand why an answer is correct and how to approach similar questions.", MessageSquareText],
  ["Curated practice library", "Practice material is reviewed for variety, syllabus fit and child-friendly clarity.", BrainCircuit],
  ["Confidence scoring", "Readiness blends accuracy, pace, review behaviour and recent trend direction.", Gauge],
  ["Family-first design", "Parents stay in control while students get a simple, age-appropriate learning space.", GraduationCap]
];

export const tiers = [
  { name: "Foundation", label: "Starting line", price: "Free", detail: "10 questions, one subject daily, question-bank only.", icon: Sparkles },
  { name: "Alpha", label: "Status tier", price: "Paid", detail: "50 questions, one subject daily, stronger practice volume.", icon: Flame },
  { name: "Velocity", label: "Results tier", price: "Paid+", detail: "All subjects daily with realistic UK exam patterns.", icon: Target },
  { name: "Apex", label: "Full access", price: "Paid++", detail: "Advanced planning, deeper review, focused exams and family-level progress support.", icon: Crown }
];
