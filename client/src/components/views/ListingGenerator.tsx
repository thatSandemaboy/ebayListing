import { useState, useEffect } from 'react';
import { InventoryItem } from '@/lib/mockData';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Wand2, Copy, Check, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ListingGeneratorProps {
  item: InventoryItem;
}

export function ListingGenerator({ item }: ListingGeneratorProps) {
  const { updateItemListing } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: item.listing?.title || '',
    description: item.listing?.description || '',
    price: item.listing?.price || 0,
    category: item.listing?.category || ''
  });

  // If item changes, update form data
  useEffect(() => {
    setFormData({
      title: item.listing?.title || '',
      description: item.listing?.description || '',
      price: item.listing?.price || 0,
      category: item.listing?.category || ''
    });
  }, [item.id]);

  const generateListing = () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const generatedData = {
        title: `${item.details.brand} ${item.details.model} ${item.details.storage || ''} ${item.details.color} - ${item.condition} Condition`,
        description: `For sale is a ${item.details.brand} ${item.details.model} in ${item.details.color}. \n\nCondition: ${item.condition}\nSpecs: ${item.details.storage ? item.details.storage + ' Storage' : ''}\n\nThis device has been fully tested and is ready for a new home. Fast shipping!`,
        price: 999.00,
        category: 'Cell Phones & Accessories > Cell Phones & Smartphones'
      };
      
      setFormData(generatedData);
      setIsGenerating(false);
      updateItemListing(item.id, generatedData);
    }, 2000);
  };

  const handleSave = () => {
    updateItemListing(item.id, formData);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {!item.listing && !isGenerating && !formData.title ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 border-2 border-dashed rounded-xl bg-card/30">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-semibold">Ready to Generate Listing</h3>
            <p className="text-muted-foreground">
              We'll use your item details and photos to generate an optimized eBay listing title, description, and pricing.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={generateListing}
            className="h-12 px-8 text-base shadow-lg shadow-primary/25"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            Generate with AI
          </Button>
        </div>
      ) : isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-muted-foreground/20"></div>
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            ></motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Analyzing Item Details...</h3>
            <p className="text-sm text-muted-foreground">Crafting the perfect title and description</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Listing Preview</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generateListing}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="title">Title</Label>
                <span className={cn("text-xs", formData.title.length > 80 ? "text-red-500" : "text-muted-foreground")}>
                  {formData.title.length}/80 chars
                </span>
              </div>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="font-medium text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Buy It Now Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input 
                    id="price" 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="pl-7 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">eBay Category</Label>
                <Input 
                  id="category" 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="bg-muted/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">HTML Description</Label>
              <Card className="overflow-hidden border-muted-foreground/20">
                <div className="bg-muted/50 border-b px-3 py-2 flex gap-2">
                  <div className="h-4 w-4 rounded-full bg-background border"></div>
                  <div className="h-4 w-4 rounded-full bg-background border"></div>
                  <div className="h-4 w-20 rounded bg-background border"></div>
                </div>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="min-h-[200px] border-0 focus-visible:ring-0 rounded-none resize-none font-mono text-sm"
                />
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
