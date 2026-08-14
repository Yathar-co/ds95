import {
  LEARNING_PATH_SCHEMA,
  directGfgResource,
  normalizeGeneratedLearningPath,
  type ExperienceLevel,
  type LearningGoal,
  type LearningModule,
} from "@/lib/learning-path";
import { currentUserId } from "@/lib/server-auth";

export const runtime = "nodejs";
export const maxDuration = 120;

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const levels = new Set<ExperienceLevel>(["beginner", "intermediate", "advanced"]);

type JsonRecord = Record<string, unknown>;
type GroqMessage = JsonRecord & { content?: unknown; executed_tools?: unknown };

class GroqRequestError extends Error {
  constructor(readonly status: number, readonly responseBody: unknown) {
    super(`Groq request failed with status ${status}`);
  }
}

function parseGoal(value: unknown): LearningGoal | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const goal = value as Record<string, unknown>;
  const subject = typeof goal.subject === "string" ? goal.subject.trim() : "";
  const outcome = typeof goal.outcome === "string" ? goal.outcome.trim() : "";
  const experience = goal.experience;
  if (subject.length < 2 || subject.length > 100 || outcome.length < 8 || outcome.length > 300 || typeof experience !== "string" || !levels.has(experience as ExperienceLevel)) return null;
  return { subject, outcome, experience: experience as ExperienceLevel };
}

function groqCompatibleSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(groqCompatibleSchema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([key]) => !["minLength", "maxLength", "minItems", "maxItems"].includes(key))
      .map(([key, child]) => [key, groqCompatibleSchema(child)]),
  );
}

function messageFrom(response: JsonRecord): GroqMessage | null {
  if (!Array.isArray(response.choices)) return null;
  const first = response.choices[0];
  if (!first || typeof first !== "object") return null;
  const message = (first as JsonRecord).message;
  return message && typeof message === "object" ? message as GroqMessage : null;
}

function textFrom(message: GroqMessage | null) {
  if (!message) return "";
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return "";
  return message.content.map(part => {
    if (typeof part === "string") return part;
    return part && typeof part === "object" && typeof (part as JsonRecord).text === "string" ? String((part as JsonRecord).text) : "";
  }).join("");
}

function canonicalUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function verifiedSearchUrls(message: GroqMessage | null) {
  const urls = new Set<string>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = value as JsonRecord;
    if (typeof record.url === "string") urls.add(canonicalUrl(record.url));
    Object.values(record).forEach(visit);
  };
  visit(message?.executed_tools);
  return urls;
}

async function groqChat(apiKey: string, body: JsonRecord, signal: AbortSignal) {
  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    signal,
    body: JSON.stringify(body),
  });
  const responseBody = await response.json() as JsonRecord;
  if (!response.ok) throw new GroqRequestError(response.status, responseBody);
  return responseBody;
}

async function addVerifiedResources(module: LearningModule, goal: LearningGoal, apiKey: string, signal: AbortSignal) {
  try {
    const response = await groqChat(apiKey, {
      model: process.env.GROQ_RESEARCH_MODEL || "groq/compound",
      store: false,
      temperature: 0,
      citation_options: "disabled",
      search_settings: { include_domains: ["geeksforgeeks.org"] },
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Find a genuinely relevant, direct GeeksforGeeks learning article for each supplied topic. Use web search for every topic. Return only JSON with this shape: {\"resources\":[{\"topicId\":\"the supplied ID\",\"label\":\"descriptive article label\",\"url\":\"direct canonical HTTPS article URL\"}]}. Omit a topic when no relevant direct article exists. Never return a search-results URL, homepage, tag page, category page, invented URL, or unrelated page.",
        },
        {
          role: "user",
          content: `Learning goal: ${goal.subject} — ${goal.outcome}\nModule: ${module.title}\nTopics:\n${module.topics.map(topic => `${topic.id}: ${topic.title} — ${topic.objective}`).join("\n")}`,
        },
      ],
    }, signal);
    const message = messageFrom(response);
    const verifiedUrls = verifiedSearchUrls(message);
    const parsed = JSON.parse(textFrom(message)) as JsonRecord;
    const resources = Array.isArray(parsed.resources) ? parsed.resources : [];
    const byTopic = new Map<string, ReturnType<typeof directGfgResource>>();
    resources.forEach(value => {
      if (!value || typeof value !== "object") return;
      const resource = value as JsonRecord;
      if (typeof resource.topicId !== "string") return;
      const direct = directGfgResource(resource.label, resource.url);
      if (direct && verifiedUrls.has(canonicalUrl(direct.url))) byTopic.set(resource.topicId, direct);
    });
    return { ...module, topics: module.topics.map(topic => ({ ...topic, resource: byTopic.get(topic.id) || null })) };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    console.warn("Groq resource research failed for module", module.id, error);
    return { ...module, topics: module.topics.map(topic => ({ ...topic, resource: null })) };
  }
}

export async function POST(request: Request) {
  const userId = await currentUserId(request);
  if (!userId) return Response.json({ error: "Sign in is required" }, { status: 401 });

  let goal: LearningGoal | null = null;
  try {
    const raw = await request.text();
    if (raw.length > 2_000) return Response.json({ error: "Learning goal is too large" }, { status: 413 });
    goal = parseGoal(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Enter a valid learning goal" }, { status: 400 });
  }
  if (!goal) return Response.json({ error: "Tell us what you want to learn and what you want to make or achieve" }, { status: 400 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Response.json({ error: "AI roadmap generation is not configured yet. Add GROQ_API_KEY in Vercel and try again." }, { status: 503 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 115_000);
  try {
    const generation = await groqChat(apiKey, {
      model: process.env.GROQ_SYLLABUS_MODEL || "openai/gpt-oss-120b",
      store: false,
      temperature: 0.35,
      response_format: {
        type: "json_schema",
        json_schema: { name: "ds95_learning_path", strict: true, schema: groqCompatibleSchema(LEARNING_PATH_SCHEMA) },
      },
      messages: [
        {
          role: "system",
          content: "You design rigorous, practical 95-day learning programs. Create exactly 8 progressive modules with exactly 5 distinct subtopics each, plus exactly 3 increasingly ambitious proof-of-learning projects. Keep the path focused on the learner's outcome and appropriate to their experience. Module titles, subtopics, exercises and projects must be concrete rather than generic. Resource research happens separately, so set every resourceLabel and resourceUrl to an empty string and every project referenceLabel and referenceUrl to an empty string.",
        },
        {
          role: "user",
          content: `Subject: ${goal.subject}\nDesired outcome: ${goal.outcome}\nCurrent experience: ${goal.experience}\n\nBuild a coherent path from the learner's current level to that specific outcome.`,
        },
      ],
    }, controller.signal);
    let parsed: unknown;
    try {
      parsed = JSON.parse(textFrom(messageFrom(generation)));
    } catch {
      return Response.json({ error: "The AI planner returned an incomplete roadmap. Please try again." }, { status: 502 });
    }
    const learningPath = normalizeGeneratedLearningPath(parsed, goal);
    if (!learningPath) return Response.json({ error: "The AI planner returned an invalid roadmap. Please try again." }, { status: 502 });

    learningPath.modules = await Promise.all(
      learningPath.modules.map(module => addVerifiedResources(module, goal, apiKey, controller.signal)),
    );
    return Response.json({ learningPath });
  } catch (error) {
    if (error instanceof GroqRequestError) {
      console.error("Groq learning path request failed", error.status, error.responseBody);
      return Response.json({ error: error.status === 429 ? "The AI planner is busy. Wait a moment and try again." : "The AI planner could not create this roadmap. Please try again." }, { status: error.status === 429 ? 429 : 502 });
    }
    console.error("Unable to generate learning path", error);
    return Response.json({ error: error instanceof DOMException && error.name === "AbortError" ? "Roadmap generation timed out. Please try again." : "The AI planner is temporarily unavailable." }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
