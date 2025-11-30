'use client';

import { useErrorNotification } from '@/hooks/useErrorNotification';

export function ErrorNotificationProvider({ children }: { children: React.ReactNode }) {
  useErrorNotification();
  return <>{children}</>;
}