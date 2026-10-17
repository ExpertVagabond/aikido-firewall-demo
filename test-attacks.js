/**
 * Tests attack vectors against the Aikido firewall demo.
 * Run the server first: AIKIDO_BLOCK=true node server.js
 */
const BASE = `http://localhost:${process.env.PORT || 3001}`;

const tests = [
  {
    name: "Normal search",
    url: `${BASE}/search?q=alice`,
    expect: "pass",
  },
  {
    name: "SQL injection (GET)",
    url: `${BASE}/search?q=%27%3B+DROP+TABLE+users%3B+--`,
    expect: "block",
  },
  {
    name: "SQL injection (UNION)",
    url: `${BASE}/search?q=%27+UNION+SELECT+1%2C2%2C3--`,
    expect: "block",
  },
  {
    name: "Path traversal",
    url: `${BASE}/file?name=../../../etc/passwd`,
    expect: "block",
  },
  {
    name: "Normal file read",
    url: `${BASE}/file?name=readme.txt`,
    expect: "pass",
  },
  {
    name: "SQL injection (POST body)",
    url: `${BASE}/login`,
    method: "POST",
    body: { username: "admin", password: "' OR 1=1 --" },
    expect: "block",
  },
  {
    name: "Normal login",
    url: `${BASE}/login`,
    method: "POST",
    body: { username: "Alice", password: "alice@example.com" },
    expect: "pass",
  },
];

async function run() {
  console.log("=== Aikido Firewall Attack Tests ===\n");

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const opts = { method: t.method || "GET" };
    if (t.body) {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(t.body);
    }

    try {
      const res = await fetch(t.url, opts);
      const status = res.status;
      const blocked = status === 403 || status === 500;
      const result = t.expect === "block" ? (blocked ? "BLOCKED" : "NOT BLOCKED") : (status === 200 ? "PASSED" : `HTTP ${status}`);
      const ok = (t.expect === "block" && blocked) || (t.expect === "pass" && status === 200);

      console.log(`${ok ? "✓" : "✗"} ${t.name}: ${result} (HTTP ${status})`);
      if (ok) passed++;
      else failed++;
    } catch (err) {
      console.log(`✗ ${t.name}: ERROR — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed out of ${tests.length} tests.`);
  if (failed === 0) console.log("All attack vectors handled correctly.");
}

run();
