import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const features = {
  FOUNDATION: {
    STANDARD_EXAMS: true,
    AI_SHORT_ANSWER_EVALUATION: false,
    STEP_BY_STEP_EXPLANATIONS: false,
    BASIC_ANALYTICS: true,
    DEEP_AI_STUDY_PLAN: false,
    SECURE_PROCTORING: false,
    UNLIMITED_TARGETED_EXAMS: false,
    PREDICTIVE_PASS_SCORE: false,
    EXTERNAL_AI_PROMPT_HELP: false
  },
  ALPHA: {
    STANDARD_EXAMS: true,
    AI_SHORT_ANSWER_EVALUATION: false,
    STEP_BY_STEP_EXPLANATIONS: true,
    BASIC_ANALYTICS: true,
    DEEP_AI_STUDY_PLAN: false,
    SECURE_PROCTORING: false,
    UNLIMITED_TARGETED_EXAMS: false,
    PREDICTIVE_PASS_SCORE: false,
    EXTERNAL_AI_PROMPT_HELP: true
  },
  VELOCITY: {
    STANDARD_EXAMS: true,
    AI_SHORT_ANSWER_EVALUATION: true,
    STEP_BY_STEP_EXPLANATIONS: true,
    BASIC_ANALYTICS: true,
    DEEP_AI_STUDY_PLAN: true,
    SECURE_PROCTORING: false,
    UNLIMITED_TARGETED_EXAMS: true,
    PREDICTIVE_PASS_SCORE: true,
    EXTERNAL_AI_PROMPT_HELP: true
  },
  APEX: {
    STANDARD_EXAMS: true,
    AI_SHORT_ANSWER_EVALUATION: true,
    STEP_BY_STEP_EXPLANATIONS: true,
    BASIC_ANALYTICS: true,
    DEEP_AI_STUDY_PLAN: true,
    SECURE_PROCTORING: true,
    UNLIMITED_TARGETED_EXAMS: true,
    PREDICTIVE_PASS_SCORE: true,
    EXTERNAL_AI_PROMPT_HELP: true
  }
};

const plans = [
  {
    tier: "FOUNDATION",
    name: "Foundation",
    positioning: "Starting Line",
    monthlyPricePence: 0,
    examLimitMonthly: 30,
    aiInsightLimitMonthly: 0,
    dailySubjectLimit: 1,
    questionsPerExam: 10,
    durationMinutes: 10,
    allowAllSubjectsDaily: false,
    allowRepeatSubjectSameDay: false,
    customExamEnabled: false,
    customExamMaxQuestions: 0,
    customExamMaxMinutes: 0,
    llmCustomExamsPerDay: 0,
    shareExamEnabled: false
  },
  {
    tier: "ALPHA",
    name: "Alpha",
    positioning: "Leadership Tools",
    monthlyPricePence: 999,
    examLimitMonthly: 30,
    aiInsightLimitMonthly: 10,
    dailySubjectLimit: 1,
    questionsPerExam: 50,
    durationMinutes: 50,
    allowAllSubjectsDaily: false,
    allowRepeatSubjectSameDay: false,
    customExamEnabled: false,
    customExamMaxQuestions: 0,
    customExamMaxMinutes: 0,
    llmCustomExamsPerDay: 0,
    shareExamEnabled: false
  },
  {
    tier: "VELOCITY",
    name: "Velocity",
    positioning: "Results Acceleration",
    monthlyPricePence: 1999,
    examLimitMonthly: null,
    aiInsightLimitMonthly: 50,
    dailySubjectLimit: 4,
    questionsPerExam: 80,
    durationMinutes: 60,
    allowAllSubjectsDaily: true,
    allowRepeatSubjectSameDay: false,
    customExamEnabled: false,
    customExamMaxQuestions: 0,
    customExamMaxMinutes: 0,
    llmCustomExamsPerDay: 0,
    shareExamEnabled: true
  },
  {
    tier: "APEX",
    name: "Apex",
    positioning: "Full Access",
    monthlyPricePence: 3999,
    examLimitMonthly: null,
    aiInsightLimitMonthly: null,
    dailySubjectLimit: null,
    questionsPerExam: 80,
    durationMinutes: 100,
    allowAllSubjectsDaily: true,
    allowRepeatSubjectSameDay: true,
    customExamEnabled: true,
    customExamMaxQuestions: 80,
    customExamMaxMinutes: 100,
    llmCustomExamsPerDay: 1,
    shareExamEnabled: true
  }
];

const pages = [
  {
    slug: "privacy",
    title: "Privacy Statement",
    body: "We collect only the information required to operate student accounts, parent controls, exam records, billing status, and learning analytics. Child data is handled carefully and is not sold.",
    status: "PUBLISHED",
    publishedAt: new Date()
  },
  {
    slug: "terms",
    title: "Terms and Conditions",
    body: "Use of the platform is subject to responsible account management, fair use of AI features, and parent or guardian oversight for child learners.",
    status: "PUBLISHED",
    publishedAt: new Date()
  },
  {
    slug: "about",
    title: "About GrammarForge",
    body: "GrammarForge helps families prepare for 11+ exams with structured practice, topic analytics, rewards, and configurable AI-assisted learning support.",
    status: "PUBLISHED",
    publishedAt: new Date()
  }
];

async function seedSuperadmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD with a password of at least 12 characters before seeding.");
  }

  await prisma.user.upsert({
    where: { email: email.trim().toLowerCase() },
    create: {
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      firstName: process.env.SUPERADMIN_FIRST_NAME ?? "Deepak",
      lastName: process.env.SUPERADMIN_LAST_NAME ?? "Ingwale",
      role: "ADMIN",
      subscriptionTier: "APEX",
      emailVerifiedAt: new Date()
    },
    update: {
      role: "ADMIN",
      subscriptionTier: "APEX",
      emailVerifiedAt: new Date()
    }
  });
}

async function seedPlans() {
  for (const plan of plans) {
    await prisma.subscriptionPlanConfig.upsert({
      where: { tier: plan.tier },
      create: plan,
      update: plan
    });

    for (const [feature, enabled] of Object.entries(features[plan.tier])) {
      await prisma.subscriptionPlanFeature.upsert({
        where: { tier_feature: { tier: plan.tier, feature } },
        create: { tier: plan.tier, feature, enabled },
        update: { enabled }
      });
    }
  }
}

async function seedPlatformConfig() {
  const existing = await prisma.platformConfig.findFirst();
  if (existing) {
    await prisma.platformConfig.update({
      where: { id: existing.id },
      data: {
        activeLlmProvider: process.env.GROQ_API_KEY ? "GROQ" : "GEMINI",
        geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
        groqEnabled: Boolean(process.env.GROQ_API_KEY),
        redisCacheEnabled: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
      }
    });
    return;
  }

  await prisma.platformConfig.create({
    data: {
      activeLlmProvider: process.env.GROQ_API_KEY ? "GROQ" : "GEMINI",
      geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
      groqEnabled: Boolean(process.env.GROQ_API_KEY),
      redisCacheEnabled: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    }
  });
}

async function seedPublicPages() {
  for (const page of pages) {
    await prisma.publicPage.upsert({
      where: { slug: page.slug },
      create: page,
      update: page
    });
  }
}

async function main() {
  await seedSuperadmin();
  await seedPlans();
  await seedPlatformConfig();
  await seedPublicPages();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("PostgreSQL seed completed.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
