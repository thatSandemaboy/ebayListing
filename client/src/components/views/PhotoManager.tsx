import { useState, useRef } from 'react';
import { InventoryItem } from '@/lib/mockData';
import { useApp } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoManagerProps {
  item: InventoryItem;
}

export function PhotoManager({ item }: PhotoManagerProps) {
  const { updateItemPhotos } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Mock upload functionality
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app, we'd upload these. Here we just create object URLs
      const newPhotos = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      updateItemPhotos(item.id, [...item.photos, ...newPhotos]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Mock drop handling - just adding a placeholder for effect if no files actually dropped
    // or processing files if they exist
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newPhotos = Array.from(e.dataTransfer.files).map(file => URL.createObjectURL(file));
      updateItemPhotos(item.id, [...item.photos, ...newPhotos]);
    } else {
       // Just to simulate interaction if dropped something else
       // In real app we'd handle this better
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...item.photos];
    newPhotos.splice(index, 1);
    updateItemPhotos(item.id, newPhotos);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div 
        className={cn(
          "border-2 border-dashed rounded-xl p-10 transition-all text-center cursor-pointer group relative overflow-hidden bg-card/50",
          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-lg">Drag photos here or click to upload</h3>
            <p className="text-sm text-muted-foreground">Supports JPG, PNG, HEIC. Need at least 4 photos for best results.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            Gallery ({item.photos.length})
          </h3>
          {item.photos.length < 4 && (
            <span className="text-xs text-amber-600 font-medium">Add {4 - item.photos.length} more recommended</span>
          )}
        </div>

        {item.photos.length === 0 ? (
          <div className="h-40 flex items-center justify-center border rounded-lg bg-muted/20 text-muted-foreground text-sm italic">
            No photos added yet
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {item.photos.map((photo, index) => (
                <motion.div
                  key={`${photo}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className="group relative aspect-square rounded-lg overflow-hidden bg-background border shadow-sm"
                >
                  <img src={photo} alt={`Item ${index + 1}`} className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md">
                    #{index + 1}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
