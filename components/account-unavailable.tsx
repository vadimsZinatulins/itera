export default function AccountUnavailable({ retry }: { retry: '/' | '/login' }) {
  return <main className="mx-auto w-full max-w-md px-5 py-12">
    <h1 className="text-2xl font-semibold">Account service unavailable</h1>
    <p role="alert" className="mt-4 text-sm leading-6">We cannot check your account right now. Your local work has not been cleared. Please try again.</p>
    <a className="mt-4 inline-flex min-h-11 items-center underline" href={retry}>Try again</a>
  </main>;
}
