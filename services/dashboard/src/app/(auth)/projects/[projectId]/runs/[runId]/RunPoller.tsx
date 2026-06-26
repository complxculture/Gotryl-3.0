'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RunPoller({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (status !== 'queued' && status !== 'running') return;
    const id = setInterval(() => router.refresh(), 1500);
    return () => clearInterval(id);
  }, [status, router]);

  return null;
}
