'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';
//import { Card, CardContent } from '@/components/ui/card';
//import { Badge } from '@/components/ui/badge';
import { BarChart, Card as TremorCard, Title } from '@tremor/react';
import { Message, SortOption } from '@/types';
import Link from 'next/link';

const PAGE_SIZE = 10;

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('urgency-desc-newest');


  type MessagesResponse = {
    messages: Message[];
    total: number;
  };

  useEffect(() => {
    fetch('/api/messages/needs-attention')
      .then((res) => res.json())
      .then((data: MessagesResponse) => {
        setMessages(data.messages); 
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError('Failed to load messages');
        setLoading(false); 
      });
  }, []);


  if (loading) return <main className="p-6">Loading...</main>;
  if (error) return <main className="p-6 text-red-600">Error: {error}</main>;

  const sortedMessages = [...messages].sort((a, b) => {
  const aUrgency = a.urgency ?? 0;
  const bUrgency = b.urgency ?? 0;

  switch (sortOption) {
    case 'urgency-desc-newest':
      if (bUrgency !== aUrgency) return bUrgency - aUrgency;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

    case 'urgency-desc-oldest':
      if (bUrgency !== aUrgency) return bUrgency - aUrgency;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();

    case 'oldest':
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();

    case 'newest':
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

    default:
      return 0;
  }
});


  const paginatedMessages = sortedMessages.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const totalPages = Math.ceil(messages.length / PAGE_SIZE);

  function buildChartData<T extends string | number>(
    messages: Message[],
    getKey: (msg: Message) => T,
    sort?: (a: [T, number], b: [T, number]) => number
  ) {
    const grouped = messages.reduce<Record<string, number>>((acc, msg) => {
      const key = String(getKey(msg));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(grouped) as [T, number][];
    return (sort ? entries.sort(sort) : entries).map(([key, count]) => ({
      [typeof key === 'number' ? 'value' : 'label']: key,
      count,
    }));
  }

  const formattedUrgencyData = buildChartData(
    messages,
    (msg) => msg.urgency ?? 'Unknown',
    (a, b) => Number(a[0]) - Number(b[0])
  ).map(({ label, count }) => ({
    urgency: label,
    count,
  }));

  const senderChartData = buildChartData(
    messages,
    (msg) => msg.senderType ?? 'unknown'
  ).map(({ label, count }) => ({
    senderType: label,
    count,
  }));

  const timeChartData = buildChartData(messages, (msg) =>
    format(new Date(msg.timestamp), 'MM/dd/yy')
  ).map(({ label, count }) => ({ date: label, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const jobTypeChartData = buildChartData(
    messages,
    (msg) => msg.jobType ?? 'other',
    (a, b) => (a[0] === 'other' ? 1 : b[0] === 'other' ? -1 : b[1] - a[1])
  ).map(({ label, count }) => ({ jobType: label, count }));

  return (
    <>
      {/* Page Title */}
      <h1 className="text-3xl font-extrabold text-center text-foreground mb-8 tracking-tight">
        Operation Triage Dashboard
      </h1>

      {/* Needs Attention Queue */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-7 h-7 bg-red-100 rounded-full">
            <span className="text-lg leading-none">🚨</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Needs Attention Queue
          </h2>
        </div>

        <div className="space-y-4">
          {/* Sort */}
          <div className="flex justify-end">
            <label className="text-sm font-medium text-muted-foreground mr-2">Sort by:</label>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as SortOption);
                setCurrentPage(1);
              }}

              className="text-sm border border-input rounded-md px-2 py-1 bg-background"
            >
              <option value="urgency-desc-oldest">Urgency (High → Low) + Oldest</option>
              <option value="urgency-desc-newest">Urgency (High → Low) + Newest</option>
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
            </select>
          </div>


          {/* Top Pagination */}
          <div className="flex justify-center items-center gap-4 pb-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* Message Cards */}
          {paginatedMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-muted border border-border rounded-lg shadow-sm p-4 space-y-3"
            >
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{new Date(msg.timestamp).toLocaleString()}</span>
                {msg.urgency != null && (
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-md font-semibold">
                    Urgency: {msg.urgency}
                  </span>
                )}
              </div>

              <Link
                href={`/customer/${msg.phone}`}
                className="block text-sm font-medium text-blue-600 hover:underline"
              >
                📞 {msg.phone}
              </Link>

              <div className="text-sm text-foreground whitespace-pre-line">{msg.content}</div>

              {msg.reason && (
                <div className="text-sm text-yellow-700 font-medium">
                  ⚠️ <span className="font-semibold">Reason:</span> {msg.reason}
                </div>
              )}
            </div>
          ))}

          {/* Bottom Pagination */}
          <div className="flex justify-center items-center gap-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Spacer before Charts */}
      <div className="mt-12" />

      {/* Charts Section */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
  <TremorCard>
    <Title>Messages by Urgency (All Time)</Title>
    <div className="h-80"> 
      <BarChart
        data={formattedUrgencyData}
        index="urgency"
        categories={["count"]}
        colors={["rose"]}
        valueFormatter={(n) => `${n}`}
        yAxisWidth={40}
        showLegend={false}
      />
    </div>
  </TremorCard>

  <TremorCard>
    <Title>Messages by Sender Type (All Time)</Title>
    <div className="h-80">
      <BarChart
        data={senderChartData}
        index="senderType"
        categories={["count"]}
        colors={["blue"]}
        valueFormatter={(num) => `${num}`}
        yAxisWidth={40}
        showLegend={false}
      />
    </div>
  </TremorCard>

  <TremorCard>
    <Title>Messages by Job Type (All Time)</Title>
    <div className="h-80">
      <BarChart
        data={jobTypeChartData}
        index="jobType"
        categories={["count"]}
        colors={["teal"]}
        valueFormatter={(n) => `${n}`}
        yAxisWidth={40}
        showLegend={false}
      />
    </div>
  </TremorCard>

  <TremorCard>
    <Title>Messages per Day</Title>
    <div className="h-80">
      <BarChart
        data={timeChartData}
        index="date"
        categories={["count"]}
        colors={["indigo"]}
        valueFormatter={(n) => `${n}`}
        yAxisWidth={40}
        showLegend={false}
      />
    </div>
  </TremorCard>
</div>

    </>
  );
}