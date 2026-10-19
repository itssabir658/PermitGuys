/**
 * Stand-in CRM webhook for browser tests. Stores received leads by name and
 * fails any lead whose name contains "Fail", to exercise the error path.
 */
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 4010);
const leads = new Map();

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname === "/health") return res.end("ok");
  if (req.method === "GET" && url.pathname === "/leads") {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(leads.get(url.searchParams.get("name")) ?? null));
  }
  if (req.method === "POST" && url.pathname === "/hook") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const lead = JSON.parse(body);
      if (lead.contact.name.includes("Fail")) {
        res.statusCode = 500;
        return res.end("failure requested");
      }
      leads.set(lead.contact.name, lead);
      res.statusCode = 204;
      res.end();
    });
    return;
  }
  res.statusCode = 404;
  res.end();
}).listen(port);
