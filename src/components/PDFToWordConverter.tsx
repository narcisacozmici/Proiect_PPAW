import { useRef, useState } from 'react'

// Backend proxy pentru ConvertAPI (evită problemele CORS)
// Backend-ul va face request-ul la ConvertAPI

type ConversionStatus = 'idle' | 'uploading' | 'converting' | 'completed' | 'error'

interface SavedConversion {
  id: number
  originalFilename: string
  convertedFilename: string
  createdAt: string
  fileSize: number
}

interface FileConversion {
  file: File
  id: string
  status: ConversionStatus
  progress: number
  error?: string
  downloadUrl?: string
  conversionId?: number
}

interface PDFToWordConverterProps {
  userId?: string | null
}

function PDFToWordConverter({ userId }: PDFToWordConverterProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileConversion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savedConversions, setSavedConversions] = useState<SavedConversion[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const pdfFiles: File[] = []
      const invalidFiles: string[] = []

      Array.from(files).forEach((file) => {
        if (file.type === 'application/pdf') {
          pdfFiles.push(file)
        } else {
          invalidFiles.push(file.name)
        }
      })

      if (invalidFiles.length > 0) {
        setError(`Următoarele fișiere nu sunt PDF: ${invalidFiles.join(', ')}`)
      } else {
        setError(null)
      }

      if (pdfFiles.length > 0) {
        const newFiles: FileConversion[] = pdfFiles.map((file) => ({
          file,
          id: `${Date.now()}-${Math.random()}`,
          status: 'idle' as ConversionStatus,
          progress: 0,
        }))
        setSelectedFiles((prev) => [...prev, ...newFiles])
      }
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      const pdfFiles: File[] = []
      const invalidFiles: string[] = []

      Array.from(files).forEach((file) => {
        if (file.type === 'application/pdf') {
          pdfFiles.push(file)
        } else {
          invalidFiles.push(file.name)
        }
      })

      if (invalidFiles.length > 0) {
        setError(`Următoarele fișiere nu sunt PDF: ${invalidFiles.join(', ')}`)
      } else {
        setError(null)
      }

      if (pdfFiles.length > 0) {
        const newFiles: FileConversion[] = pdfFiles.map((file) => ({
          file,
          id: `${Date.now()}-${Math.random()}`,
          status: 'idle' as ConversionStatus,
          progress: 0,
        }))
        setSelectedFiles((prev) => [...prev, ...newFiles])
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Salvează o conversie în localStorage
  const saveConversion = (conversion: SavedConversion) => {
    try {
      const existing = savedConversions.filter((c) => c.id !== conversion.id)
      const updated = [conversion, ...existing].slice(0, 50) // Păstrează ultimele 50 conversii
      setSavedConversions(updated)
      localStorage.setItem('pdfToWordConversions', JSON.stringify(updated))
    } catch (error) {
      console.error('Eroare la salvarea conversiei:', error)
    }
  }

  const convertPDFToWord = async (fileConversion: FileConversion) => {
    const updateFileStatus = (updates: Partial<FileConversion>) => {
      setSelectedFiles((prev) =>
        prev.map((fc) => (fc.id === fileConversion.id ? { ...fc, ...updates } : fc))
      )
    }

    updateFileStatus({ status: 'uploading', progress: 10 })

    try {
      // Pregătim form data pentru ConvertAPI
      const formData = new FormData()
      formData.append('File', fileConversion.file)

      updateFileStatus({ status: 'converting', progress: 20 })

      // Folosim backend proxy pentru a evita problemele CORS
      const headers: HeadersInit = {}

      // Trimite user_id ca header dacă există
      if (userId) {
        headers['X-User-Id'] = userId
      }

      const response = await fetch('/api/conversions/pdf-to-word', {
        method: 'POST',
        headers,
        body: formData,
      })

      updateFileStatus({ progress: 60 })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Eroare la conversie' }))
        throw new Error(errorData.message || `Eroare HTTP: ${response.status}`)
      }

      updateFileStatus({ progress: 80 })

      // Obținem ID-ul conversiei din header (dacă există)
      const conversionIdHeader = response.headers.get('X-Conversion-Id')
      if (conversionIdHeader) {
        const id = parseInt(conversionIdHeader)

        // Salvează conversia în localStorage
        saveConversion({
          id,
          originalFilename: fileConversion.file.name,
          convertedFilename: fileConversion.file.name.replace('.pdf', '.docx'),
          createdAt: new Date().toISOString(),
          fileSize: fileConversion.file.size,
        })

        updateFileStatus({ conversionId: id })
      }

      // Obținem fișierul Word convertit
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      updateFileStatus({ downloadUrl: url, progress: 100, status: 'completed' })
    } catch (err: any) {
      console.error('Eroare la conversie:', err)
      updateFileStatus({
        status: 'error',
        error: err.message || 'A apărut o eroare la conversie. Te rugăm să încerci din nou.',
      })
    }
  }

  const convertAllFiles = async () => {
    const filesToConvert = selectedFiles.filter((fc) => fc.status === 'idle')
    if (filesToConvert.length === 0) return

    // Procesăm fișierele în paralel pentru a accelera conversia
    // Fiecare fișier va avea propriul progres individual
    await Promise.all(filesToConvert.map((fileConversion) => convertPDFToWord(fileConversion)))
  }

  const handleDownload = (fileConversion: FileConversion) => {
    if (fileConversion.downloadUrl) {
      const link = document.createElement('a')
      link.href = fileConversion.downloadUrl
      link.download = fileConversion.file.name.replace('.pdf', '.docx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((fc) => fc.id !== id))
  }

  const handleReset = () => {
    setSelectedFiles([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Convertește PDF în Word
        </h2>

        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                Trage fișierele PDF aici sau click pentru a selecta
              </p>
              <p className="text-sm text-gray-500">
                Poți selecta mai multe fișiere PDF simultan (până la 10MB fiecare)
              </p>
            </div>
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Selectează fișiere
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Fișiere selectate ({selectedFiles.length})
              </h3>
              <button
                onClick={handleReset}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Șterge toate
              </button>
            </div>
            {selectedFiles.map((fileConversion) => (
              <div
                key={fileConversion.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileConversion.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileConversion.file.size)}
                      </p>
                    </div>
                  </div>
                  {fileConversion.status === 'idle' && (
                    <button
                      onClick={() => handleRemoveFile(fileConversion.id)}
                      className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Elimină fișierul"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {(fileConversion.status === 'uploading' ||
                  fileConversion.status === 'converting') && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">
                        {fileConversion.status === 'uploading'
                          ? 'Se încarcă...'
                          : 'Se convertește...'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {fileConversion.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileConversion.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {fileConversion.status === 'error' && fileConversion.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{fileConversion.error}</p>
                  </div>
                )}

                {/* Success Message */}
                {fileConversion.status === 'completed' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-xs font-medium text-green-900">
                          Conversie finalizată!
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(fileConversion)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Descarcă
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Convert All Button */}
        {selectedFiles.length > 0 &&
          selectedFiles.some((fc) => fc.status === 'idle') && (
            <div className="mt-6">
              <button
                onClick={convertAllFiles}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                Convertește toate fișierele ({selectedFiles.filter((fc) => fc.status === 'idle').length})
              </button>
            </div>
          )}
      </div>
    </div>
  )
}

export default PDFToWordConverter
