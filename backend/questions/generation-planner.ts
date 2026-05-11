import { syllabusRegistry, topicForSubTopic } from "@/backend/syllabus/registry";
import type { QuestionGenerationInput, QuestionGenerationPlanItem } from "@/backend/questions/question-generation-types";

export function buildQuestionGenerationPlan(input: QuestionGenerationInput): QuestionGenerationPlanItem[] {
  const requestedSubTopics = input.subTopics?.map((item) => item.trim()).filter(Boolean) ?? [];
  const topicGroups = syllabusRegistry[input.subject];
  const requestedTopics = input.topics?.length ? input.topics : input.topic ? [input.topic] : [];
  const normalizedRequestedTopics = requestedTopics.map((item) => item.trim().toLowerCase()).filter(Boolean);
  const selectedTopics = normalizedRequestedTopics.length
    ? topicGroups.filter((topic) => normalizedRequestedTopics.includes(topic.name.toLowerCase()) || normalizedRequestedTopics.includes(topic.slug.toLowerCase()))
    : topicGroups;
  const pool = (selectedTopics.length ? selectedTopics : topicGroups).flatMap((topic) => {
    const subTopics = requestedSubTopics.length
      ? topic.subTopics.filter((subTopic) => requestedSubTopics.some((requested) => requested.toLowerCase() === subTopic.toLowerCase()))
      : topic.subTopics;
    return (subTopics.length ? subTopics : [input.microTopic]).map((subTopic) => ({
      topic: topic.name,
      syllabusTopicSlug: topic.slug,
      subTopic
    }));
  });
  const normalizedPool = pool.length
    ? pool
    : [{
        topic: topicForSubTopic(input.subject, input.microTopic).name,
        syllabusTopicSlug: topicForSubTopic(input.subject, input.microTopic).slug,
        subTopic: input.microTopic
      }];

  const difficulties = input.difficulties?.length ? input.difficulties : [input.difficulty];
  const questionTypes = input.questionTypes?.length ? input.questionTypes : [input.questionType];
  const coverageCap = Math.max(1, Math.min(input.count, 12));
  const selectedCoverage = pickEvenly(normalizedPool, Math.min(normalizedPool.length, coverageCap));
  const base = Math.floor(input.count / selectedCoverage.length);
  let remainder = input.count % selectedCoverage.length;
  return selectedCoverage.map((item) => {
    const count = base + (remainder > 0 ? 1 : 0);
    remainder -= 1;
    return { ...item, difficultyMix: difficulties, questionTypeMix: questionTypes, count };
  });
}

function pickEvenly<T>(items: T[], targetCount: number) {
  if (items.length <= targetCount) return items;
  return Array.from({ length: targetCount }, (_, index) => {
    const itemIndex = Math.floor((index * items.length) / targetCount);
    return items[itemIndex];
  });
}
