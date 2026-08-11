import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { BASE_URL } from '@/lib/constants';

interface ProfilePictureUploadProps {
  currentImage?: string;
  onImageSelect?: (file: File | null) => void; // Changed from onImageChange
  userName?: string;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ProfilePictureUpload = ({ currentImage, onImageSelect, userName = "User" }: ProfilePictureUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentImage prop when it changes
  useEffect(() => {
    console.log('ProfilePictureUpload: currentImage changed to:', currentImage);
    if (currentImage) {
      // Prepend BASE_URL if the currentImage is a relative path
      const fullImageUrl = currentImage.startsWith('http') ? currentImage : `${BASE_URL}${currentImage}`;
      setPreview(fullImageUrl);
      setHasUnsavedChanges(false);
      setPendingFile(null);
    }
  }, [currentImage]);

  // Get initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create cropped image
  const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<File> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous'; // Handle CORS
      
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Set canvas size to the cropped area (square)
          canvas.width = pixelCrop.width;
          canvas.height = pixelCrop.height;

          // Draw the cropped image
          ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
          );

          // Resize to 800x800 if larger
          const finalCanvas = document.createElement('canvas');
          const finalCtx = finalCanvas.getContext('2d');
          
          if (!finalCtx) {
            reject(new Error('Failed to get final canvas context'));
            return;
          }

          const targetSize = 800;
          const scale = Math.min(targetSize / pixelCrop.width, targetSize / pixelCrop.height, 1);
          const finalWidth = Math.round(pixelCrop.width * scale);
          const finalHeight = Math.round(pixelCrop.height * scale);

          finalCanvas.width = finalWidth;
          finalCanvas.height = finalHeight;
          finalCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);

          // Convert to blob and then to file
          finalCanvas.toBlob(
            (blob) => {
              if (blob) {
                const croppedFile = new File(
                  [blob],
                  originalFile?.name || 'profile-picture.jpg',
                  { type: 'image/jpeg', lastModified: Date.now() }
                );
                resolve(croppedFile);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.85 // Quality: 85%
          );
        } catch (error) {
          reject(error);
        }
      };

      image.onerror = (error) => {
        console.error('Image load error:', error);
        reject(new Error('Image load failed'));
      };
      
      // Set src after setting up event handlers
      image.src = imageSrc;
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    setOriginalFile(file);

    // Create preview for cropping
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) {
      alert('No image or crop area selected');
      return;
    }

    setIsProcessing(true);
    setShowCropModal(false);

    try {
      console.log('Starting crop with area:', croppedAreaPixels);
      
      // Create cropped image
      const croppedFile = await createCroppedImage(imageToCrop, croppedAreaPixels);
      
      console.log('Cropped file created:', croppedFile.name, croppedFile.size, 'bytes');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(croppedFile);

      // Store the pending file instead of immediately passing to parent
      setPendingFile(croppedFile);
      setHasUnsavedChanges(true);
      
      // Reset crop state
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert(`Failed to crop image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveImage = () => {
    if (pendingFile) {
      onImageSelect?.(pendingFile);
      setHasUnsavedChanges(false);
      setPendingFile(null);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setPendingFile(null);
    setHasUnsavedChanges(false);
    onImageSelect?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  console.log('ProfilePictureUpload render - preview:', preview, 'currentImage:', currentImage);

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
            <AvatarImage src={preview || undefined} alt="Profile picture" />
            <AvatarFallback className="bg-gradient-to-br from-[#800000] to-[#600000] text-white text-3xl font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload profile picture"
        />

        <div className="flex gap-2 flex-wrap justify-center">
          {hasUnsavedChanges ? (
            <>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSaveImage}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4" />
                Save Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClick}
                disabled={isProcessing}
                className="gap-2 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Upload className="w-4 h-4" />
                Change Photo
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={isProcessing}
              className="gap-2 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <Upload className="w-4 h-4" />
              {preview ? 'Change Photo' : 'Upload Photo'}
            </Button>
          )}
          
          {preview && !hasUnsavedChanges && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              Remove
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center max-w-xs">
          Upload a photo (JPG, PNG, max 10MB). You can crop and adjust before saving.
        </p>
      </div>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] p-0 max-h-[95vh] flex flex-col">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-900">
              Crop Your Photo
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
              Adjust the position and size to get the perfect square crop
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative h-[300px] sm:h-[400px] bg-gray-100">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#800000]"
                aria-label="Zoom level"
              />
            </div>
          </div>

          <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 gap-2 flex-col-reverse sm:flex-row w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCropCancel}
              className="gap-2 w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              className="gap-2 w-full sm:w-auto bg-[#800000] hover:bg-[#600000] text-white"
            >
              <Check className="w-4 h-4" />
              Crop & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePictureUpload;
