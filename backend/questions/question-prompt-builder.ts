import type { QuestionGenerationInput, QuestionGenerationPlanItem } from "@/backend/questions/question-generation-types";

export function buildLlmQuestionPrompt(input: QuestionGenerationInput, generationPlan: QuestionGenerationPlanItem[]) {
  const difficultyMix = input.difficulties?.length ? input.difficulties : [input.difficulty];
  const questionTypeMix = input.questionTypes?.length ? input.questionTypes : [input.questionType];
  const planTotal = generationPlan.reduce((sum, item) => sum + item.count, 0);
  const coverage = generationPlan.map((item) => ({
    n: item.count,
    topic: item.topic,
    slug: item.syllabusTopicSlug,
    subtopic: item.subTopic
  }));
  const subjectRule = {
    MATHS: "Vary values, units, contexts, operations, and final answer.",
    ENGLISH: "Vary passage theme, vocabulary/grammar focus, inference target, and sentence structure.",
    VERBAL_REASONING: "Vary word families, relation type, code system, hidden pattern, and answer position.",
    NON_VERBAL_REASONING: "Vary SVG geometry, layout, shading, rotation/reflection rule, and correct option position."
  }[input.subject];
  return [
    "Generate original UK 11+ practice questions. Return only minified JSON, no markdown.",
    `Task: subject=${input.subject}; total=${input.count}; difficultyMix=${difficultyMix.join("|")}; typeMix=${questionTypeMix.join("|")}.`,
    `Coverage JSON, obey counts exactly: ${JSON.stringify(coverage)}.`,
    `Coverage total check: ${planTotal}.`,
    "Output: {\"questions\":[{questionType,difficultyLevel,topic,syllabusTopicSlug,microTopic,instruction,stimulus,questionData,options,answer,explanation,skillTags,estimatedSeconds,marksAvailable,scoringWeight}]}",
    "Payload: {mode:\"text\"|\"svg\"|\"passage\"|\"table\",title?,content,caption?}. MCQ: exactly 4 plausible options and answer must equal correct option content. SHORT_ANSWER: options=[].",
    "Answer validation: solve each question independently before returning it. For negative wording such as NOT/except/least, verify the chosen answer satisfies the negative condition. Explanations must prove the answer, not merely repeat it.",
    "Reject internally and replace any item where the answer is mathematically or logically false. Example: if asking NOT a multiple of 3, never choose 6, 9, 12, or 15 because all are multiples of 3.",
    "Uniqueness: zero duplicate or near-duplicate items in this response. Silently audit before returning. Do not reuse numbers, names, passage premise, answer pattern, option set, distractors, SVG geometry, or explanation structure.",
    subjectRule,
    "English comprehension must include passage in stimulus. NVR must use clean SVG for visual stimuli/options.",
    "Age 10-11, unambiguous, timed exam style.",
    "Example item: {\"questionType\":\"MULTIPLE_CHOICE\",\"difficultyLevel\":\"MEDIUM\",\"topic\":\"Fractions, Decimals & Percentages\",\"syllabusTopicSlug\":\"fractions-decimals-percentages\",\"microTopic\":\"Equivalent Fractions\",\"instruction\":\"Choose the best answer.\",\"stimulus\":null,\"questionData\":{\"mode\":\"text\",\"content\":\"Which fraction is equivalent to 3/4?\"},\"options\":[{\"mode\":\"text\",\"content\":\"6/8\"},{\"mode\":\"text\",\"content\":\"4/6\"},{\"mode\":\"text\",\"content\":\"3/8\"},{\"mode\":\"text\",\"content\":\"7/12\"}],\"answer\":\"6/8\",\"explanation\":\"Multiplying numerator and denominator by 2 gives 6/8.\",\"skillTags\":[\"equivalent fractions\"],\"estimatedSeconds\":60,\"marksAvailable\":1,\"scoringWeight\":1}"
  ].join("\n");
}
