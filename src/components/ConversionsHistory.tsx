import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ConfirmDialog from './ConfirmDialog'

interface SavedConversion {
  id: number
  original_filename: string
  converted_filename: string
  created_at: string
  file_size: number
  // Câmpuri pentru compatibilitate cu codul vechi
  originalFilename?: string
  convertedFilename?: string
  createdAt?: string
  fileSize?: number
}

function ConversionsHistory() {
  const { user, isLoaded } = useUser()
  const [savedConversions, setSavedConversions] = useState<SavedConversion[]>([])
  const [isLoadingConversions, setIsLoadingConversions] = useState(true)
  const [conversionsError, setConversionsError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    conversionId: number | null
  }>({ isOpen: false, conversionId: null })

  // Încarcă conversiile din baza de date la mount
  useEffect(() => {
    if (isLoaded && user) {
      loadSavedConversions()
    } else if (isLoaded && !user) {
      setIsLoadingConversions(false)
      setConversionsError('Trebuie să fii autentificat pentru a vedea conversiile')
    }
  }, [isLoaded, user])

  const loadSavedConversions = async () => {
    if (!user?.id) {
      setIsLoadingConversions(false)
      return
    }

    setIsLoadingConversions(true)
    setConversionsError(null)

    try {
      const response = await fetch('/api/conversions', {
        headers: {
          'X-User-Id': user.id,
        },
      })

      if (!response.ok) {
        throw new Error('Eroare la încărcarea conversiilor')
      }

      const result = await response.json()

      if (result.success && result.data) {
        // Normalizăm datele pentru a fi compatibile cu codul existent
        const normalizedConversions = result.data.map((conv: any) => ({
          id: conv.id,
          original_filename: conv.original_filename,
          converted_filename: conv.converted_filename,
          created_at: conv.created_at,
          file_size: conv.file_size,
          // Câmpuri pentru compatibilitate
          originalFilename: conv.original_filename,
          convertedFilename: conv.converted_filename,
          createdAt: conv.created_at,
          fileSize: conv.file_size,
        }))
        setSavedConversions(normalizedConversions)
      }
    } catch (error: any) {
      console.error('Eroare la încărcarea conversiilor:', error)
      setConversionsError(error.message || 'Nu s-au putut încărca conversiile')
      toast.error('Eroare la încărcarea conversiilor')
    } finally {
      setIsLoadingConversions(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = async (id: number, filename: string) => {
    try {
      toast.info('Se descarcă fișierul...', { autoClose: 1000 })

      const response = await fetch(`/api/conversions/${id}/download`)

      if (!response.ok) {
        throw new Error('Eroare la descărcarea fișierului')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Fișier descărcat cu succes!')
    } catch (error) {
      console.error('Eroare la download:', error)
      toast.error('Eroare la descărcarea fișierului. Te rugăm să încerci din nou.')
    }
  }

  const handleDeleteClick = (id: number) => {
    if (!user?.id) {
      toast.error('Trebuie să fii autentificat pentru a șterge conversii')
      return
    }
    setDeleteDialog({ isOpen: true, conversionId: id })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.conversionId || !user?.id) {
      setDeleteDialog({ isOpen: false, conversionId: null })
      return
    }

    const id = deleteDialog.conversionId

    try {
      const response = await fetch(`/api/conversions/${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': user.id,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Eroare la ștergerea conversiei' }))
        throw new Error(errorData.message || 'Eroare la ștergerea conversiei')
      }

      // Elimină conversia din lista locală
      const updated = savedConversions.filter((c) => c.id !== id)
      setSavedConversions(updated)

      toast.success('Conversie ștearsă cu succes!')
      setDeleteDialog({ isOpen: false, conversionId: null })
    } catch (error: any) {
      console.error('Eroare la ștergerea conversiei:', error)
      toast.error(error.message || 'Eroare la ștergerea conversiei. Te rugăm să încerci din nou.')
      setDeleteDialog({ isOpen: false, conversionId: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, conversionId: null })
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Conversii salvate</h1>
        <p className="text-gray-600">
          {savedConversions.length === 0
            ? 'Nu ai conversii salvate încă.'
            : `Ai ${savedConversions.length} conversie${savedConversions.length !== 1 ? 'i' : ''} salvată${savedConversions.length !== 1 ? 'e' : ''}.`}
        </p>
      </div>

      {isLoadingConversions ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Se încarcă conversiile...</p>
          </div>
        </div>
      ) : conversionsError ? (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">Eroare la încărcarea conversiilor</p>
          <p className="text-gray-500 text-sm mb-4">{conversionsError}</p>
          <button
            onClick={loadSavedConversions}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Încearcă din nou
          </button>
        </div>
      ) : savedConversions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2">Nu există conversii salvate</p>
          <p className="text-gray-400 text-sm">
            Conversiile tale vor apărea aici după ce le vei converti pe pagina principală.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Lista conversiilor ({savedConversions.length})
          </h2>
          <div className="space-y-3">
            {savedConversions.map((conversion) => (
              <div
                key={conversion.id}
                className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversion.original_filename || conversion.originalFilename}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conversion.created_at || conversion.createdAt || '').toLocaleString('ro-RO')} •{' '}
                        {formatFileSize(conversion.file_size || conversion.fileSize || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() =>
                        handleDownload(conversion.id, conversion.converted_filename || conversion.convertedFilename || 'converted.docx')
                      }
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      title="Descarcă fișierul"
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
                    <button
                      onClick={() => handleDeleteClick(conversion.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Șterge din listă"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Șterge conversie"
        message="Ești sigur că vrei să ștergi această conversie? Această acțiune este ireversibilă și va șterge atât înregistrarea din baza de date, cât și fișierul de pe server."
        confirmText="Șterge"
        cancelText="Anulează"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}

export default ConversionsHistory
