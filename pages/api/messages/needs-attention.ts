import { prisma } from '~/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page = '1', limit = '20000', sort = 'desc' } = req.query;

  const take = parseInt(limit as string, 10);
  const skip = (parseInt(page as string, 10) - 1) * take;
  const order = sort === 'asc' ? 'asc' : 'desc';

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { status: 'blocked_needs_human' },
      orderBy: { timestamp: order },
      skip,
      take,
    }),
    prisma.message.count({ where: { status: 'blocked_needs_human' } }),
  ]);

  res.json({ messages, total });
}
