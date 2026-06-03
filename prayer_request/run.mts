import 'dotenv/config';
import { startAgentInstance } from '@blocks-network/sdk';
import type { AgentCard } from '@blocks-network/sdk';
import cardJson from './agent-card.json' with { type: 'json' };
import handler from './handler.ts';

const card = cardJson as unknown as AgentCard;

await startAgentInstance({
  agentName: card.identity.agentName,
  description: card.identity.description,
  card,
  handler,
  concurrency: card.runtime.concurrency,
  expectedInstances: card.runtime.expectedInstances,
  maxRunningTimeSec: card.runtime.maxRunningTimeSec,
  cdmUrl: process.env.BLOCKS_CDM_URL,
  baseUrl: process.env.BLOCKS_API_BASE_URL,
});
