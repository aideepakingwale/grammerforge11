import type { Difficulty, LlmGenerationMeta, LlmProvider, Question, QuestionType, Subject } from "@/backend/shared/types";

export type QuestionGenerationInput = {
  subject: Subject;
  difficulty: Difficulty;
  questionType: QuestionType;
  count: number;
  microTopic: string;
  topic?: string;
  topics?: string[];
  subTopics?: string[];
  difficulties?: Difficulty[];
  questionTypes?: QuestionType[];
  provider: LlmProvider;
  mode: "ON_DEMAND" | "SCHEDULED";
};

export type QuestionGenerationPlanItem = {
  topic: string;
  syllabusTopicSlug: string;
  subTopic: string;
  difficultyMix: Difficulty[];
  questionTypeMix: QuestionType[];
  count: number;
};

export type GeneratedQuestionResult = {
  questions: Question[];
  meta: LlmGenerationMeta;
};
