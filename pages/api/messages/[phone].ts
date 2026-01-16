// import type { NextApiRequest, NextApiResponse } from 'next';
// import { prisma } from '~/lib/prisma';

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const {
//     query: { phone },
//   } = req;

//   if (typeof phone !== 'string') {
//     return res.status(400).json({ error: 'Invalid phone number' });
//   }

//   const messages = await prisma.message.findMany({
//     where: { phone },
//     orderBy: { timestamp: 'asc' },
//   });

//   res.status(200).json(messages);
// }

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type RawMessageLine = {
  timestamp?: string;
  phone?: string | number;
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
  phone: string;
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

const DATA_ROOT = path.join(process.cwd(), "data", "conversations");

async function listJsonlFiles(rootDir: string): Promise<string[]> {
  const out: string[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && e.name.endsWith(".jsonl")) out.push(full);
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

function safeParseJsonLine(line: string): RawMessageLine | null {
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

// function isValidIsoDate(value: string | undefined): value is string {
//   if (!value) return false;
//   const t = new Date(value).getTime();
//   return Number.isFinite(t);
// }

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiMessage[]>) {
  try {
    const phoneParam = req.query.phone;
    const phone =
      typeof phoneParam === "string"
        ? phoneParam
        : Array.isArray(phoneParam)
        ? phoneParam[0]
        : "";

    if (!phone) {
      return res.status(400).json([]);
    }

    const callsDir = path.join(DATA_ROOT, "calls");
    const textsDir = path.join(DATA_ROOT, "texts");

    const [callFiles, textFiles] = await Promise.all([
      listJsonlFiles(callsDir).catch(() => []),
      listJsonlFiles(textsDir).catch(() => []),
    ]);

    const files: Array<{ file: string; channel: "calls" | "texts" }> = [
      ...callFiles.map((f) => ({ file: f, channel: "calls" as const })),
      ...textFiles.map((f) => ({ file: f, channel: "texts" as const })),
    ];

    const results: ApiMessage[] = [];

    await Promise.all(
      files.map(async ({ file, channel }) => {
        const base = path.basename(file, ".jsonl");
        if (base !== phone) return;

        const content = await fs.readFile(file, "utf8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const raw = safeParseJsonLine(lines[i]);
          if (!raw) continue;

          const rawPhone = raw.phone != null ? String(raw.phone) : "";
          if (rawPhone !== phone) continue;

          const ts = normalizeTimestamp(raw.timestamp);
          if (!ts) continue;

          //if (!isValidIsoDate(raw.timestamp)) continue;

          const id = `${phone}-${ts}-${channel}-${i}`;

          results.push({
            id,
            timestamp: ts,
            phone,
            senderType: raw.sender_type ?? null,
            content: raw.content ?? "",
            actions: raw.actions ?? [],
            status: raw.status ?? null,
            reason: raw.reason ?? null,
            jobType: raw.job_type ?? null,
            urgency: raw.urgency ?? null,
            operatorId: raw.operator_id ?? null,
            channel,
            sourceFile: file,
          });
        }
      })
    );

    // chronological history (oldest -> newest is usually best for a convo view)
    results.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json([]);
  }
}
