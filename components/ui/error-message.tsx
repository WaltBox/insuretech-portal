import { Phone } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  className?: string
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`rounded-lg bg-red-50 border-l-4 border-error p-3 sm:p-4 ${className}`}>
      <p className="text-xs sm:text-sm font-medium text-red-800 mb-2">{message}</p>
      <div className="mt-3 pt-3 border-t border-red-200">
        <p className="text-xs text-red-700 flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Need help? Reach out to your account manager{' '}
            <a 
              href="tel:8063161686" 
              className="font-semibold hover:underline"
            >
              Walt (806-316-1686)
            </a>
          </span>
        </p>
      </div>
    </div>
  )
}

