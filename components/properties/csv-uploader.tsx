'use client'

import { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CSVUploaderProps {
  propertyId: string
}

export function CSVUploader({ propertyId }: CSVUploaderProps) {
  const router = useRouter()
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
        throw new Error(data.error || 'Upload failed')
      }

      setSuccess(`Successfully uploaded ${data.count} enrollments`)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
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
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border-l-4 border-error rounded-r-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

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
          className="block w-full text-sm text-beagle-dark file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-light file:text-beagle-orange hover:file:bg-orange-50 file:transition-all file:duration-200 file:cursor-pointer"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex items-center gap-2 px-6 py-2.5 bg-beagle-orange text-white rounded-lg font-semibold text-sm hover:bg-accent-orange active:bg-[#e66d00] disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>

      <div className="text-sm text-gray-600 bg-orange-lighter p-4 rounded-lg border border-orange-light">
        <p className="font-semibold text-beagle-dark mb-2">CSV Format Requirements:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Required columns:</strong> Enrollment #, Status, Coverage Holder Name, First Name, Last Name, Coverage Name</li>
          <li><strong>Optional columns:</strong> Email, Phone, Address1, Address2, City, State, ZIP, Coverage Rate, Effective Date, Expiration Date, Paid To Date, Premium Amount, Cost Amount, Producer Name, Reference ID, Note, Payment Source, Creation Source</li>
          <li>First row must contain column headers</li>
        </ul>
      </div>
    </div>
  )
}

