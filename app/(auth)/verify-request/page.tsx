export default function VerifyRequestPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="text-sm text-muted-foreground">
        A sign-in link has been sent. It may take a minute to arrive — click the link to finish signing in.
      </p>
    </div>
  );
}
