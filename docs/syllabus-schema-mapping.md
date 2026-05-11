# 11+ Syllabus And Schema Mapping

This document defines the internal 11+ syllabus taxonomy used by the application and explains how it maps to the database schema, exam generation, scoring, and parent analytics.

The document is source-neutral and vendor-neutral. It does not rely on or reference any external platform, publisher, provider, or third-party syllabus.

## 1. Purpose

The application needs a consistent syllabus model so that every question, exam, score, and AI insight can be analysed at the right level:

- Subject
- Topic group
- Sub-topic or question type
- Skill tags
- Exam section
- Marks and scoring weight
- Student performance by subject and topic

This ensures that when Devansh completes an exam, the parent dashboard can show where he is strong, where he is improving, and where he needs focused practice.

## 2. Subject Model

The platform supports four 11+ subject areas:

| Internal Code | Display Name | Purpose |
| --- | --- | --- |
| `MATHS` | Maths | Number, calculation, geometry, measurement, data, reasoning, and multi-step problem solving |
| `ENGLISH` | English | Reading comprehension, vocabulary, grammar, punctuation, spelling, and writing skills |
| `VERBAL_REASONING` | Verbal Reasoning | Word, letter, number, code, vocabulary, and language-logic problems |
| `NON_VERBAL_REASONING` | Non-Verbal Reasoning | Shape, pattern, rotation, reflection, matrix, folding, and spatial reasoning problems |

## 3. Syllabus Taxonomy

### 3.1 English

| Topic Group | Sub-Topics / Question Types |
| --- | --- |
| Reading Comprehension | Literal Retrieval, Inference & Deduction, Vocabulary in Context, Author's Purpose & Viewpoint, Figurative Language & Effect, Text Structure & Organisation, Poetry Comprehension, Comparing Texts |
| Grammar | Word Classes, Verb Tenses, Subject-Verb Agreement, Active vs Passive Voice, Direct & Reported Speech, Sentence Types, Clauses & Phrases, Modal Verbs & Subjunctive Mood |
| Punctuation | Apostrophes, Commas, Speech Marks, Colons & Semicolons, Capital Letters, Sentence Endings, Brackets, Dashes & Hyphens |
| Spelling | Spot the Misspelling, Homophones, Prefixes and Suffixes, Plurals, Silent Letters |
| Vocabulary | Synonyms, Antonyms, Idioms & Figurative Phrases, Word Definitions, Multiple Meanings |
| Creative Writing | Narrative, Descriptive Writing, Persuasive Writing, Letter Writing, Diary Entry, Newspaper Article, Story Continuation |

### 3.2 Maths

| Topic Group | Sub-Topics / Question Types |
| --- | --- |
| Number & Place Value | Place Value, Rounding, Negative Numbers, Roman Numerals |
| Factors, Multiples & Prime Numbers | Factors, Prime Numbers, Multiples, Highest Common Factor |
| Powers, Squares & Cubes | Square Numbers, Cube Numbers, Square Roots |
| Four Operations | Long Multiplication, Long Division, Order of Operations, Mental Arithmetic |
| Fractions, Decimals & Percentages | Equivalent Fractions, Fractions, Decimals, Percentages, Converting Between Forms |
| Ratio & Proportion | Simplifying Ratios, Sharing in a Ratio, Direct Proportion, Best Buy |
| Algebra & Sequences | Solving Equations, Function Machines, Number Sequences, Nth Term, Substitution |
| Measurement | Unit Conversion, Time Calculations, Money & Change |
| Speed, Distance & Time | Calculating Speed, Calculating Distance, Calculating Time, Average Speed |
| Geometry - 2D Shapes & Angles | Angles in a Triangle, Angles on a Straight Line, Polygons, Angles Around a Point, Parts of a Circle |
| Geometry - 3D Shapes | Faces, Edges & Vertices, Nets |
| Perimeter, Area & Volume | Perimeter, Area, Volume, Compound Shapes |
| Symmetry & Transformation | Lines of Symmetry, Rotational Symmetry, Translation, Reflection, Rotation |
| Coordinates | Plotting Points, Midpoint |
| Statistics & Data | Mean, Median, Mode and Range, Pie Charts, Bar Charts, Line Graphs |
| Probability | Probability Scale, Single-Event Probability |
| Word Problems & Multi-Step Reasoning | Multi-Step Word Problem, Age and Number Puzzles |

### 3.3 Verbal Reasoning

| Topic Group | Sub-Topics / Question Types |
| --- | --- |
| Standard Verbal Reasoning Types | Missing Letter, Letter Code, Letter Series, Letter Analogy, Move a Letter, Compound Words, Missing Three-Letter Word, Word Construction, Letter Sums, Number Series, Hidden Word, Synonym Word Pair, Antonym Word Pair, Word Link Cloze, Synonym, Antonym, Complete the Sum, Number Analogy, Number Code, Logic Problem, Odd Two Out |
| Mixed Verbal Reasoning | Cloze Test, Shuffled Sentences, Comprehension-style Inference |

### 3.4 Non-Verbal Reasoning

| Topic Group | Sub-Topics / Question Types |
| --- | --- |
| Series & Sequences | Continuing a Sequence |
| Analogies | Shape Analogy |
| Matrices | 2x2 Matrix, 3x3 Matrix |
| Odd One Out | Find the Odd One Out |
| Reflection | Mirror Image |
| Rotation | Identify the Rotation |
| Hidden Shapes | Find the Hidden Shape |
| Codes | Identify the Code |
| Paper Folding & Hole Punch | Unfolding Holes |
| Nets, Cubes & 3D | Cube from a Net |
| Combining Shapes | Combine Two Shapes |

## 4. Database Schema Mapping

### 4.1 `syllabus_topics`

Stores the canonical syllabus taxonomy.

| Column | Datatype | Purpose |
| --- | --- | --- |
| `id` | UUID / VarChar(36) | Unique topic row identifier |
| `subject_type` | Enum `SubjectType` | One of the four supported subjects |
| `slug` | VarChar(120) | Stable machine-readable topic key |
| `name` | VarChar(160) | Human-readable topic group |
| `sub_topics` | JSON | Structured list of sub-topics or question types |
| `exam_board_tags` | Text array / JSON | Internal compatibility tags for exam format filtering |
| `display_order` | Integer | Sort order in admin and analytics views |
| `is_active` | Boolean | Allows topics to be hidden without deleting historical data |
| `created_at` | Timestamp / DateTime | Row creation time |
| `updated_at` | Timestamp / DateTime | Last update time |

### 4.2 `question_master`

Stores reusable question-bank items.

| Column | Datatype | Purpose |
| --- | --- | --- |
| `question_id` | UUID / VarChar(36) | Unique question identifier |
| `subject_type` | Enum `SubjectType` | Main subject |
| `topic` | VarChar(120) | Parent topic group, for example `Fractions, Decimals & Percentages` |
| `syllabus_topic_slug` | VarChar(120) | Stable link to `syllabus_topics.slug` |
| `micro_topic` | VarChar(120) | Precise sub-topic or question type, for example `Percentages` |
| `question_type` | Enum `QuestionType` | Multiple-choice or short-answer |
| `title` | VarChar(160), nullable | Optional question title |
| `instruction` | Text, nullable | Student-facing instruction |
| `stimulus_data` | JSON, nullable | Optional passage, SVG, table, image-like data, or supporting context |
| `passage_title` | VarChar(180), nullable | Optional passage title for comprehension questions |
| `passage_text` | Text, nullable | Optional passage text for comprehension questions |
| `question_data_blob` | JSON | Main question content as structured text or visual data |
| `options_blob` | JSON, nullable | Structured answer options |
| `option1_blob` to `option4_blob` | JSON, nullable | Optional denormalised option payloads |
| `answer` | Text | Correct answer or expected answer |
| `explanation` | Text, nullable | Worked explanation shown after marking |
| `difficulty_level` | Enum `DifficultyLevel` | Easy, medium, hard, or advanced |
| `skill_tags` | Text array / JSON | Additional searchable learning skills |
| `exam_board_tags` | Text array / JSON | Internal compatibility tags for paper patterns |
| `estimated_seconds` | Integer, nullable | Expected working time for pacing |
| `marks_available` | Decimal(5,2) | Raw marks available for the question |
| `scoring_weight` | Decimal(5,2) | Weight used if a topic or question should count more heavily |
| `curriculum_tag` | VarChar(120), nullable | Optional internal curriculum label |
| `source` | VarChar(80) | Origin label for auditing question creation |
| `is_active` | Boolean | Enables or disables use in new exams |
| `created_at` | Timestamp / DateTime | Row creation time |
| `updated_at` | Timestamp / DateTime | Last update time |

### 4.3 `exams`

Stores exam attempts.

| Column | Datatype | Purpose |
| --- | --- | --- |
| `exam_id` | UUID / VarChar(36) | Unique exam attempt |
| `student_id` | UUID / VarChar(36) | Student taking the exam |
| `subject` | Enum `SubjectType` | Subject of the paper |
| `pattern_label` | VarChar(160), nullable | Human-readable paper pattern used |
| `is_proctored` | Boolean | Whether secure exam mode was enabled |
| `status` | Enum `ExamStatus` | Draft, in progress, paused, submitted, graded, or abandoned |
| `score` | Decimal(5,2), nullable | Percentage score based on marks |
| `raw_score` | Decimal(6,2), nullable | Total marks awarded |
| `total_marks` | Decimal(6,2), nullable | Total marks available |
| `pass_benchmark_percent` | Decimal(5,2), nullable | Internal readiness benchmark for the paper |
| `total_questions` | Integer | Number of questions in the paper |
| `correct_answers` | Integer | Count of correctly answered questions |
| `duration_seconds` | Integer | Paper time limit |
| `server_started_at` | Timestamp / DateTime, nullable | Server-side timer start |
| `server_expires_at` | Timestamp / DateTime, nullable | Server-side timer expiry |
| `started_at` | Timestamp / DateTime, nullable | Student start time |
| `completed_at` | Timestamp / DateTime, nullable | Student completion time |
| `created_at` | Timestamp / DateTime | Row creation time |
| `updated_at` | Timestamp / DateTime | Last update time |

### 4.4 `exam_questions`

Maps a question into a specific exam attempt.

| Column | Datatype | Purpose |
| --- | --- | --- |
| `exam_id` | UUID / VarChar(36) | Exam attempt |
| `question_id` | UUID / VarChar(36) | Question-bank item |
| `sequence_order` | Integer | Question position in the paper |
| `points` | Decimal(5,2) | Marks available for this question in this exam |
| `section_name` | VarChar(160), nullable | Section name from the exam pattern |

### 4.5 `student_answers`

Stores the student's response and marking result.

| Column | Datatype | Purpose |
| --- | --- | --- |
| `answer_id` | UUID / VarChar(36) | Unique answer identifier |
| `exam_id` | UUID / VarChar(36) | Exam attempt |
| `question_id` | UUID / VarChar(36) | Question answered |
| `student_response` | Text, nullable | Student's selected or typed response |
| `is_marked_for_review` | Boolean | Whether the student flagged the question |
| `is_correct` | Boolean, nullable | Marking result |
| `awarded_points` | Decimal(5,2), nullable | Marks awarded for this answer |
| `ai_feedback` | Text, nullable | Feedback shown after marking |
| `submitted_at` | Timestamp / DateTime, nullable | Last response save or submission time |
| `created_at` | Timestamp / DateTime | Row creation time |
| `updated_at` | Timestamp / DateTime | Last update time |

### 4.6 `ai_insights`

Stores cached analytical reports for dashboards.

| Column | Datatype | Purpose |
| --- | --- | --- |
| `insight_id` | UUID / VarChar(36) | Unique insight row |
| `user_id` | UUID / VarChar(36) | Student being analysed |
| `insight_type` | Enum `InsightType` | Parent report, student coaching tip, study plan, or predictive score |
| `insight_content` | JSON | Structured analysis JSON |
| `provider` | Enum `AiProvider` | Internal generation source identifier |
| `cache_key` | VarChar(180), nullable | Cache identity for avoiding duplicate expensive generation |
| `generated_at` | Timestamp / DateTime | Insight generation time |
| `expires_at` | Timestamp / DateTime | Cache expiry time |

## 5. Exam Pattern Mapping

### 5.1 Maths Pattern

| Section | Questions | Minutes | Topic Coverage |
| --- | ---: | ---: | --- |
| Number, operations and FDP | 20 | 20 | Number, operations, fractions, decimals, percentages |
| Algebra, ratio and measure | 14 | 14 | Ratio, algebra, measurement, speed/distance/time |
| Geometry, data and reasoning | 16 | 16 | Geometry, area, volume, statistics, multi-step reasoning |

Total: 50 questions, 50 minutes.

### 5.2 English Pattern

| Section | Questions | Minutes | Topic Coverage |
| --- | ---: | ---: | --- |
| Reading comprehension | 30 | 25 | Passage-based literal, inference, vocabulary, and author-choice questions |
| Vocabulary | 12 | 10 | Synonyms, antonyms, definitions, idioms, multiple meanings |
| SPaG and spelling | 18 | 15 | Grammar, punctuation, spelling |

Total: 60 questions, 50 minutes.

### 5.3 Verbal Reasoning Pattern

| Section | Questions | Minutes | Topic Coverage |
| --- | ---: | ---: | --- |
| Standard verbal reasoning | 60 | 37 | Word, letter, number, code, analogy, and logic types |
| Mixed vocabulary and logic | 20 | 13 | Cloze, shuffled sentences, comprehension-style inference |

Total: 80 questions, 50 minutes.

### 5.4 Non-Verbal Reasoning Pattern

| Section | Questions | Minutes | Topic Coverage |
| --- | ---: | ---: | --- |
| Sequences and analogies | 20 | 15 | Shape sequences, analogies, odd one out |
| Matrices and codes | 20 | 15 | 2x2 matrices, 3x3 matrices, visual codes |
| Transformations | 20 | 15 | Reflection, rotation, hidden shapes |
| 3D and folding | 20 | 15 | Paper folding, cube nets, combining shapes |

Total: 80 questions, 60 minutes.

## 6. Scoring Mechanism

The application scores exams by marks, not only by question count.

### 6.1 Per-Question Scoring

Each question has:

- `marks_available`
- `scoring_weight`
- `points` in the exam mapping

For normal objective questions:

```text
awarded_points = points if correct
awarded_points = 0 if incorrect or unanswered
```

For short-answer or written-answer questions, later marking can support partial credit:

```text
awarded_points = value between 0 and points
```

### 6.2 Exam Score

```text
raw_score = sum(awarded_points)
total_marks = sum(points)
score_percentage = round((raw_score / total_marks) * 100)
```

### 6.3 Readiness Bands

The analytics layer classifies performance using topic-level accuracy:

| Band | Accuracy | Meaning |
| --- | ---: | --- |
| Strong | 80% and above | Confident area; maintain with light practice |
| Positive | 60% to 79% | Developing area; keep practising |
| Focus | Below 60% | Needs targeted revision and follow-up questions |

## 7. Parent Analytics Mapping

When a student completes a graded exam, the analytics service reads:

- `exams`
- `exam_questions`
- `question_master`
- `student_answers`

It groups marks by:

- Subject
- Topic
- Micro-topic
- Section

### 7.1 Subject Analytics

For each subject:

```text
subject_accuracy = subject_marks_awarded / subject_marks_available
```

Example output:

```json
{
  "subject": "MATHS",
  "label": "Maths",
  "marksAwarded": 38,
  "marksAvailable": 50,
  "accuracy": 76,
  "band": "POSITIVE"
}
```

### 7.2 Topic Analytics

For each subject and topic:

```text
topic_accuracy = topic_marks_awarded / topic_marks_available
```

Example output:

```json
{
  "label": "Maths / Fractions, Decimals & Percentages",
  "topic": "Fractions, Decimals & Percentages",
  "marksAwarded": 7,
  "marksAvailable": 10,
  "accuracy": 70,
  "band": "POSITIVE"
}
```

### 7.3 AI Parent Report Inputs

The parent report receives structured, non-sensitive performance data:

- Recent exam scores
- Subject accuracy
- Strong topics
- Positive topics
- Focus topics
- Question-level feedback summaries

The report should produce:

- Plain-English summary
- Strong areas
- Areas improving
- Focus areas
- Suggested weekly study plan

## 8. Implementation Files

| File | Role |
| --- | --- |
| `backend/syllabus/registry.ts` | Internal syllabus taxonomy and question enrichment |
| `backend/exams/exam-patterns.ts` | Subject-level exam patterns and timings |
| `backend/analytics/performance.ts` | Subject/topic scoring and readiness bands |
| `backend/exams/demo-store.ts` | Demo exam creation, pattern-based selection, scoring |
| `backend/ai/insights.ts` | Parent and student insight generation inputs |
| `frontend/features/dashboard/parent-dashboard.tsx` | Parent dashboard charts and readiness signals |
| `database/prisma/schema.prisma` | Production relational schema |
| `database/prisma/schema.mysql.prisma` | Local relational schema |
| `database/seed.mysql.mjs` | Local seed data for users, plans, topics, and questions |

## 9. Data Quality Rules

Every production question should satisfy these rules:

- `subject_type` must be populated.
- `topic` must match a known syllabus topic name.
- `syllabus_topic_slug` must match a known syllabus topic slug.
- `micro_topic` must describe the precise tested skill.
- Visual questions must store visual content in structured payload fields, not raw text shown directly to the student.
- Comprehension questions must include their passage in `stimulus_data`.
- Every question must include an answer and explanation.
- Every question must define marks available.
- Every generated exam must store the pattern label and section names.

## 10. Desired Parent Dashboard Behaviour

After an exam is completed:

1. The overall score is calculated from marks.
2. Subject accuracy is updated.
3. Topic accuracy is updated.
4. Strong areas are identified first.
5. Positive-but-not-yet-mastered areas are shown separately.
6. Focus areas are prioritised for revision.
7. The AI study plan uses the same subject and topic data.
8. The parent can see exactly why a recommendation was made.

This creates a realistic, evidence-led 11+ preparation experience rather than a simple mock-test score display.

## 11. Question Generation Mapping

Question loading can run on demand from the admin panel or through a scheduled job. The generation request is not a single flat topic; it is expanded into a proportional syllabus plan before questions are created.

### 11.1 Admin Generation Inputs

| Field | Datatype | Purpose |
| --- | --- | --- |
| `subject` | Enum `SubjectType` | Subject to generate for |
| `topic` | String, optional | Topic group to restrict generation |
| `subTopics` | String array, optional | Sub-topics to distribute generation across |
| `microTopic` | String | Fallback sub-topic when no sub-topic list is supplied |
| `difficulty` | Enum `DifficultyLevel` | Difficulty level for generated questions |
| `questionType` | Enum `QuestionType` | Multiple-choice or short-answer |
| `count` | Integer | Total number of questions requested |
| `provider` | Enum `AiProvider` | Generation engine selector |

### 11.2 Proportional Distribution

The system builds a generation plan using the selected subject, topic, and sub-topics.

If the admin selects one topic and four sub-topics with a count of 20:

```text
20 questions / 4 sub-topics = 5 questions per sub-topic
```

If the count cannot divide evenly, the earliest sub-topics receive the remaining questions.

Example:

```text
count = 10
subTopics = Fractions, Decimals, Percentages

Plan:
Fractions: 4
Decimals: 3
Percentages: 3
```

If no topic is selected, the system distributes the request across the full subject syllabus. If no sub-topic list is supplied, the system uses all sub-topics under the selected topic or subject.

### 11.3 Prompt Contract

The generation prompt must request structured JSON only. Each generated question must include:

| JSON Field | Datatype | Required | Purpose |
| --- | --- | --- | --- |
| `questionType` | String enum | Yes | Must match the requested question type |
| `difficultyLevel` | String enum | Yes | Must match the requested difficulty |
| `topic` | String | Yes | Parent topic group |
| `syllabusTopicSlug` | String | Yes | Stable topic slug |
| `microTopic` | String | Yes | Precise tested sub-topic |
| `instruction` | String | Yes | Student-facing instruction |
| `stimulus` | Object or null | No | Passage, SVG, table, or support context |
| `questionData` | Object | Yes | Main question payload |
| `options` | Object array | Yes for multiple-choice | Answer options |
| `answer` | String | Yes | Correct answer |
| `explanation` | String | Yes | Worked explanation |
| `skillTags` | String array | Yes | Searchable skill labels |
| `estimatedSeconds` | Integer | Yes | Expected working time |
| `marksAvailable` | Decimal | Yes | Marks available |
| `scoringWeight` | Decimal | Yes | Scoring weight |

Payload objects use this shape:

```json
{
  "mode": "text",
  "title": "Optional title",
  "content": "Question, passage, table, or SVG content",
  "caption": "Optional caption"
}
```

Allowed `mode` values:

```text
text, svg, passage, table
```

### 11.4 Prompt Template

```text
You are generating original UK 11+ practice questions for a production learning platform.
Return only valid JSON. Do not wrap it in markdown.
The JSON shape must be: { "questions": [ ... ] }.

Each question object must contain:
questionType, difficultyLevel, topic, syllabusTopicSlug, microTopic, instruction,
stimulus, questionData, options, answer, explanation, skillTags, estimatedSeconds,
marksAvailable, scoringWeight.

Use this content payload shape for questionData, stimulus, and options:
{ "mode": "text" | "svg" | "passage" | "table", "title"?: string, "content": string, "caption"?: string }.

For non-verbal reasoning, use clean SVG content for visual stimuli and options.
For English comprehension, include the passage in stimulus and never omit it.
Questions must be age-appropriate, unambiguous, original, and suitable for timed 11+ exam practice.

Subject: {subject}
Question type: {questionType}
Difficulty: {difficulty}
Total count: {count}

Generate in this exact proportional plan:
- {n} question(s): topic={topic}; syllabusTopicSlug={slug}; subTopic={subTopic}
```

### 11.5 Validation Rules For Generated Questions

Every generated question is normalised before entering the question bank:

- `subjectType` is forced to the requested subject.
- `questionType` is forced to the requested question type.
- `difficultyLevel` is forced to the requested difficulty.
- `topic`, `syllabusTopicSlug`, and `microTopic` are enriched from the syllabus registry when missing.
- `marksAvailable` defaults to `1`.
- `scoringWeight` defaults to `1`.
- Multiple-choice questions must include options.
- English comprehension questions must include a stimulus passage.
- Visual reasoning questions should use SVG payloads instead of exposing raw SVG text to the student.

If no configured generation engine is available, the system creates local fallback questions using the same proportional plan. This keeps local development and automated testing functional.

### 11.6 LLM Provider Switching

The admin configuration controls LLM priority.

| Setting | Datatype | Behaviour |
| --- | --- | --- |
| `activeLlmProvider` | Enum `AiProvider` | Provider attempted first |
| `geminiEnabled` | Boolean | Allows or blocks Gemini calls |
| `groqEnabled` | Boolean | Allows or blocks Groq calls |

Runtime behaviour:

```text
Try active provider first.
If the active provider is unavailable, disabled, missing a key, over quota, or returns an API error, try the other enabled provider.
If no configured provider succeeds, use the internal fallback so the app remains usable.
```

This switching is used by:

- Admin on-demand question generation
- Scheduled question generation
- Parent custom exam generation
- Parent and student AI insight generation

## 12. Parent Custom Exam Creation Mapping

Parent-created custom exams use the same syllabus-aware generation model as admin question loading, but the flow is constrained by subscription configuration and student safety limits.

### 12.1 Parent Custom Exam Inputs

| Field | Datatype | Purpose |
| --- | --- | --- |
| `subject` | Enum `SubjectType` | Subject selected for the custom exam |
| `questionCount` | Integer | Total questions requested, capped by the active plan |
| `durationMinutes` | Integer | Exam duration, capped by the active plan |
| `topic` | String, optional | Topic group to focus the exam |
| `subTopics` | String array, optional | Sub-topics to distribute questions across |
| `difficultyMix.easy` | Integer | Number of easy questions requested |
| `difficultyMix.medium` | Integer | Number of medium questions requested |
| `difficultyMix.hard` | Integer | Number of hard questions requested |
| `isProctored` | Boolean | Whether secure exam controls are enabled |

### 12.2 Custom Exam Generation Flow

```text
Parent selects subject, count, duration, topic, sub-topics, and difficulty mix.
System validates the active plan.
System caps count and duration using plan limits.
System normalises the difficulty mix so the total equals questionCount.
For each difficulty band, system builds a proportional topic/sub-topic generation plan.
System attempts configured question generation.
If generation is unavailable, system uses the same proportional plan with local fallback questions.
Generated questions are saved into the question bank.
The custom exam is created from those generated questions.
```

### 12.3 Example

Parent request:

```text
Subject: Maths
Question count: 12
Duration: 20 minutes
Topic: Fractions, Decimals & Percentages
Sub-topics: Fractions, Decimals, Percentages
Difficulty mix: Easy 3, Medium 6, Hard 3
```

Generated plan:

```text
Easy:
- Fractions: 1
- Decimals: 1
- Percentages: 1

Medium:
- Fractions: 2
- Decimals: 2
- Percentages: 2

Hard:
- Fractions: 1
- Decimals: 1
- Percentages: 1
```

The exam then stores:

- `pattern_label`
- `section_name`
- `topic`
- `syllabus_topic_slug`
- `micro_topic`
- `marks_available`
- `scoring_weight`

This allows the parent dashboard to analyse a custom exam in exactly the same way as a standard paper.
