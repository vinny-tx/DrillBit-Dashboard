export type Message = {
  id: number;
  timestamp: string;
  phone: string;
  senderType: string;
  operatorId?: string;
  content: string;
  actions: any;
  status?: string;
  reason?: string;
  jobType?: string;
  urgency?: number;
  channel: string;
};

export type SortOption =
  | 'urgency-desc-newest'
  | 'urgency-desc-oldest'
  | 'oldest'
  | 'newest';