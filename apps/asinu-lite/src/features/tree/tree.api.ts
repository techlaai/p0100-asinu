import { apiClient } from '../../lib/apiClient';
import { TreeSummary, TreeHistoryPoint } from './tree.store';

export const treeApi = {
  fetchSummary() {
    return apiClient<TreeSummary>('/api/mobile/tree');
  },
  fetchHistory() {
    return apiClient<TreeHistoryPoint[]>('/api/mobile/tree/history');
  }
};
