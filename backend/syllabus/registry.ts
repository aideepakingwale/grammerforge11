import type { Subject } from "@/backend/shared/types";

export type SyllabusTopic = {
  slug: string;
  name: string;
  subTopics: string[];
  examBoards: string[];
};

export const syllabusRegistry: Record<Subject, SyllabusTopic[]> = {
  ENGLISH: [
    {
      slug: "reading-comprehension",
      name: "Reading Comprehension",
      examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"],
      subTopics: [
        "Literal Retrieval",
        "Inference & Deduction",
        "Vocabulary in Context",
        "Author's Purpose & Viewpoint",
        "Figurative Language & Effect",
        "Text Structure & Organisation",
        "Poetry Comprehension",
        "Comparing Texts"
      ]
    },
    {
      slug: "grammar-spag",
      name: "Grammar (SPaG)",
      examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"],
      subTopics: [
        "Word Classes",
        "Verb Tenses",
        "Subject-Verb Agreement",
        "Active vs Passive Voice",
        "Direct & Reported Speech",
        "Sentence Types",
        "Clauses & Phrases",
        "Modal Verbs & Subjunctive Mood"
      ]
    },
    {
      slug: "punctuation",
      name: "Punctuation",
      examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"],
      subTopics: ["Apostrophes", "Commas", "Speech Marks", "Colons & Semicolons", "Capital Letters", "Sentence Endings", "Brackets, Dashes & Hyphens"]
    },
    {
      slug: "spelling",
      name: "Spelling",
      examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"],
      subTopics: ["Spot the Misspelling", "Homophones", "Prefixes and Suffixes", "Plurals", "Silent Letters"]
    },
    {
      slug: "vocabulary",
      name: "Vocabulary",
      examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"],
      subTopics: ["Synonyms", "Antonyms", "Idioms & Figurative Phrases", "Word Definitions", "Multiple Meanings"]
    },
    {
      slug: "creative-writing",
      name: "Creative Writing",
      examBoards: ["CSSE", "Kent", "FSCE", "ISEB", "Independent"],
      subTopics: ["Narrative", "Descriptive Writing", "Persuasive Writing", "Letter Writing", "Diary Entry", "Newspaper Article", "Story Continuation"]
    }
  ],
  MATHS: [
    { slug: "number-place-value", name: "Number & Place Value", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Place Value", "Rounding", "Negative Numbers", "Roman Numerals"] },
    { slug: "factors-multiples-primes", name: "Factors, Multiples & Prime Numbers", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Factors", "Prime Numbers", "Multiples", "Highest Common Factor"] },
    { slug: "powers-squares-cubes", name: "Powers, Squares & Cubes", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Square Numbers", "Cube Numbers", "Square Roots"] },
    { slug: "four-operations", name: "Four Operations", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Long Multiplication", "Long Division", "BIDMAS", "Mental Arithmetic"] },
    { slug: "fractions-decimals-percentages", name: "Fractions, Decimals & Percentages", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Equivalent Fractions", "Fractions", "Decimals", "Percentages", "Converting Between Forms"] },
    { slug: "ratio-proportion", name: "Ratio & Proportion", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Simplifying Ratios", "Sharing in a Ratio", "Direct Proportion", "Best Buy"] },
    { slug: "algebra-sequences", name: "Algebra & Sequences", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Solving Equations", "Function Machines", "Number Sequences", "Nth Term", "Substitution"] },
    { slug: "measurement", name: "Measurement", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Unit Conversion", "Time Calculations", "Money & Change"] },
    { slug: "speed-distance-time", name: "Speed, Distance & Time", examBoards: ["CSSE", "ISEB", "Independent"], subTopics: ["Calculating Speed", "Calculating Distance", "Calculating Time", "Average Speed"] },
    { slug: "geometry-2d", name: "Geometry - 2D Shapes & Angles", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Angles in a Triangle", "Angles on a Straight Line", "Polygons", "Angles Around a Point", "Parts of a Circle"] },
    { slug: "geometry-3d", name: "Geometry - 3D Shapes", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Faces, Edges & Vertices", "Nets"] },
    { slug: "perimeter-area-volume", name: "Perimeter, Area & Volume", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Perimeter", "Area", "Volume", "Compound Shapes"] },
    { slug: "symmetry-transformation", name: "Symmetry & Transformation", examBoards: ["GL", "CEM", "ISEB", "FSCE"], subTopics: ["Lines of Symmetry", "Rotational Symmetry", "Translation", "Reflection", "Rotation"] },
    { slug: "coordinates", name: "Coordinates", examBoards: ["GL", "CEM", "ISEB", "FSCE"], subTopics: ["Plotting Points", "Midpoint"] },
    { slug: "statistics-data", name: "Statistics & Data", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Mean", "Median", "Mode and Range", "Pie Charts", "Bar Charts", "Line Graphs"] },
    { slug: "probability", name: "Probability", examBoards: ["GL", "CEM", "ISEB", "FSCE"], subTopics: ["Probability Scale", "Single-Event Probability"] },
    { slug: "word-problems", name: "Word Problems & Multi-Step Reasoning", examBoards: ["GL", "CEM", "CSSE", "ISEB", "FSCE"], subTopics: ["Multi-Step Word Problem", "Age and Number Puzzles"] }
  ],
  VERBAL_REASONING: [
    {
      slug: "gl-21-question-types",
      name: "GL Assessment - 21 Question Types",
      examBoards: ["GL", "ISEB"],
      subTopics: [
        "Missing Letter",
        "Letter Code",
        "Letter Series",
        "Letter Analogy",
        "Move a Letter",
        "Compound Words",
        "Missing Three-Letter Word",
        "Word Construction",
        "Letter Sums",
        "Number Series",
        "Hidden Word",
        "Synonym Word Pair",
        "Antonym Word Pair",
        "Word Link Cloze",
        "Synonym",
        "Antonym",
        "Complete the Sum",
        "Number Analogy",
        "Number Code",
        "Logic Problem",
        "Odd Two Out"
      ]
    },
    {
      slug: "cem-verbal-reasoning",
      name: "CEM-Style Verbal Reasoning",
      examBoards: ["CEM", "FSCE"],
      subTopics: ["Cloze Test", "Shuffled Sentences", "Comprehension-style Inference"]
    }
  ],
  NON_VERBAL_REASONING: [
    { slug: "series-sequences", name: "Series & Sequences", examBoards: ["GL", "CEM", "ISEB", "FSCE"], subTopics: ["Continuing a Sequence"] },
    { slug: "analogies", name: "Analogies", examBoards: ["GL", "CEM", "ISEB"], subTopics: ["Shape Analogy"] },
    { slug: "matrices", name: "Matrices", examBoards: ["GL", "CEM", "ISEB", "FSCE"], subTopics: ["2x2 Matrix", "3x3 Matrix"] },
    { slug: "odd-one-out", name: "Odd One Out", examBoards: ["GL", "CEM", "ISEB", "FSCE"], subTopics: ["Find the Odd One Out"] },
    { slug: "reflection", name: "Reflection", examBoards: ["GL", "CEM", "ISEB", "FSCE"], subTopics: ["Mirror Image"] },
    { slug: "rotation", name: "Rotation", examBoards: ["GL", "CEM", "ISEB", "FSCE"], subTopics: ["Identify the Rotation"] },
    { slug: "hidden-shapes", name: "Hidden Shapes", examBoards: ["GL", "CEM", "ISEB"], subTopics: ["Find the Hidden Shape"] },
    { slug: "codes", name: "Codes", examBoards: ["GL", "CEM", "ISEB"], subTopics: ["Identify the Code"] },
    { slug: "paper-folding", name: "Paper Folding & Hole Punch", examBoards: ["GL", "CEM", "ISEB"], subTopics: ["Unfolding Holes"] },
    { slug: "nets-cubes-3d", name: "Nets, Cubes & 3D", examBoards: ["GL", "CEM", "ISEB"], subTopics: ["Cube from a Net"] },
    { slug: "combining-shapes", name: "Combining Shapes", examBoards: ["GL", "CEM", "ISEB"], subTopics: ["Combine Two Shapes"] }
  ]
};

export function topicForSubTopic(subject: Subject, subTopic: string) {
  const normalized = subTopic.toLowerCase();
  return (
    syllabusRegistry[subject].find((topic) => topic.name.toLowerCase() === normalized || topic.subTopics.some((item) => item.toLowerCase() === normalized)) ??
    syllabusRegistry[subject][0]
  );
}

export function enrichQuestionSyllabus<T extends { subjectType: Subject; microTopic: string; topic?: string; syllabusTopicSlug?: string; examBoardTags?: string[] }>(question: T): T {
  const topic = topicForSubTopic(question.subjectType, question.microTopic);
  return {
    ...question,
    topic: question.topic ?? topic.name,
    syllabusTopicSlug: question.syllabusTopicSlug ?? topic.slug,
    examBoardTags: question.examBoardTags ?? topic.examBoards
  };
}
