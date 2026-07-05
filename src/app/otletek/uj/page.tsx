import { requireUser } from '@/lib/auth';
import { isModerator } from '@/lib/permissions';
import { submitIdea } from '@/lib/actions/ideas';
import { IdeaFormFields } from '@/components/IdeaFormFields';
import { Flash } from '@/components/Flash';

export const metadata = { title: 'Új randiötlet' };

export default async function NewIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ hiba?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const mod = isModerator(user.role);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Új randiötlet beküldése</h1>
      <p className="mb-6 text-sm text-stone-600">
        {mod
          ? 'Moderátorként az ötleted azonnal megjelenik a gyűjteményben.'
          : 'A javaslatodat a moderátorcsapat átnézi; elfogadás után jelenik meg a gyűjteményben. A döntésről értesítést kapsz.'}
      </p>
      <Flash hiba={sp.hiba} />
      <form action={submitIdea} className="card space-y-4 p-6">
        <IdeaFormFields />
        <button className="btn-primary w-full">
          {mod ? 'Ötlet publikálása' : 'Javaslat beküldése moderációra'}
        </button>
      </form>
    </div>
  );
}
