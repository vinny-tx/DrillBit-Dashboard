import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const conversationsPath = path.join(__dirname, '../data/conversations');

async function loadMessages() {
  const channels = fs.readdirSync(conversationsPath);
  const messages: any[] = [];

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
        const phone = path.basename(file, '.jsonl');

        const rl = readline.createInterface({
          input: fs.createReadStream(filePath),
          crlfDelay: Infinity,
        });

        for await (const line of rl) {
          try {
            const cleanLine = line.replace(/,(?=\s*?[\}\]])/, '');
            const parsed = JSON.parse(cleanLine);

            const rawTimestamp = parsed.timestamp;
            const cleanTimestamp = typeof rawTimestamp === 'string'
              ? rawTimestamp.trim().replace(/,$/, '')
              : rawTimestamp;

            const timestamp = new Date(cleanTimestamp);
            if (isNaN(timestamp.getTime())) {
              console.warn(`⚠️ Skipping invalid timestamp in ${file}: ${rawTimestamp}`);
              continue;
            }

            messages.push({
              timestamp,
              phone: phone,
              senderType: parsed.sender_type,
              operatorId: parsed.operator_id,
              content: parsed.content,
              actions: parsed.actions,
              status: parsed.status,
              reason: parsed.reason,
              jobType: parsed.job_type,
              urgency: parsed.urgency,
              channel,
            });
          } catch (e) {
            console.warn(`❌ Error in file ${filePath}: ${e instanceof Error ? e.message : e}`);
          }
        }
      }
    }
  }

  console.log(`📥 Inserting ${messages.length} messages...`);

  const BATCH_SIZE = 500;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    try {
      await prisma.message.createMany({
        data: batch,
        skipDuplicates: false, // You can set to true if schema has unique constraint
      });
      console.log(`✅ Inserted batch ${i / BATCH_SIZE + 1}`);
    } catch (err) {
      console.warn(`❌ Failed batch ${i / BATCH_SIZE + 1}:`, err);
    }
  }

  console.log('✅ Seeding complete.');
}

loadMessages()
  .catch((err) => {
    console.error('❌ Seed script failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
