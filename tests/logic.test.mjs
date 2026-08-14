import test from "node:test";
import assert from "node:assert/strict";
import {
  createFreshState,
  isWorkspaceLanguage,
  normalizeProgressState,
  normalizeGithubRepositoryUrl,
  progressStorageKey,
  topicProgressId,
} from "../lib/progress.ts";
import { curriculumFromPath, directGfgResource, directLearningResource, normalizeGeneratedLearningPath } from "../lib/learning-path.ts";

const active = (a) => !!a && (a.tasks > 0 || a.minutes >= 30);
const marker = ({day,complete,challenge=false,done=0,required=3}) => {
  if (complete) return "graduated";
  if (day > 100) return "overdue";
  if (day > 95) return "grace";
  if (challenge && done === required) return "challenge";
  if (done === required) return "full";
  if (done >= Math.ceil(required/2)) return "half";
  return done ? "some" : "none";
};
const expected = day => Math.min(100, Math.round(day / 95 * 100));

test("meaningful activity requires a task or 30 minutes", () => {
  assert.equal(active({tasks:0,minutes:29}), false);
  assert.equal(active({tasks:0,minutes:30}), true);
  assert.equal(active({tasks:1,minutes:1}), true);
});

test("deadline markers use grace and overdue windows", () => {
  assert.equal(marker({day:95,complete:false}), "none");
  assert.equal(marker({day:96,complete:false}), "grace");
  assert.equal(marker({day:101,complete:false}), "overdue");
  assert.equal(marker({day:101,complete:true}), "graduated");
});

test("expected completion caps at one hundred percent", () => {
  assert.equal(expected(48), 51);
  assert.equal(expected(120), 100);
});

test("new accounts begin at zero with isolated storage", () => {
  const first = createFreshState("First account", "2026-08-14");
  const second = createFreshState("Second account", "2026-08-14");
  assert.equal(first.xp, 0);
  assert.deepEqual(first.activities, {});
  assert.deepEqual(first.completedTopics, []);
  assert.deepEqual(first.completedProjectTasks, []);
  assert.deepEqual(first.workspaceFiles, []);
  assert.deepEqual(first.projectRepositories, {});
  assert.deepEqual(second.activities, {});
  assert.notEqual(progressStorageKey("user-a"), progressStorageKey("user-b"));
});

test("older progress gains workspace storage without losing activity", () => {
  const current = createFreshState("Learner", "2026-08-14");
  const legacy = { ...current, xp: 50 };
  delete legacy.completedTopics;
  delete legacy.completedProjectTasks;
  delete legacy.workspaceFiles;
  delete legacy.projectRepositories;
  const migrated = normalizeProgressState(legacy, "Learner");
  assert.deepEqual(migrated.completedTopics, []);
  assert.deepEqual(migrated.completedProjectTasks, []);
  assert.deepEqual(migrated.workspaceFiles, []);
  assert.deepEqual(migrated.projectRepositories, {});
  assert.equal(migrated.xp, 50);
});

test("workspace accepts major programming languages and rejects unknown runtimes", () => {
  for (const language of ["python", "javascript", "typescript", "c", "cpp", "java", "go", "rust", "swift", "haskell", "notes"]) {
    assert.equal(isWorkspaceLanguage(language), true);
  }
  assert.equal(isWorkspaceLanguage("made-up-language"), false);
});

test("GitHub repository links are normalized and constrained to repositories", () => {
  assert.equal(normalizeGithubRepositoryUrl("git@github.com:Yathar-co/ds95.git"), "https://github.com/Yathar-co/ds95");
  assert.equal(normalizeGithubRepositoryUrl("github.com/Yathar-co/ds95/"), "https://github.com/Yathar-co/ds95");
  assert.equal(normalizeGithubRepositoryUrl("https://gitlab.com/Yathar-co/ds95"), null);
  assert.equal(normalizeGithubRepositoryUrl("https://github.com/Yathar-co"), null);
});

test("topic completion ids are stable across syllabus and daily views", () => {
  assert.equal(
    topicProgressId("What is Data Science?", "Structured and unstructured data"),
    "what is data science?::structured and unstructured data",
  );
});

test("known demo progress is reset without changing real progress", () => {
  const fresh = createFreshState("Learner", "2026-08-14");
  const legacyActivities = Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => [
      `day-${index}`,
      {
        completed: Array.from({ length: index < 6 ? 2 : 3 }, (__, task) => `task-${task}`),
        minutes: 60,
        notes: "",
        difficulty: 3,
        confidence: 3,
      },
    ]),
  );
  const legacy = { ...fresh, name: "Alex", xp: 1480, onboarded: true, activities: legacyActivities };
  const migrated = normalizeProgressState(legacy, "Real account");
  assert.equal(migrated.name, "Real account");
  assert.equal(migrated.xp, 0);
  assert.deepEqual(migrated.activities, {});
  assert.equal(migrated.onboarded, true);

  const real = { ...fresh, xp: 50 };
  assert.equal(normalizeProgressState(real, "Real account"), real);
});

test("AI learning paths normalize into exactly 95 scheduled days", () => {
  const modules = Array.from({ length: 8 }, (_, moduleIndex) => ({
    title: `Module ${moduleIndex + 1}`,
    description: "A focused and practical learning module.",
    topics: Array.from({ length: 5 }, (_, topicIndex) => ({
      title: `Topic ${moduleIndex + 1}.${topicIndex + 1}`,
      objective: "Understand the concept and apply it in a real exercise.",
      resourceLabel: "Direct guide",
      resourceUrl: "https://www.geeksforgeeks.org/python/python-variables/",
    })),
  }));
  const projects = Array.from({ length: 3 }, (_, index) => ({
    title: `Project ${index + 1}`,
    description: "Create a substantial proof-of-learning artifact for the selected outcome.",
    tools: ["Practice", "Documentation"],
    resourceLabel: "",
    resourceUrl: "",
    tasks: ["Define scope", "Create draft", "Test result", "Document work", "Publish outcome"],
  }));
  const path = normalizeGeneratedLearningPath(
    { title: "Personal mastery", tagline: "Learn by building", description: "A complete path from foundations to a substantial final outcome.", modules, projects },
    { subject: "Example skill", outcome: "Build a high-quality final artifact", experience: "beginner" },
    "2026-08-14T00:00:00.000Z",
  );
  assert.ok(path);
  const curriculum = curriculumFromPath(path);
  assert.equal(curriculum.length, 95);
  assert.equal(curriculum[0].day, 1);
  assert.equal(curriculum[94].day, 95);
  assert.equal(path.modules.flatMap(module => module.topics).length, 40);
  assert.equal(path.projects.length, 3);
});

test("resource validation accepts direct GFG articles and rejects searches or other hosts", () => {
  assert.ok(directGfgResource("Python variables", "https://www.geeksforgeeks.org/python/python-variables/"));
  assert.equal(directGfgResource("Search", "https://www.geeksforgeeks.org/?s=python+variables"), null);
  assert.equal(directGfgResource("Imposter", "https://example.com/geeksforgeeks/python"), null);
  assert.equal(directGfgResource("Insecure", "http://www.geeksforgeeks.org/python/python-variables/"), null);
});

test("resource validation accepts researched learning providers and rejects search pages", () => {
  assert.equal(directLearningResource("Kaggle intro", "https://www.kaggle.com/learn/intro-to-machine-learning")?.provider, "Kaggle Learn");
  assert.equal(directLearningResource("Video lesson", "https://www.youtube.com/watch?v=abcdefghijk")?.provider, "YouTube");
  assert.equal(directLearningResource("MDN guide", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide")?.provider, "MDN");
  assert.equal(directLearningResource("Search", "https://www.youtube.com/results?search_query=javascript"), null);
  assert.equal(directLearningResource("Search", "https://www.google.com/search?q=javascript"), null);
});

test("AI learning paths always include a usable lesson fallback", () => {
  const modules = Array.from({ length: 8 }, (_, moduleIndex) => ({
    title: `Module ${moduleIndex + 1}`,
    description: "A focused and practical learning module.",
    topics: Array.from({ length: 5 }, (_, topicIndex) => ({
      title: `Topic ${moduleIndex + 1}.${topicIndex + 1}`,
      objective: "Understand the concept and apply it in a real exercise.",
      resourceLabel: "",
      resourceUrl: "",
    })),
  }));
  const projects = Array.from({ length: 3 }, (_, index) => ({
    title: `Project ${index + 1}`,
    description: "Create a substantial proof-of-learning artifact for the selected outcome.",
    tools: ["Practice", "Documentation"],
    resourceLabel: "",
    resourceUrl: "",
    tasks: ["Define scope", "Create draft", "Test result", "Document work", "Publish outcome"],
  }));
  const path = normalizeGeneratedLearningPath(
    { title: "Personal mastery", tagline: "Learn by building", description: "A complete path from foundations to a substantial final outcome.", modules, projects },
    { subject: "Example skill", outcome: "Build a high-quality final artifact", experience: "beginner" },
  );
  assert.ok(path?.modules.every(module => module.topics.every(topic => topic.aiLesson?.keyPoints.length >= 3)));
});
