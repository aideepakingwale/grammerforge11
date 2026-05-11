import type { Subject } from "@/backend/shared/types";

export type ExamSectionPattern = {
  name: string;
  questionCount: number;
  durationMinutes: number;
  topicSlugs: string[];
};

export type ExamPattern = {
  subject: Subject;
  label: string;
  examBoard: "UK_11_PLUS_COMPOSITE";
  totalQuestions: number;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarking: boolean;
  passBenchmarkPercent: number;
  sections: ExamSectionPattern[];
};

export const examPatterns: Record<Subject, ExamPattern> = {
  MATHS: {
    subject: "MATHS",
    label: "Maths 11+ Standard Paper",
    examBoard: "UK_11_PLUS_COMPOSITE",
    totalQuestions: 50,
    durationMinutes: 50,
    marksPerQuestion: 1,
    negativeMarking: false,
    passBenchmarkPercent: 80,
    sections: [
      { name: "Number, operations and FDP", questionCount: 20, durationMinutes: 20, topicSlugs: ["number-place-value", "four-operations", "fractions-decimals-percentages"] },
      { name: "Algebra, ratio and measure", questionCount: 14, durationMinutes: 14, topicSlugs: ["ratio-proportion", "algebra-sequences", "measurement", "speed-distance-time"] },
      { name: "Geometry, data and reasoning", questionCount: 16, durationMinutes: 16, topicSlugs: ["geometry-2d", "geometry-3d", "perimeter-area-volume", "statistics-data", "word-problems"] }
    ]
  },
  ENGLISH: {
    subject: "ENGLISH",
    label: "English 11+ Standard Paper",
    examBoard: "UK_11_PLUS_COMPOSITE",
    totalQuestions: 60,
    durationMinutes: 50,
    marksPerQuestion: 1,
    negativeMarking: false,
    passBenchmarkPercent: 80,
    sections: [
      { name: "Reading comprehension", questionCount: 30, durationMinutes: 25, topicSlugs: ["reading-comprehension"] },
      { name: "Vocabulary", questionCount: 12, durationMinutes: 10, topicSlugs: ["vocabulary"] },
      { name: "SPaG and spelling", questionCount: 18, durationMinutes: 15, topicSlugs: ["grammar-spag", "punctuation", "spelling"] }
    ]
  },
  VERBAL_REASONING: {
    subject: "VERBAL_REASONING",
    label: "Verbal Reasoning 11+ Standard Paper",
    examBoard: "UK_11_PLUS_COMPOSITE",
    totalQuestions: 80,
    durationMinutes: 50,
    marksPerQuestion: 1,
    negativeMarking: false,
    passBenchmarkPercent: 82,
    sections: [
      { name: "GL-style verbal reasoning", questionCount: 60, durationMinutes: 37, topicSlugs: ["gl-21-question-types"] },
      { name: "CEM-style vocabulary and logic", questionCount: 20, durationMinutes: 13, topicSlugs: ["cem-verbal-reasoning"] }
    ]
  },
  NON_VERBAL_REASONING: {
    subject: "NON_VERBAL_REASONING",
    label: "Non-Verbal Reasoning 11+ Standard Paper",
    examBoard: "UK_11_PLUS_COMPOSITE",
    totalQuestions: 80,
    durationMinutes: 60,
    marksPerQuestion: 1,
    negativeMarking: false,
    passBenchmarkPercent: 82,
    sections: [
      { name: "Sequences and analogies", questionCount: 20, durationMinutes: 15, topicSlugs: ["series-sequences", "analogies", "odd-one-out"] },
      { name: "Matrices and codes", questionCount: 20, durationMinutes: 15, topicSlugs: ["matrices", "codes"] },
      { name: "Transformations", questionCount: 20, durationMinutes: 15, topicSlugs: ["reflection", "rotation", "hidden-shapes"] },
      { name: "3D and folding", questionCount: 20, durationMinutes: 15, topicSlugs: ["paper-folding", "nets-cubes-3d", "combining-shapes"] }
    ]
  }
};

export function examPatternFor(subject: Subject) {
  return examPatterns[subject];
}
