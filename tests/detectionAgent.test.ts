/// <reference types="@types/jest" />
import { handleDetection } from '../src/agents/detectionAgent';

describe('detectionAgent', () => {
  it('detects unanswered question', async () => {
    const signals = await handleDetection({
      source: 'slack',
      type: 'message',
      payload: { user: 'alice', text: 'How do I deploy?' }
    } as any);
    expect(signals.find(s => s.type === 'unanswered_question')).toBeTruthy();
  });

  it('detects blocked task', async () => {
    const signals = await handleDetection({
      source: 'notion',
      type: 'status_updated',
      payload: { taskId: '123', status: 'Blocked' }
    } as any);
    expect(signals.find(s => s.type === 'blocked_task')).toBeTruthy();
  });
});
