import React, { useState } from 'react'
import { X, Trash2, CheckSquare, Square, Image, AlertCircle } from 'lucide-react'
import { UnusedImage } from '../../utils/link-validator/UnusedImageLinksValidator'
import toast from 'react-hot-toast'

interface UnusedImagesDialogProps {
  isOpen: boolean
  onClose: () => void
  unusedImages: UnusedImage[]
  onDeleteImages: (imageFileNames: string[]) => Promise<number>
}

const UnusedImagesDialog: React.FC<UnusedImagesDialogProps> = ({
  isOpen,
  onClose,
  unusedImages,
  onDeleteImages
}) => {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleImageSelect = (fileName: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName)
    } else {
      newSelected.add(fileName)
    }
    setSelectedImages(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedImages.size === unusedImages.length) {
      // Deselect all
      setSelectedImages(new Set())
    } else {
      // Select all
      setSelectedImages(new Set(unusedImages.map(img => img.fileName)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) {
      toast.error('Please select images to delete')
      return
    }

    const confirmed = confirm(`Are you sure you want to delete ${selectedImages.size} selected image(s)? This action cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)

    try {
      const deletedCount = await onDeleteImages(Array.from(selectedImages))

      if (deletedCount === selectedImages.size) {
        toast.success(`Successfully deleted ${deletedCount} images`)
      } else {
        toast.error(`Deleted ${deletedCount} out of ${selectedImages.size} images. Some files may have failed to delete.`)
      }

      setSelectedImages(new Set())
    } catch (error) {
      console.error('Failed to delete images:', error)
      toast.error('Failed to delete selected images')
    } finally {
      setIsDeleting(false)
    }
  }


  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown date'
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN')
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 max-h-[85vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Cleanup Unused Images</h2>
            <span className="text-sm text-gray-500">
              ({unusedImages.length} unused images found)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full max-h-[calc(85vh-120px)]">
          {unusedImages.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4">
                <Image className="w-16 h-16 text-green-500 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No unused images found!
              </h3>
              <p className="text-gray-500">
                All images in the .images directory are being used in your markdown files.
              </p>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                  >
                    {selectedImages.size === unusedImages.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {selectedImages.size === unusedImages.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedImages.size} of {unusedImages.length} selected
                  </span>
                </div>
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedImages.size === 0 || isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : `Delete Selected (${selectedImages.size})`}
                </button>
              </div>

              {/* Image Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {unusedImages.map((image) => (
                    <div
                      key={image.fileName}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${selectedImages.has(image.fileName)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => handleImageSelect(image.fileName)}
                    >
                      {/* Image Preview */}
                      <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                        {image.imageUrl ? (
                          <img
                            src={image.imageUrl}
                            alt={image.fileName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center" style={{ display: 'none' }}>
                          <AlertCircle className="w-8 h-8 text-gray-400" />
                        </div>

                        {/* Selection indicator */}
                        <div className="absolute top-2 right-2">
                          {selectedImages.has(image.fileName) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600 bg-white rounded shadow" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-600 bg-white rounded shadow" />
                          )}
                        </div>
                      </div>

                      {/* Image Info */}
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-gray-900 truncate" title={image.fileName}>
                          {image.fileName}
                        </h4>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                          <div>{formatDate(image.lastModified)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnusedImagesDialog