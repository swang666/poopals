'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Image as ImageIcon, RefreshCcw, Check } from 'lucide-react'

interface ScatScannerProps {
  onImageCaptured: (file: File) => void
  onCancel: () => void
}

export function ScatScanner({ onImageCaptured, onCancel }: ScatScannerProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleConfirm = () => {
    if (file) {
      onImageCaptured(file)
    }
  }

  const handleRetake = () => {
    setImageSrc(null)
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="w-full max-w-md overflow-hidden bg-white">
      <CardContent className="p-0">
        {!imageSrc ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-[400px] bg-gray-50 border-b">
            <div className="mb-6 text-center text-gray-500">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700">Time to inspect the goods!</p>
              <p className="text-sm px-4 mt-2">Take a clear photo for the best AI analysis.</p>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            <div className="flex gap-4 w-full px-4">
              <Button 
                className="flex-1 h-14 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-5 h-5 mr-2" />
                Capture
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-400 mt-6 mt-auto">
              Photos are processed securely via AI.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="relative aspect-[3/4] w-full bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageSrc} 
                alt="Captured sample" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-4 bg-white">
              <Button 
                variant="outline" 
                className="h-14" 
                onClick={handleRetake}
              >
                <RefreshCcw className="w-5 h-5 mr-2" />
                Retake
              </Button>
              <Button 
                className="h-14 bg-green-600 hover:bg-green-700 text-white" 
                onClick={handleConfirm}
              >
                <Check className="w-5 h-5 mr-2" />
                Analyze
              </Button>
            </div>
          </div>
        )}
        
        {!imageSrc && (
          <div className="p-4 bg-white">
            <Button variant="ghost" className="w-full text-gray-500" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
