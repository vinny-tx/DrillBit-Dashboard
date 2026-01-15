// import { prisma } from '~/lib/prisma';
// import type { NextApiRequest, NextApiResponse } from 'next';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const { page = '1', limit = '20000', sort = 'desc' } = req.query;

//   const take = parseInt(limit as string, 10);
//   const skip = (parseInt(page as string, 10) - 1) * take;
//   const order = sort === 'asc' ? 'asc' : 'desc';

//   const [messages, total] = await Promise.all([
//     prisma.message.findMany({
//       where: { status: 'blocked_needs_human' },
//       orderBy: { timestamp: order },
//       skip,
//       take,
//     }),
//     prisma.message.count({ where: { status: 'blocked_needs_human' } }),
//   ]);

//   res.json({ messages, total });
// }

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type RawMessageLine = {
  timestamp: string;
  phone: string | number;
  sender_type?: string | null;
  content?: string | null;
  actions?: unknown[];
  status?: string | null;
  reason?: string | null;
  job_type?: string | null;
  urgency?: number | null;
  operator_id?: string | null;
};

type ApiMessage = {
  id: string;
  timestamp: string;
  phone: string; // dashboard links with /customer/${msg.phone}
  senderType?: string | null;
  content: string;
  actions?: unknown[];
  status?: string | null;
  reason?: string | null;
  jobType?: string | null;
  urgency?: number | null;
  operatorId?: string | null;
  channel?: "calls" | "texts";
  sourceFile?: string;
};

type MessagesResponse = {
  messages: ApiMessage[];
  total: number;
};

const DATA_ROOT = path.join(process.cwd(), "data", "conversations");

let cache: { loadedAt: number; messages: ApiMessage[] } | null = null;
const CACHE_TTL_MS = 15_000; // 15s is plenty for local/dev;

async function listJsonlFiles(rootDir: string): Promise<string[]> {
  const out: string[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile() && e.name.endsWith(".jsonl")) {
        out.push(full);
      }
    }
  }

  await walk(rootDir);
  return out;
}

function normalizeTimestamp(raw: unknown): string | null {
  const clean =
    typeof raw === "string" ? raw.trim().replace(/,$/, "") : raw;

  if (typeof clean !== "string") return null;

  const t = new Date(clean).getTime();
  if (!Number.isFinite(t)) return null;

  return clean; // keep as ISO string for API payload
}

function safeParseJsonLine(line: string): any | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Handle weird lines like: "{"timestamp":...}"
  const unwrapped =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1).replace(/\\"/g, '"')
      : trimmed;

  // remove trailing commas before } or ]
  const cleanLine = unwrapped.replace(/,(?=\s*[\}\]])/g, "");

  try {
    return JSON.parse(cleanLine);
  } catch {
    return null;
  }
}

function toApiMessage(
  raw: RawMessageLine,
  opts: { channel: "calls" | "texts"; sourceFile: string; lineIndex: number }
): ApiMessage | null {
  if (!raw.timestamp || raw.phone == null) return null;

  const phone = String(raw.phone);
  const timestamp = raw.timestamp;

  const id = `${phone}-${timestamp}-${opts.channel}-${opts.lineIndex}`;

  return {
    id,
    timestamp,
    phone,
    senderType: raw.sender_type ?? null,
    content: raw.content ?? "",
    actions: raw.actions ?? [],
    status: raw.status ?? null,
    reason: raw.reason ?? null,
    jobType: raw.job_type ?? null,
    urgency: raw.urgency ?? null,
    operatorId: raw.operator_id ?? null,
    channel: opts.channel,
    sourceFile: opts.sourceFile,
  };
}

async function loadNeedsAttentionMessages(): Promise<ApiMessage[]> {
  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) {
    return cache.messages;
  }

  const callsDir = path.join(DATA_ROOT, "calls");
  const textsDir = path.join(DATA_ROOT, "texts");

  const [callFiles, textFiles] = await Promise.all([
    listJsonlFiles(callsDir).catch(() => []),
    listJsonlFiles(textsDir).catch(() => []),
  ]);

  const allFiles: Array<{ file: string; channel: "calls" | "texts" }> = [
    ...callFiles.map((f) => ({ file: f, channel: "calls" as const })),
    ...textFiles.map((f) => ({ file: f, channel: "texts" as const })),
  ];

  const collected: ApiMessage[] = [];

  // Read files in parallel (fine for these dataset sizes)
  await Promise.all(
    allFiles.map(async ({ file, channel }) => {
      const content = await fs.readFile(file, "utf8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const parsed = safeParseJsonLine(lines[i]);
        if (!parsed) continue;
        
        if (parsed.status !== "blocked_needs_human") continue;

          const normalizedTs = normalizeTimestamp(parsed.timestamp);
          if (!normalizedTs) {
            // console.warn(`Skipping invalid timestamp in ${file}:`, parsed.timestamp);
            continue;
          }

          const msg = toApiMessage(
            { ...parsed, timestamp: normalizedTs },
            { channel, sourceFile: file, lineIndex: i }
          );
          if (msg) collected.push(msg);
      }
    })
  );

  // update cache
  cache = { loadedAt: now, messages: collected };
  return collected;
}

function parseIntParam(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MessagesResponse>) {
  try {
    const page = parseIntParam(req.query.page, 1);
    const limit = parseIntParam(req.query.limit, 20000);
    const sort = String(req.query.sort ?? "desc");
    const order: "asc" | "desc" = sort === "asc" ? "asc" : "desc";

    const all = await loadNeedsAttentionMessages();

    // Sort by timestamp
    all.sort((a, b) => {
      const at = new Date(a.timestamp).getTime();
      const bt = new Date(b.timestamp).getTime();
      return order === "asc" ? at - bt : bt - at;
    });

    const total = all.length;
    const start = (page - 1) * limit;
    const messages = all.slice(start, start + limit);

    res.status(200).json({ messages, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ messages: [], total: 0 });
  }
}
