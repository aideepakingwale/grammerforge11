import type { QuestionGenerationInput, QuestionGenerationPlanItem } from "@/backend/questions/question-generation-types";

export function buildLlmQuestionPrompt(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]) {
  const difficultyMix = input.difficulties?.length ? input.difficulties : [input.difficulty];
  const questionTypeMix = input.questionTypes?.length ? input.questionTypes : [input.questionType];
  const planTotal = generationPlan.reduce((sum, item) => sum + item.count, 0);
  const coverageLines = generationPlan.map((item) => `${item.count}x ${item.topic} > ${item.subTopic} [${item.syllabusTopicSlug}]`);
  return [
    "You are generating original UK 11+ practice questions for a production learning platform.",
    "Return only valid minified JSON. Do not use markdown.",
    "JSON shape: {\"questions\":[Question,...]}.",
    "Question fields: questionType,difficultyLevel,topic,syllabusTopicSlug,microTopic,instruction,stimulus,questionData,options,answer,explanation,skillTags,estimatedSeconds,marksAvailable,scoringWeight.",
    "Payload shape for questionData/stimulus/options: {\"mode\":\"text\"|\"svg\"|\"passage\"|\"table\",\"title\"?:string,\"content\":string,\"caption\"?:string}.",
    "Enums: questionType=MULTIPLE_CHOICE|SHORT_ANSWER; difficultyLevel=EASY|MEDIUM|HARD|ADVANCED.",
    "MULTIPLE_CHOICE requires exactly 4 plausible options and answer must equal the correct option content. SHORT_ANSWER requires options=[].",
    "Follow the compact coverage plan exactly by count. Distribute difficulty levels and question types as evenly as possible across the whole batch.",
    "For non-verbal reasoning, use clean SVG content for visual stimuli and options.",
    "For English comprehension, include the passage in stimulus and never omit it.",
    "Questions must be age-appropriate, unambiguous, original, and suitable for timed 11+ exam practice.",
    "Avoid duplicates: do not reuse the same numbers, names, passage premise, answer pattern, SVG geometry, or wording across this batch.",
    "If two questions test the same subtopic, make the scenario, values, correct answer, distractors, and explanation materially different.",
    `Subject: ${input.subject}.`,
    `Topics selected: ${(input.topics?.length ? input.topics : input.topic ? [input.topic] : ["All syllabus topics"]).join(", ")}.`,
    `Question type mix: ${questionTypeMix.join(", ")}.`,
    `Difficulty mix: ${difficultyMix.join(", ")}.`,
    `Total count: ${input.count}.`,
    `Coverage rows: ${generationPlan.length}; coverage total: ${planTotal}.`,
    "Coverage plan:",
    coverageLines.join("\n"),
    "Example item: {\"questionType\":\"MULTIPLE_CHOICE\",\"difficultyLevel\":\"MEDIUM\",\"topic\":\"Fractions, Decimals & Percentages\",\"syllabusTopicSlug\":\"fractions-decimals-percentages\",\"microTopic\":\"Equivalent Fractions\",\"instruction\":\"Choose the best answer.\",\"stimulus\":null,\"questionData\":{\"mode\":\"text\",\"content\":\"Which fraction is equivalent to 3/4?\"},\"options\":[{\"mode\":\"text\",\"content\":\"6/8\"},{\"mode\":\"text\",\"content\":\"4/6\"},{\"mode\":\"text\",\"content\":\"3/8\"},{\"mode\":\"text\",\"content\":\"7/12\"}],\"answer\":\"6/8\",\"explanation\":\"Multiplying numerator and denominator by 2 gives 6/8.\",\"skillTags\":[\"equivalent fractions\"],\"estimatedSeconds\":60,\"marksAvailable\":1,\"scoringWeight\":1}"
  ].join("\n");
}
