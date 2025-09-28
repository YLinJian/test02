async function initTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `).run();
}

export async function onRequest(context) {
  const { request, env, url } = context;
  const db = env.D1_DATABASE;

  // 自动初始化表
  await initTable(db);

  if (request.method === "GET") {
    const params = new URL(url).searchParams;
    const page = parseInt(params.get("page") || "1");
    const limit = parseInt(params.get("limit") || "5");
    const offset = (page - 1) * limit;

    const result = await db.prepare(
      "SELECT id, name, message, created_at FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).bind(limit, offset).all();

    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "POST") {
    const data = await request.json();
    const name = data.name || "匿名";
    const message = data.message || "";

    if (!message) {
      return new Response(JSON.stringify({ error: "留言不能为空" }), { status: 400 });
    }

    await db.prepare(
      "INSERT INTO messages (name, message, created_at) VALUES (?, ?, ?)"
    ).bind(name, message, new Date().toISOString()).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
