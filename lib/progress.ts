export type Task = {
  id: string;
  title: string;
  type: "Lesson" | "Practice" | "Project" | "Review";
  mins: number;
  required: boolean;
  topicId?: string;
};

export type Activity = {
  completed: string[];
  minutes: number;
  notes: string;
  difficulty: number;
  confidence: number;
  challenge?: boolean;
  reflection?: string;
};

export type AppState = {
  name: string;
  startDate: string;
  dailyTarget: number;
  timezone?: string;
  theme: "dark" | "light";
  onboarded: boolean;
  xp: number;
  activities: Record<string, Activity>;
  completedTopics: string[];
  completedProjectTasks: string[];
  personalTasks: Task[];
  freezes: string[];
};

function localIso(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function createFreshState(name = "Learner", startDate = localIso(new Date())): AppState {
  return {
    name,
    startDate,
    dailyTarget: 120,
    theme: "dark",
    onboarded: false,
    xp: 0,
    activities: {},
    completedTopics: [],
    completedProjectTasks: [],
    personalTasks: [],
    freezes: [],
  };
}

export function progressStorageKey(userId: string) {
  return `datasprint95:${userId}`;
}

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Partial<AppState>;
  return (
    typeof state.name === "string" &&
    typeof state.startDate === "string" &&
    typeof state.dailyTarget === "number" &&
    (state.theme === "dark" || state.theme === "light") &&
    typeof state.onboarded === "boolean" &&
    typeof state.xp === "number" &&
    !!state.activities &&
    typeof state.activities === "object" &&
    !Array.isArray(state.activities) &&
    (state.completedTopics === undefined || Array.isArray(state.completedTopics)) &&
    (state.completedProjectTasks === undefined || Array.isArray(state.completedProjectTasks)) &&
    Array.isArray(state.personalTasks) &&
    Array.isArray(state.freezes)
  );
}

export function isLegacyDemoState(state: AppState) {
  const activities = Object.values(state.activities);
  const completedTasks = activities.reduce((total, activity) => total + activity.completed.length, 0);
  return state.name === "Alex" && state.xp === 1480 && activities.length === 20 && completedTasks === 54;
}

export function normalizeProgressState(value: unknown, accountName: string): AppState {
  if (!isAppState(value)) return createFreshState(accountName);
  const rawTopics = (value as AppState & { completedTopics?: unknown }).completedTopics;
  const topicsAreValid = Array.isArray(rawTopics) && rawTopics.every((topic) => typeof topic === "string");
  const rawProjectTasks = (value as AppState & { completedProjectTasks?: unknown }).completedProjectTasks;
  const projectTasksAreValid = Array.isArray(rawProjectTasks) && rawProjectTasks.every((task) => typeof task === "string");
  const normalized = topicsAreValid && projectTasksAreValid
    ? value
    : {
        ...value,
        completedTopics: Array.isArray(rawTopics) ? rawTopics.filter((topic): topic is string => typeof topic === "string") : [],
        completedProjectTasks: Array.isArray(rawProjectTasks) ? rawProjectTasks.filter((task): task is string => typeof task === "string") : [],
      };
  if (!isLegacyDemoState(normalized)) return normalized;
  return { ...createFreshState(accountName), onboarded: normalized.onboarded };
}

export function topicProgressId(course: string, topic: string) {
  return `${course.trim().toLowerCase()}::${topic.trim().toLowerCase()}`;
}
