import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AppIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/home');
  }, [router]);
  return null;
}