'use client'

import { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ErrorMessage } from '@/components/ui/error-message'

interface CSVUploaderProps {
  propertyId: string
}

export function CSVUploader({ propertyId }: CSVUploaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
      setSuccess(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/properties/${propertyId}/enrollments/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Upload failed'
        const details = data.details ? `\nDetails: ${data.details}` : ''
        const code = data.code ? `\nError code: ${data.code}` : ''
        throw new Error(`${errorMsg}${details}${code}`)
      }

      setSuccess(`Successfully uploaded ${data.count} enrollments`)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Invalidate React Query cache for enrollments to force refetch
      queryClient.invalidateQueries({ queryKey: ['enrollments', propertyId] })
      
      // Refresh the page to show updated stats
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border-l-4 border-success rounded-r-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{success}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="block w-full text-sm text-beagle-dark file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-i3-bg file:text-i3-navy hover:file:bg-i3-bg-light file:transition-all file:duration-200 file:cursor-pointer"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex items-center gap-2 px-6 py-2.5 bg-i3-navy text-white rounded-lg font-semibold text-sm hover:bg-i3-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>

      <div className="text-sm text-gray-600 bg-i3-bg p-4 rounded-lg border border-i3-border">
        <p className="font-semibold text-beagle-dark mb-2">CSV Format Requirements:</p>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-beagle-dark mb-1">New Format (Charges CSV):</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Required columns:</strong> Tenant Name, Coverage Name, Current Charge Amount, Post Date</li>
              <li><strong>Optional columns:</strong> Unit Number (or Unit, Unit #)</li>
              <li>Duplicates are automatically filtered (same Tenant Name + Coverage Name combination)</li>
              <li>Tenant Name will be parsed into First Name and Last Name</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-beagle-dark mb-1">Legacy Format (Full Enrollment CSV):</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Required columns:</strong> Status, Coverage Holder Name, First Name, Last Name, Coverage Name</li>
              <li><strong>Optional columns:</strong> Enrollment #, Email, Phone, Address1, Address2, City, State, ZIP, Unit Number (or Unit, Unit #), Coverage Rate, Effective Date, Expiration Date, Paid To Date, Premium Amount, Cost Amount, Producer Name, Reference ID, Note, Payment Source, Creation Source</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-2">First row must contain column headers</p>
        </div>
      </div>
    </div>
  )
}

