import {
  LEARNING_PATH_SCHEMA,
  directLearningResource,
  fallbackLearningPath,
  fallbackAiLesson,
  normalizeAiLesson,
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
    if (typeof value === "string") {
      value.match(/https:\/\/[^\s<>"')\]]+/g)?.forEach(candidate => urls.add(canonicalUrl(candidate.replace(/[.,;:!?]+$/, ""))));
      return;
    }
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
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "Groq-Model-Version": "latest" },
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
      max_completion_tokens: 1_200,
      citation_options: "disabled",
      compound_custom: { tools: { enabled_tools: ["web_search", "visit_website"] } },
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Research every supplied topic separately. Search broadly and visit promising pages. Prefer, in order: a directly relevant GeeksforGeeks article; Kaggle Learn; official product or language documentation; freeCodeCamp; MDN; Microsoft Learn; Google Developers; a focused university or government guide; then a high-quality YouTube lesson. Never use a search-results page, homepage, tag/category page, invented URL or loosely related source. Return only JSON shaped as {\"topics\":[{\"topicId\":\"supplied ID\",\"resource\":{\"label\":\"specific source title\",\"url\":\"direct canonical HTTPS URL\"}|null,\"lesson\":{\"summary\":\"clear 2-4 sentence explanation\",\"keyPoints\":[\"3-5 essential points\"],\"example\":\"concrete worked example\",\"practice\":\"specific practice exercise\"}}]}. Include every topic exactly once. The lesson is a fallback study guide and must be accurate and useful even when a source is found.",
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
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
    const researched = new Map<string, { resource: ReturnType<typeof directLearningResource>; lesson: unknown }>();
    topics.forEach(value => {
      if (!value || typeof value !== "object") return;
      const result = value as JsonRecord;
      if (typeof result.topicId !== "string") return;
      const candidate = result.resource && typeof result.resource === "object" && !Array.isArray(result.resource) ? result.resource as JsonRecord : null;
      const direct = candidate ? directLearningResource(candidate.label, candidate.url) : null;
      researched.set(result.topicId, { resource: direct && verifiedUrls.has(canonicalUrl(direct.url)) ? direct : null, lesson: result.lesson });
    });
    return {
      ...module,
      topics: module.topics.map(topic => {
        const result = researched.get(topic.id);
        return { ...topic, resource: result?.resource || null, aiLesson: normalizeAiLesson(result?.lesson, topic) };
      }),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    console.warn("Groq resource research failed for module", module.id, error);
    return { ...module, topics: module.topics.map(topic => ({ ...topic, resource: null, aiLesson: topic.aiLesson || fallbackAiLesson(topic) })) };
  }
}

const { projects: projectProperty, ...curriculumProperties } = LEARNING_PATH_SCHEMA.properties;
const CURRICULUM_SCHEMA = {
  ...LEARNING_PATH_SCHEMA,
  required: ["title", "tagline", "description", "modules"],
  properties: curriculumProperties,
};
const PROJECTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["projects"],
  properties: { projects: projectProperty },
};

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
    const commonUserPrompt = `Subject: ${goal.subject}\nDesired outcome: ${goal.outcome}\nCurrent experience: ${goal.experience}`;
    const [curriculumGeneration, projectGeneration] = await Promise.all([
      groqChat(apiKey, {
        model: process.env.GROQ_SYLLABUS_MODEL || "openai/gpt-oss-120b",
        store: false,
        temperature: 0.35,
        max_completion_tokens: 3_600,
        response_format: { type: "json_schema", json_schema: { name: "ds95_curriculum", strict: true, schema: groqCompatibleSchema(CURRICULUM_SCHEMA) } },
        messages: [
          { role: "system", content: "Design a rigorous, practical 95-day learning curriculum. Create exactly 8 progressive modules with exactly 5 distinct, concrete subtopics each. Keep it focused on the learner's outcome and appropriate to their experience. Resource research happens separately, so set each topic resourceLabel and resourceUrl to an empty string." },
          { role: "user", content: `${commonUserPrompt}\n\nBuild a coherent curriculum from the learner's current level to that specific outcome.` },
        ],
      }, controller.signal),
      groqChat(apiKey, {
        model: process.env.GROQ_SYLLABUS_MODEL || "openai/gpt-oss-120b",
        store: false,
        temperature: 0.3,
        max_completion_tokens: 1_200,
        response_format: { type: "json_schema", json_schema: { name: "ds95_projects", strict: true, schema: groqCompatibleSchema(PROJECTS_SCHEMA) } },
        messages: [
          { role: "system", content: "Create exactly 3 increasingly ambitious proof-of-learning projects for the learner's specific outcome. Each project must have concrete deliverables, 2-5 relevant tools and exactly 5 tasks. Set resourceLabel and resourceUrl to empty strings because source research happens separately." },
          { role: "user", content: `${commonUserPrompt}\n\nCreate a foundation project, an applied project and a portfolio-quality capstone.` },
        ],
      }, controller.signal),
    ]);
    let parsed: unknown;
    try {
      const curriculum = JSON.parse(textFrom(messageFrom(curriculumGeneration))) as JsonRecord;
      const projects = JSON.parse(textFrom(messageFrom(projectGeneration))) as JsonRecord;
      parsed = { ...curriculum, projects: projects.projects };
    } catch (error) {
      console.warn("AI planner returned incomplete JSON; using the resilient roadmap", error);
      return Response.json({ learningPath: fallbackLearningPath(goal), notice: "A reliable starter roadmap was created while AI generation recovers." });
    }
    const learningPath = normalizeGeneratedLearningPath(parsed, goal);
    if (!learningPath) {
      console.warn("AI planner returned an invalid roadmap; using the resilient roadmap");
      return Response.json({ learningPath: fallbackLearningPath(goal), notice: "A reliable starter roadmap was created while AI generation recovers." });
    }

    learningPath.modules = await Promise.all(
      learningPath.modules.map(module => addVerifiedResources(module, goal, apiKey, controller.signal)),
    );
    return Response.json({ learningPath });
  } catch (error) {
    if (error instanceof GroqRequestError) {
      console.error("Groq learning path request failed", error.status, error.responseBody);
      return Response.json({ learningPath: fallbackLearningPath(goal), notice: "Groq is temporarily limited, so DS95 created a reliable starter roadmap instead." });
    }
    console.error("Unable to generate learning path", error);
    return Response.json({ learningPath: fallbackLearningPath(goal), notice: "AI generation was temporarily unavailable, so DS95 created a reliable starter roadmap instead." });
  } finally {
    clearTimeout(timeout);
  }
}
