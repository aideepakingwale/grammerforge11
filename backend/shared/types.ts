export type Role = "STUDENT" | "PARENT" | "ADMIN";
export type Tier = "FOUNDATION" | "ALPHA" | "VELOCITY" | "APEX";
export type LlmProvider = "GEMINI" | "GROQ" | "INTERNAL";
export type Subject = "MATHS" | "ENGLISH" | "VERBAL_REASONING" | "NON_VERBAL_REASONING";
export type QuestionType = "MULTIPLE_CHOICE" | "SHORT_ANSWER";
export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
export type ExamStatus = "DRAFT" | "IN_PROGRESS" | "PAUSED" | "SUBMITTED" | "GRADED" | "ABANDONED";

export type SafeUser = {
  id: string;
  role: Role;
  subscriptionTier: Tier;
  email: string;
  firstName: string;
  lastName: string;
  parentId?: string | null;
  stripeCustomerId?: string | null;
};

export type AdminUserInput = {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: Role;
  subscriptionTier: Tier;
  parentId?: string | null;
};

export type PlatformConfig = {
  activeLlmProvider: LlmProvider;
  geminiEnabled: boolean;
  groqEnabled: boolean;
  redisCacheEnabled: boolean;
  aiDailyLimitFree: number;
  aiDailyLimitPro: number;
  aiDailyLimitPremium: number;
  maskedGeminiKey: string;
  maskedGroqKey: string;
  maskedStripeKey: string;
  llmQuota: Array<{
    provider: LlmProvider;
    enabled: boolean;
    configured: boolean;
    dailyLimit: number;
    usedToday: number;
    remainingToday: number | null;
    resetAt: string;
    note: string;
  }>;
  updatedAt: string;
};

export type PlanFeatureKey =
  | "STANDARD_EXAMS"
  | "AI_SHORT_ANSWER_EVALUATION"
  | "STEP_BY_STEP_EXPLANATIONS"
  | "BASIC_ANALYTICS"
  | "DEEP_AI_STUDY_PLAN"
  | "SECURE_PROCTORING"
  | "UNLIMITED_TARGETED_EXAMS"
  | "PREDICTIVE_PASS_SCORE"
  | "EXTERNAL_AI_PROMPT_HELP";

export type SubscriptionPlanConfig = {
  tier: Tier;
  name: string;
  positioning: string;
  monthlyPricePence: number;
  examLimitMonthly: number | null;
  aiInsightLimitMonthly: number | null;
  dailySubjectLimit: number | null;
  questionsPerExam: number;
  durationMinutes: number;
  allowAllSubjectsDaily: boolean;
  allowRepeatSubjectSameDay: boolean;
  customExamEnabled: boolean;
  customExamMaxQuestions: number;
  customExamMaxMinutes: number;
  llmCustomExamsPerDay: number;
  shareExamEnabled: boolean;
  features: Record<PlanFeatureKey, boolean>;
  isActive: boolean;
  updatedAt: string;
};

export type PublicPageStatus = "DRAFT" | "PUBLISHED";

export type PublicPage = {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: PublicPageStatus;
  updatedAt: string;
};

export type PlatformAnalytics = {
  totalUsers: number;
  students: number;
  parents: number;
  admins: number;
  activeSubscriptions: number;
  examsStarted: number;
  examsCompleted: number;
  averageScore: number;
  auditEvents: number;
  aiInsightsCached: number;
  questionBankSize: number;
  uptimeStatus: "OPERATIONAL" | "DEGRADED";
};

export type QuestionGenerationJob = {
  id: string;
  subject: Subject;
  difficulty: Difficulty;
  questionType: QuestionType;
  count: number;
  microTopic: string;
  topic?: string;
  subTopics?: string[];
  difficulties?: Difficulty[];
  questionTypes?: QuestionType[];
  generationPlan?: Array<{
    topic: string;
    syllabusTopicSlug: string;
    subTopic: string;
    difficulty?: Difficulty;
    questionType?: QuestionType;
    count: number;
  }>;
  provider: LlmProvider;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  mode: "ON_DEMAND" | "SCHEDULED";
  createdAt: string;
  completedAt?: string;
  generatedCount: number;
  error?: string;
};

export type QuestionGenerationSchedule = {
  enabled: boolean;
  subject: Subject;
  difficulty: Difficulty;
  questionType: QuestionType;
  count: number;
  microTopic: string;
  topic?: string;
  subTopics?: string[];
  difficulties?: Difficulty[];
  questionTypes?: QuestionType[];
  provider: LlmProvider;
  frequency: "DAILY" | "WEEKLY";
  runAt: string;
  nextRunAt?: string;
  updatedAt: string;
};

export type QuestionBankStats = {
  total: number;
  bySubject: Record<Subject, number>;
  byDifficulty: Record<Difficulty, number>;
  llmGenerated: number;
};

export type QuestionPayload = {
  mode: "text" | "svg";
  content: string;
  title?: string;
};

export type QuestionStimulus = {
  title: string;
  mode: "passage" | "text" | "svg" | "table";
  content: string;
  caption?: string;
};

export type Question = {
  id: string;
  subjectType: Subject;
  questionType: QuestionType;
  questionData: QuestionPayload;
  instruction?: string;
  stimulus?: QuestionStimulus;
  options: QuestionPayload[];
  answer: string;
  explanation: string;
  difficultyLevel: Difficulty;
  topic?: string;
  microTopic: string;
  syllabusTopicSlug?: string;
  examBoardTags?: string[];
  skillTags?: string[];
  estimatedSeconds?: number;
  marksAvailable?: number;
  scoringWeight?: number;
};

export type ExamQuestion = {
  question: Question;
  sequenceOrder: number;
  points: number;
  sectionName?: string;
};

export type StudentAnswer = {
  id: string;
  examId: string;
  questionId: string;
  studentResponse?: string;
  isMarkedForReview: boolean;
  isCorrect?: boolean;
  awardedPoints?: number;
  aiFeedback?: string;
  submittedAt?: string;
};

export type Exam = {
  id: string;
  studentId: string;
  subject: Subject;
  patternLabel?: string;
  isProctored: boolean;
  status: ExamStatus;
  score?: number;
  rawScore?: number;
  totalMarks?: number;
  passBenchmarkPercent?: number;
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
  serverStartedAt?: string;
  serverExpiresAt?: string;
  startedAt?: string;
  completedAt?: string;
  questions: ExamQuestion[];
  answers: Record<string, StudentAnswer>;
};

export type AuditEvent = {
  id: string;
  examId: string;
  eventType: string;
  eventTimestamp: string;
  details?: unknown;
};

export type Insight = {
  id: string;
  userId: string;
  insightType: "PARENT_WEEKLY_REPORT" | "STUDENT_COACHING_TIP" | "STUDY_PLAN" | "PREDICTIVE_SCORE";
  insightContent: unknown;
  generatedAt: string;
  expiresAt: string;
};
