import test from "node:test";
import assert from "node:assert/strict";
import {
  createFreshState,
  normalizeProgressState,
  progressStorageKey,
  topicProgressId,
} from "../lib/progress.ts";

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
  assert.deepEqual(second.activities, {});
  assert.notEqual(progressStorageKey("user-a"), progressStorageKey("user-b"));
});

test("older progress gains topic and project completion storage without losing activity", () => {
  const current = createFreshState("Learner", "2026-08-14");
  const legacy = { ...current, xp: 50 };
  delete legacy.completedTopics;
  delete legacy.completedProjectTasks;
  const migrated = normalizeProgressState(legacy, "Learner");
  assert.deepEqual(migrated.completedTopics, []);
  assert.deepEqual(migrated.completedProjectTasks, []);
  assert.equal(migrated.xp, 50);
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
