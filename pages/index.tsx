import dynamic from 'next/dynamic';

// Import the WaitlistForm component from the existing source location
const WaitlistForm = dynamic(() => import('../src/components/waitlist'), { ssr: false });

export default function Home() {
  return <WaitlistForm />;
}
