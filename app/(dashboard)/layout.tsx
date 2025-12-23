import { redirect } from 'next/navigation'
import { getCurrentUser, isImpersonating } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { ReactQueryProvider } from '@/lib/providers/react-query-provider'
import { ImpersonationBanner } from '@/components/admin/impersonation-banner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const impersonating = await isImpersonating()

  return (
    <ReactQueryProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        {impersonating && (
          <ImpersonationBanner impersonatedUser={user} />
        )}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar user={user} />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </ReactQueryProvider>
  )
}

