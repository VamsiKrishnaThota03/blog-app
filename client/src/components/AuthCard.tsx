interface AuthCardProps {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-9rem)] justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800 sm:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/60 bg-white px-6 py-8 shadow-xl dark:border-gray-700/60 dark:bg-gray-800 sm:px-10">
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export const authInputClass =
  'block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900/40 dark:text-white dark:placeholder:text-gray-500 sm:text-sm';

export const authLabelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

export const authButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-offset-gray-800';
