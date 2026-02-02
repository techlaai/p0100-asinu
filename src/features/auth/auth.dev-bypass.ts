import { Profile } from './auth.store';

export const buildBypassProfile = (): Profile => ({
  id: 'dev-user',
  name: 'Người dùng thử',
  email: 'dev@example.com',
  phone: '0912345678',
  relationship: 'Con gái chăm sóc bố',
  avatarUrl: undefined
});
