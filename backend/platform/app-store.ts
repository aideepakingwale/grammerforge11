import bcrypt from "bcryptjs";
import type { AuditEvent, Exam, Insight, PlatformConfig, PublicPage, QuestionGenerationJob, QuestionGenerationSchedule, Role, SafeUser, SubscriptionPlanConfig, Tier } from "@/backend/shared/types";
import { uid } from "@/backend/shared/utils";
import { defaultPlatformConfig, defaultPlans, defaultPublicPages, defaultQuestionGenerationSchedule } from "@/backend/platform/defaults";

type StoredUser = SafeUser & { passwordHash: string };

type Store = {
  users: StoredUser[];
  exams: Exam[];
  auditLogs: AuditEvent[];
  insights: Insight[];
  platformConfig: PlatformConfig;
  plans: SubscriptionPlanConfig[];
  publicPages: PublicPage[];
  questionGenerationJobs: QuestionGenerationJob[];
  questionGenerationSchedule: QuestionGenerationSchedule;
};

declare global {
  var grammarForgeStore: Store | undefined;
}

const parentId = "user_parent_demo";
const studentId = "user_student_demo";
const adminId = "user_admin_demo";

function seedStore(): Store {
  const passwordHash = bcrypt.hashSync("Password123!", 10);
  return {
    users: [
      {
        id: parentId,
        role: "PARENT",
        subscriptionTier: "FOUNDATION",
        email: "parent@example.com",
        passwordHash,
        firstName: "Deepak",
        lastName: "Ingwale",
        stripeCustomerId: "cus_demo_parent"
      },
      {
        id: adminId,
        role: "ADMIN",
        subscriptionTier: "APEX",
        email: "admin@example.com",
        passwordHash,
        firstName: "Deepak",
        lastName: "Ingwale",
        stripeCustomerId: "cus_demo_admin"
      },
      {
        id: studentId,
        role: "STUDENT",
        subscriptionTier: "FOUNDATION",
        email: "student@example.com",
        passwordHash,
        firstName: "Devansh",
        lastName: "Ingwale",
        parentId
      }
    ],
    exams: [],
    auditLogs: [],
    insights: [],
    platformConfig: defaultPlatformConfig(),
    plans: defaultPlans(),
    publicPages: defaultPublicPages(),
    questionGenerationJobs: [],
    questionGenerationSchedule: defaultQuestionGenerationSchedule()
  };
}

export function store() {
  globalThis.grammarForgeStore ??= seedStore();
  const passwordHash = bcrypt.hashSync("Password123!", 10);
  const demoStudent = globalThis.grammarForgeStore.users.find((user) => user.id === studentId);
  if (demoStudent) {
    demoStudent.firstName = "Devansh";
    demoStudent.lastName = "Ingwale";
    demoStudent.subscriptionTier = "FOUNDATION";
  }
  const demoParent = globalThis.grammarForgeStore.users.find((user) => user.id === parentId);
  if (demoParent) {
    demoParent.firstName = "Deepak";
    demoParent.lastName = "Ingwale";
    demoParent.subscriptionTier = "FOUNDATION";
  }
  const demoAdmin = globalThis.grammarForgeStore.users.find((user) => user.id === adminId || user.email === "admin@example.com");
  if (demoAdmin) {
    demoAdmin.id = adminId;
    demoAdmin.role = "ADMIN";
    demoAdmin.subscriptionTier = "APEX";
    demoAdmin.email = "admin@example.com";
    demoAdmin.firstName = "Deepak";
    demoAdmin.lastName = "Ingwale";
  } else {
    globalThis.grammarForgeStore.users.push({
      id: adminId,
      role: "ADMIN",
      subscriptionTier: "APEX",
      email: "admin@example.com",
      passwordHash,
      firstName: "Deepak",
      lastName: "Ingwale",
      stripeCustomerId: "cus_demo_admin"
    });
  }
  globalThis.grammarForgeStore.platformConfig ??= defaultPlatformConfig();
  if (!globalThis.grammarForgeStore.plans?.length) {
    globalThis.grammarForgeStore.plans = defaultPlans();
  }
  const validTiers: Tier[] = ["FOUNDATION", "ALPHA", "VELOCITY", "APEX"];
  if (
    globalThis.grammarForgeStore.plans.length !== 4 ||
    globalThis.grammarForgeStore.plans.some((plan) => !validTiers.includes(plan.tier))
  ) {
    globalThis.grammarForgeStore.plans = defaultPlans();
  }
  const freshPlans = defaultPlans();
  globalThis.grammarForgeStore.plans = globalThis.grammarForgeStore.plans.map((plan) => {
    const fresh = freshPlans.find((item) => item.tier === plan.tier);
    return fresh
      ? {
          ...fresh,
          ...plan,
          features: {
            ...fresh.features,
            ...plan.features
          }
        }
      : plan;
  });
  for (const user of globalThis.grammarForgeStore.users) {
    if (!validTiers.includes(user.subscriptionTier)) user.subscriptionTier = "FOUNDATION";
  }
  if (!globalThis.grammarForgeStore.publicPages?.length) {
    globalThis.grammarForgeStore.publicPages = defaultPublicPages();
  }
  globalThis.grammarForgeStore.questionGenerationJobs ??= [];
  globalThis.grammarForgeStore.questionGenerationSchedule ??= defaultQuestionGenerationSchedule();
  return globalThis.grammarForgeStore;
}

export function toSafeUser(user: StoredUser): SafeUser {
  return {
    id: user.id,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    parentId: user.parentId,
    stripeCustomerId: user.stripeCustomerId
  };
}

export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  parentId?: string;
}) {
  const data = store();
  const existing = data.users.find((user) => user.email?.toLowerCase() === input.email.toLowerCase());
  if (existing) throw new Error("An account with this email already exists.");

  const user: StoredUser = {
    id: uid("user"),
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password, 10),
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    parentId: input.role === "STUDENT" ? input.parentId ?? parentId : null,
    subscriptionTier: "FOUNDATION"
  };
  data.users.push(user);
  return toSafeUser(user);
}
