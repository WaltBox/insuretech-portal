import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-normal text-beagle-dark">Profile</h1>
          <p className="text-sm text-gray-600 mt-2">Manage your account settings</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-beagle-orange/10 flex items-center justify-center text-2xl font-semibold text-beagle-orange">
                {user.first_name[0]}{user.last_name[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-beagle-dark">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-sm text-gray-600 capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-beagle-dark mb-4">Account Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={user.first_name}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={user.last_name}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user.role.replace('_', ' ')}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 cursor-not-allowed capitalize"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Member Since
                  </label>
                  <input
                    type="text"
                    value={new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500">
                To update your profile information, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


