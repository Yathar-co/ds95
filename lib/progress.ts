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

export type WorkspaceLanguage = "python" | "r" | "sql";

export type WorkspaceFile = {
  id: string;
  name: string;
  language: WorkspaceLanguage;
  code: string;
  updatedAt: string;
  day?: number;
  projectId?: string;
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
  workspaceFiles: WorkspaceFile[];
  projectRepositories: Record<string, string>;
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
    workspaceFiles: [],
    projectRepositories: {},
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
    (state.workspaceFiles === undefined || Array.isArray(state.workspaceFiles)) &&
    (state.projectRepositories === undefined || (!!state.projectRepositories && typeof state.projectRepositories === "object" && !Array.isArray(state.projectRepositories))) &&
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
  const rawFiles = (value as AppState & { workspaceFiles?: unknown }).workspaceFiles;
  const filesAreValid = Array.isArray(rawFiles) && rawFiles.length <= 100 && rawFiles.every(isWorkspaceFile);
  const workspaceFiles = Array.isArray(rawFiles) ? rawFiles.filter(isWorkspaceFile).slice(0, 100) : [];
  const rawRepositories = (value as AppState & { projectRepositories?: unknown }).projectRepositories;
  const repositoriesAreValid = !!rawRepositories && typeof rawRepositories === "object" && !Array.isArray(rawRepositories) && Object.entries(rawRepositories).every(([key, url]) => key.length <= 100 && typeof url === "string" && url.length <= 300);
  const projectRepositories = rawRepositories && typeof rawRepositories === "object" && !Array.isArray(rawRepositories)
    ? Object.fromEntries(Object.entries(rawRepositories).filter(([key, url]) => key.length <= 100 && typeof url === "string" && url.length <= 300))
    : {};
  const normalized: AppState = topicsAreValid && projectTasksAreValid && filesAreValid && repositoriesAreValid ? value : {
    ...value,
    completedTopics: topicsAreValid ? rawTopics : Array.isArray(rawTopics) ? rawTopics.filter((topic): topic is string => typeof topic === "string") : [],
    completedProjectTasks: projectTasksAreValid ? rawProjectTasks : Array.isArray(rawProjectTasks) ? rawProjectTasks.filter((task): task is string => typeof task === "string") : [],
    workspaceFiles,
    projectRepositories,
  };
  if (!isLegacyDemoState(normalized)) return normalized;
  return { ...createFreshState(accountName), onboarded: normalized.onboarded };
}

function isWorkspaceFile(value: unknown): value is WorkspaceFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const file = value as Partial<WorkspaceFile>;
  return typeof file.id === "string" && file.id.length <= 120 &&
    typeof file.name === "string" && file.name.length <= 120 &&
    (file.language === "python" || file.language === "r" || file.language === "sql") &&
    typeof file.code === "string" && file.code.length <= 60_000 &&
    typeof file.updatedAt === "string" &&
    (file.day === undefined || (Number.isInteger(file.day) && file.day > 0 && file.day <= 95)) &&
    (file.projectId === undefined || (typeof file.projectId === "string" && file.projectId.length <= 100));
}

export function normalizeGithubRepositoryUrl(input: string) {
  const candidate = input.trim().replace(/^git@github\.com:/i, "https://github.com/").replace(/\.git$/i, "");
  try {
    const url = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.hostname.toLowerCase() !== "github.com" || parts.length !== 2) return null;
    return `https://github.com/${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

export function topicProgressId(course: string, topic: string) {
  return `${course.trim().toLowerCase()}::${topic.trim().toLowerCase()}`;
}
