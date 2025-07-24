import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { phone },
  } = req;

  if (typeof phone !== 'string') {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const messages = await prisma.message.findMany({
    where: { phone },
    orderBy: { timestamp: 'asc' },
  });

  res.status(200).json(messages);
}
