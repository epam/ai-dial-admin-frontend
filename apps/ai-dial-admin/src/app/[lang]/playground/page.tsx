import PlaygroundView from '@/src/components/Playground/View/View';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <PlaygroundView chatDomain={process.env.DIAL_OVERLAY_LINK} />;
}
