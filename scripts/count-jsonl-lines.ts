import fs from 'fs';
import path from 'path';
import readline from 'readline';

const conversationsPath = path.join(__dirname, '../data/conversations');

async function countLinesInFile(filePath: string): Promise<number> {
  let count = 0;
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const _ of rl) {
    count++;
  }

  return count;
}

async function main() {
  let total = 0;

  const channels = fs.readdirSync(conversationsPath);
  for (const channel of channels) {
    const channelPath = path.join(conversationsPath, channel);
    if (!fs.statSync(channelPath).isDirectory()) continue;

    const dates = fs.readdirSync(channelPath);
    for (const date of dates) {
      const datePath = path.join(channelPath, date);
      if (!fs.statSync(datePath).isDirectory()) continue;

      const files = fs.readdirSync(datePath).filter(f => f.endsWith('.jsonl'));
      for (const file of files) {
        const filePath = path.join(datePath, file);
        const count = await countLinesInFile(filePath);
        total += count;
      }
    }
  }

  console.log(`📦 Total .jsonl lines (messages): ${total}`);
}

main().catch(console.error);
