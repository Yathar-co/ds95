import type { Task } from "@/lib/progress";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type LearningGoal = {
  subject: string;
  outcome: string;
  experience: ExperienceLevel;
};

export type LearningResource = {
  label: string;
  url: string;
  provider: "GeeksforGeeks" | "Kaggle Learn" | "YouTube" | "freeCodeCamp" | "MDN" | "Microsoft Learn" | "Google Developers" | "Official documentation" | "Learning resource";
};

export type AiLesson = {
  summary: string;
  keyPoints: string[];
  example: string;
  practice: string;
};

export type LearningTopic = {
  id: string;
  title: string;
  objective: string;
  resource: LearningResource | null;
  aiLesson?: AiLesson;
};

export type LearningModule = {
  id: string;
  title: string;
  description: string;
  topics: LearningTopic[];
};

export type LearningProject = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  tools: string[];
  resourceLabel: string;
  resourceUrl: string;
  tasks: string[];
};

export type LearningPath = {
  version: 1;
  title: string;
  tagline: string;
  description: string;
  generatedAt: string;
  goal: LearningGoal;
  modules: LearningModule[];
  projects: LearningProject[];
};

export type DayPlan = {
  day: number;
  topic: string;
  course: string;
  week: number;
  objective: string;
  resource: LearningResource | null;
  aiLesson?: AiLesson;
  tasks: Task[];
};

export type CourseView = {
  id: string;
  title: string;
  description: string;
  hours: number;
  topics: LearningTopic[];
};

export const LEARNING_PATH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "tagline", "description", "modules", "projects"],
  properties: {
    title: { type: "string", minLength: 3, maxLength: 80 },
    tagline: { type: "string", minLength: 3, maxLength: 100 },
    description: { type: "string", minLength: 20, maxLength: 320 },
    modules: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "topics"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 90 },
          description: { type: "string", minLength: 12, maxLength: 220 },
          topics: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "objective", "resourceLabel", "resourceUrl"],
              properties: {
                title: { type: "string", minLength: 2, maxLength: 100 },
                objective: { type: "string", minLength: 12, maxLength: 240 },
                resourceLabel: { type: "string", maxLength: 120 },
                resourceUrl: { type: "string", maxLength: 500 },
              },
            },
          },
        },
      },
    },
    projects: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "tools", "resourceLabel", "resourceUrl", "tasks"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 100 },
          description: { type: "string", minLength: 20, maxLength: 260 },
          tools: { type: "array", minItems: 2, maxItems: 5, items: { type: "string", maxLength: 40 } },
          resourceLabel: { type: "string", maxLength: 100 },
          resourceUrl: { type: "string", maxLength: 500 },
          tasks: { type: "array", minItems: 5, maxItems: 5, items: { type: "string", maxLength: 100 } },
        },
      },
    },
  },
} as const;

function slug(value: string, fallback: string) {
  const result = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
  return result || fallback;
}

export function directGfgResource(label: unknown, value: unknown): LearningResource | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (url.protocol !== "https:" || host !== "geeksforgeeks.org" || url.pathname === "/" || url.searchParams.has("s")) return null;
    return { label: typeof label === "string" && label.trim() ? label.trim().slice(0, 120) : "GeeksforGeeks guide", url: url.toString(), provider: "GeeksforGeeks" };
  } catch {
    return null;
  }
}

const blockedResourceHosts = new Set(["google.com", "bing.com", "duckduckgo.com"]);

function providerFor(url: URL): LearningResource["provider"] {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "geeksforgeeks.org") return "GeeksforGeeks";
  if (host === "kaggle.com") return "Kaggle Learn";
  if (host === "youtube.com" || host === "youtu.be") return "YouTube";
  if (host === "freecodecamp.org") return "freeCodeCamp";
  if (host === "developer.mozilla.org") return "MDN";
  if (host === "learn.microsoft.com") return "Microsoft Learn";
  if (host === "developers.google.com") return "Google Developers";
  if (/^(docs?|developer)\./.test(host) || /\.(edu|gov)$/.test(host)) return "Official documentation";
  return "Learning resource";
}

export function directLearningResource(label: unknown, value: unknown): LearningResource | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.toLowerCase().replace(/\/$/, "");
    if (url.protocol !== "https:" || !host || blockedResourceHosts.has(host) || !path || path === "/") return null;
    if (["s", "q", "query", "search_query"].some(key => url.searchParams.has(key)) || /\/(search|tags?|categories)(\/|$)/.test(path)) return null;
    if (host === "youtube.com" && path !== "/watch" && !path.startsWith("/playlist")) return null;
    if (host === "youtu.be" && path.split("/").filter(Boolean).length !== 1) return null;
    return {
      label: typeof label === "string" && label.trim() ? label.trim().slice(0, 120) : "Open learning resource",
      url: url.toString(),
      provider: providerFor(url),
    };
  } catch {
    return null;
  }
}

export function fallbackAiLesson(topic: Pick<LearningTopic, "title" | "objective">): AiLesson {
  const title = topic.title.trim();
  const objective = topic.objective.trim();
  return {
    summary: `${title} is an essential part of this learning path. ${objective}`.slice(0, 520),
    keyPoints: [
      `Define ${title.toLowerCase()} in your own words.`,
      `Identify where ${title.toLowerCase()} is used in a real workflow.`,
      `Connect the idea to your target outcome and note one limitation or trade-off.`,
    ],
    example: `Work through one small example of ${title.toLowerCase()} that directly supports your learning goal. Record the input, the steps you took and the result.`,
    practice: `Create a short explanation and a practical artifact that demonstrate: ${objective}`.slice(0, 420),
  };
}

export function normalizeAiLesson(value: unknown, topic: Pick<LearningTopic, "title" | "objective">): AiLesson {
  const fallback = fallbackAiLesson(topic);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const lesson = value as Record<string, unknown>;
  const keyPoints = Array.isArray(lesson.keyPoints)
    ? lesson.keyPoints.filter((point): point is string => typeof point === "string" && point.trim().length > 5).map(point => point.trim().slice(0, 220)).slice(0, 5)
    : [];
  return {
    summary: typeof lesson.summary === "string" && lesson.summary.trim().length > 20 ? lesson.summary.trim().slice(0, 520) : fallback.summary,
    keyPoints: keyPoints.length >= 3 ? keyPoints : fallback.keyPoints,
    example: typeof lesson.example === "string" && lesson.example.trim().length > 15 ? lesson.example.trim().slice(0, 520) : fallback.example,
    practice: typeof lesson.practice === "string" && lesson.practice.trim().length > 15 ? lesson.practice.trim().slice(0, 420) : fallback.practice,
  };
}

export function normalizeGeneratedLearningPath(raw: unknown, goal: LearningGoal, generatedAt = new Date().toISOString()): LearningPath | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  if (!Array.isArray(value.modules) || value.modules.length !== 8 || !Array.isArray(value.projects) || value.projects.length !== 3) return null;

  const modules: LearningModule[] = [];
  for (const [moduleIndex, moduleValue] of value.modules.entries()) {
    if (!moduleValue || typeof moduleValue !== "object" || Array.isArray(moduleValue)) return null;
    const generatedModule = moduleValue as Record<string, unknown>;
    if (typeof generatedModule.title !== "string" || typeof generatedModule.description !== "string" || !Array.isArray(generatedModule.topics) || generatedModule.topics.length !== 5) return null;
    const topics: LearningTopic[] = [];
    for (const [topicIndex, topicValue] of generatedModule.topics.entries()) {
      if (!topicValue || typeof topicValue !== "object" || Array.isArray(topicValue)) return null;
      const topic = topicValue as Record<string, unknown>;
      if (typeof topic.title !== "string" || typeof topic.objective !== "string") return null;
      topics.push({
        id: `${slug(generatedModule.title, `module-${moduleIndex + 1}`)}-${slug(topic.title, `topic-${topicIndex + 1}`)}`,
        title: topic.title.trim().slice(0, 100),
        objective: topic.objective.trim().slice(0, 240),
        resource: directLearningResource(topic.resourceLabel, topic.resourceUrl),
        aiLesson: fallbackAiLesson({ title: topic.title, objective: topic.objective }),
      });
    }
    modules.push({ id: slug(generatedModule.title, `module-${moduleIndex + 1}`), title: generatedModule.title.trim().slice(0, 90), description: generatedModule.description.trim().slice(0, 220), topics });
  }

  const icons = ["◎", "✦", "◇"];
  const projects: LearningProject[] = [];
  for (const [index, projectValue] of value.projects.entries()) {
    if (!projectValue || typeof projectValue !== "object" || Array.isArray(projectValue)) return null;
    const project = projectValue as Record<string, unknown>;
    if (typeof project.title !== "string" || typeof project.description !== "string" || !Array.isArray(project.tools) || !Array.isArray(project.tasks)) return null;
    const tools = project.tools.filter((item): item is string => typeof item === "string").slice(0, 5);
    const tasks = project.tasks.filter((item): item is string => typeof item === "string").slice(0, 5);
    if (tools.length < 2 || tasks.length !== 5) return null;
    let resourceUrl = "";
    if (typeof project.resourceUrl === "string" && project.resourceUrl.trim()) {
      try { const candidate = new URL(project.resourceUrl); if (candidate.protocol === "https:") resourceUrl = candidate.toString(); } catch { /* invalid optional reference */ }
    }
    projects.push({
      id: slug(project.title, `project-${index + 1}`), icon: icons[index], title: project.title.trim().slice(0, 100), desc: project.description.trim().slice(0, 260), tools,
      resourceLabel: typeof project.resourceLabel === "string" ? project.resourceLabel.trim().slice(0, 100) : "Project reference",
      resourceUrl, tasks,
    });
  }

  if (typeof value.title !== "string" || typeof value.tagline !== "string" || typeof value.description !== "string") return null;
  return { version: 1, title: value.title.trim().slice(0, 80), tagline: value.tagline.trim().slice(0, 100), description: value.description.trim().slice(0, 320), generatedAt, goal, modules, projects };
}

export function isLearningPath(value: unknown): value is LearningPath {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const path = value as Partial<LearningPath>;
  return path.version === 1 && typeof path.title === "string" && !!path.goal && Array.isArray(path.modules) && path.modules.length === 8 && path.modules.every(module => Array.isArray(module.topics) && module.topics.length === 5) && Array.isArray(path.projects) && path.projects.length === 3;
}

export function coursesFromPath(path: LearningPath): CourseView[] {
  return path.modules.map(module => ({ ...module, hours: 10, topics: module.topics.map(topic => ({ ...topic, aiLesson: topic.aiLesson || fallbackAiLesson(topic) })) }));
}

function makeTopicId(course: string, topic: string) {
  return `${course.trim().toLowerCase()}::${topic.trim().toLowerCase()}`;
}

export function curriculumFromPath(path: LearningPath): DayPlan[] {
  const days: DayPlan[] = [];
  let day = 1;
  path.modules.forEach((module, moduleIndex) => {
    module.topics.forEach(topic => {
      const topicId = makeTopicId(module.title, topic.title);
      const preparedTopic = { ...topic, aiLesson: topic.aiLesson || fallbackAiLesson(topic) };
      days.push({ day, topic: topic.title, course: module.title, week: Math.ceil(day / 7), objective: topic.objective, resource: preparedTopic.resource, aiLesson: preparedTopic.aiLesson, tasks: [
        { id: `d${day}-learn`, title: `Learn: ${topic.title}`, type: "Lesson", mins: 40, required: true, topicId },
        { id: `d${day}-notes`, title: "Explain the idea in your own words", type: "Review", mins: 20, required: true },
        { id: `d${day}-questions`, title: "Write three questions to test your understanding", type: "Practice", mins: 20, required: false },
      ] });
      day += 1;
      days.push({ day, topic: `${topic.title} · applied practice`, course: module.title, week: Math.ceil(day / 7), objective: `Apply ${topic.title.toLowerCase()} in a concrete exercise connected to ${path.goal.outcome.toLowerCase()}.`, resource: preparedTopic.resource, aiLesson: preparedTopic.aiLesson, tasks: [
        { id: `d${day}-practice`, title: `Practice: ${topic.title}`, type: "Practice", mins: 45, required: true, topicId },
        { id: `d${day}-evidence`, title: "Save evidence of what you produced", type: "Project", mins: 25, required: true },
        { id: `d${day}-reflect`, title: "Record one strength and one gap", type: "Review", mins: 15, required: false },
      ] });
      day += 1;
    });
    days.push({ day, topic: `${module.title} checkpoint`, course: module.title, week: Math.ceil(day / 7), objective: `Connect the five ideas in ${module.title} and demonstrate that you can use them together.`, resource: null, tasks: [
      { id: `d${day}-checkpoint`, title: `Complete the ${module.title} checkpoint`, type: "Review", mins: 45, required: true },
      { id: `d${day}-artifact`, title: "Create a small proof-of-learning artifact", type: "Project", mins: 35, required: true },
      { id: `d${day}-plan`, title: `Plan your next module: ${path.modules[moduleIndex + 1]?.title || "final project"}`, type: "Review", mins: 15, required: false },
    ] });
    day += 1;
  });
  const finalTopics = ["Choose your strongest evidence", "Close the most important knowledge gap", "Complete your final project", "Review and refine your work", "Explain what you learned", "Publish or present your outcome", "Reflect and plan the next 95 days"];
  finalTopics.forEach((topic, index) => {
    days.push({ day, topic, course: "Final completion period", week: Math.ceil(day / 7), objective: `${topic} so your ${path.title} sprint ends with visible, reusable evidence.`, resource: null, tasks: [
      { id: `d${day}-final`, title: topic, type: index < 4 ? "Project" : "Review", mins: 55, required: true },
      { id: `d${day}-document`, title: "Document the result and your next action", type: "Review", mins: 25, required: true },
    ] });
    day += 1;
  });
  return days;
}
