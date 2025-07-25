'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Message } from '@/types';

export default function CustomerPage() {
  const params = useParams() as { phone?: string };
  const phone = typeof params.phone === 'string' ? params.phone : null;
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!phone) return;
    fetch(`/api/messages/${phone}`)
      .then((res) => res.json())
      .then(setMessages)
      .catch(console.error);
  }, [phone]);

  const getSenderLabel = (type: string) => {
    switch (type) {
      case 'agent':
        return '🤖 AI Agent';
      case 'operator':
        return '🧑‍💻 Operator';
      case 'customer':
        return '🙋 Customer';
      default:
        return '❓ Unknown';
    }
  };

  const getBubbleStyle = (type: string) => {
    switch (type) {
      case 'agent':
        return 'bg-indigo-50 border-indigo-200';
      case 'operator':
        return 'bg-blue-50 border-blue-300';
      case 'customer':
        return 'bg-green-50 border-green-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  if (!phone) {
    return <div className="p-6">Invalid phone number</div>;
  }

  return (
    <main className="p-6 space-y-4">
      <Link
        href="/dashboard"
        className="text-sm text-blue-600 hover:underline inline-block mb-4"
      >
        ← Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-4">📞 History for {phone}</h1>

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`border p-4 rounded shadow transition-all ${getBubbleStyle(
            msg.senderType
          )}`}
        >
          <div className="text-xs text-muted-foreground">
            {new Date(msg.timestamp).toLocaleString()}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
            {getSenderLabel(msg.senderType)}
          </div>
          <div className="text-sm whitespace-pre-line">{msg.content}</div>
        </div>
      ))}
    </main>
  );
}
