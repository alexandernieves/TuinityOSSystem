'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified auth page in login/page.tsx with register mode
    router.replace('/login?mode=register');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7F6]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1A2B3C] border-t-transparent"></div>
    </div>
  );
}
