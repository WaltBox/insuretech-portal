interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'orange' | 'white' | 'gray' | 'dark'
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'orange',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const colorClasses = {
    orange: 'text-beagle-orange',
    white: 'text-white',
    gray: 'text-gray-400',
    dark: 'text-beagle-dark'
  }

  return (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[200px]">
        <LoadingSpinner size="lg" color="orange" />
        <p className="text-sm font-medium text-beagle-dark">{message}</p>
      </div>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="lg" color="orange" />
      <p className="text-sm text-gray-600 mt-4">{message}</p>
    </div>
  )
}




