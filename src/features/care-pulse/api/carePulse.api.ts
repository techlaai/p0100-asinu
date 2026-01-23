import { apiClient } from '../../../lib/apiClient';
import { PulseStatus, TriggerSource } from '../types';

type SubmitPulseInput = {
  status: PulseStatus;
  subStatus?: string;
  triggerSource: TriggerSource;
  escalationSent: boolean;
  silenceCount: number;
};

export const submitPulse = async (input: SubmitPulseInput) => {
  const payload = {
    log_type: 'care_pulse',
    occurred_at: new Date().toISOString(),
    source: 'manual',
    metadata: { v: 1 },
    data: {
      status: input.status,
      sub_status: input.subStatus ?? null,
      trigger_source: input.triggerSource,
      escalation_sent: input.escalationSent,
      silence_count: input.silenceCount
    }
  };

  return apiClient<unknown>('/api/mobile/logs', {
    method: 'POST',
    body: payload
  });
};
