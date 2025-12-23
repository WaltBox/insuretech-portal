import { redirect } from 'next/navigation'
import { getCurrentUser, isImpersonating } from '@/lib/auth'
import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client'
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
        <DashboardLayoutClient user={user}>
          {children}
        </DashboardLayoutClient>
      </div>
    </ReactQueryProvider>
  )
}

