export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Sign-in error</h1>
      <p className="text-sm text-muted-foreground">
        Something went wrong while signing you in{error ? ` (${error})` : ""}. Please try again.
      </p>
    </div>
  );
}
