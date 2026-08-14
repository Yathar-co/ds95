import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";

test("the bundled PostgreSQL runtime executes a multi-statement project query", async () => {
  const db = await PGlite.create();
  try {
    await db.exec("CREATE TABLE scores(name TEXT, score INTEGER); INSERT INTO scores VALUES ('Ada', 88), ('Grace', 95);");
    const result = await db.query("SELECT name, score FROM scores ORDER BY score DESC");
    assert.deepEqual(result.rows, [{ name: "Grace", score: 95 }, { name: "Ada", score: 88 }]);
  } finally {
    await db.close();
  }
});
