'use client';
import { useEffect } from 'react';

// Starts the office once the page's markup is on screen. The office (src/office) is plain JavaScript that binds to
// the markup by id and runs for the life of the page, so it starts once and is never torn down.
export default function OfficeBoot() {
  useEffect(() => {
    import('@/office/main').then((m) => m.startOffice());
  }, []);
  return null;
}
