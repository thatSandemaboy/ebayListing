import { useState, useEffect } from 'react';
import { InventoryItem } from '@/lib/mockData';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Wand2, Save, RotateCcw, Plus, Trash2, Eye, Code, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ListingGeneratorProps {
  item: InventoryItem;
}

interface ItemSpecific {
  name: string;
  value: string;
  displayOrder?: number;
}

interface EbayListing {
  id: string;
  itemId: string;
  status: string;
  title: string;
  categoryId?: string;
  categoryPath?: string;
  condition: string;
  conditionNotes?: string;
  price?: number;
  descriptionHtml?: string;
  whatsIncluded?: string;
  productFeatures?: string[];
  shippingPolicy?: string;
  returnPolicy?: string;
  itemSpecifics?: ItemSpecific[];
}

const DEFAULT_ITEM_SPECIFICS = [
  'Brand', 'Model', 'Color', 'Storage Capacity', 'Network', 'Carrier', 
  'Connectivity', 'Operating System', 'Screen Size', 'MPN', 'Type'
];

export function ListingGenerator({ item }: ListingGeneratorProps) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    condition: string;
    conditionNotes: string;
    price: number;
    categoryPath: string;
    descriptionHtml: string;
    whatsIncluded: string;
    productFeatures: string[];
    itemSpecifics: ItemSpecific[];
  }>({
    title: '',
    condition: '',
    conditionNotes: '',
    price: 0,
    categoryPath: '',
    descriptionHtml: '',
    whatsIncluded: '',
    productFeatures: [],
    itemSpecifics: []
  });

  const { data: existingListing, isLoading } = useQuery<EbayListing>({
    queryKey: ['ebay-listing', item.id],
    queryFn: async () => {
      const res = await fetch(`/api/items/${item.id}/ebay-listing`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch listing');
      return res.json();
    }
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/items/${item.id}/ebay-listing`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ebay-listing', item.id] });
    }
  });

  const updateListingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PATCH', `/api/ebay-listings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ebay-listing', item.id] });
    }
  });

  useEffect(() => {
    if (existingListing) {
      setFormData({
        title: existingListing.title || '',
        condition: existingListing.condition || '',
        conditionNotes: existingListing.conditionNotes || '',
        price: existingListing.price || 0,
        categoryPath: existingListing.categoryPath || '',
        descriptionHtml: existingListing.descriptionHtml || '',
        whatsIncluded: existingListing.whatsIncluded || '',
        productFeatures: existingListing.productFeatures || [],
        itemSpecifics: existingListing.itemSpecifics || []
      });
    }
  }, [existingListing]);

  const generateListing = () => {
    setIsGenerating(true);
    
    const details = item.details as any;
    
    const itemSpecifics: ItemSpecific[] = [];
    let order = 0;
    
    if (details.brand) itemSpecifics.push({ name: 'Brand', value: details.brand, displayOrder: order++ });
    if (details.model) itemSpecifics.push({ name: 'Model', value: details.model, displayOrder: order++ });
    if (details.color) itemSpecifics.push({ name: 'Color', value: details.color, displayOrder: order++ });
    if (details.storage) itemSpecifics.push({ name: 'Storage Capacity', value: details.storage, displayOrder: order++ });
    if (details.network) itemSpecifics.push({ name: 'Network', value: details.network, displayOrder: order++ });
    if (details.variant) itemSpecifics.push({ name: 'Carrier', value: details.variant, displayOrder: order++ });
    itemSpecifics.push({ name: 'Connectivity', value: 'Bluetooth, Lightning, Wi-Fi', displayOrder: order++ });
    itemSpecifics.push({ name: 'Operating System', value: 'iOS', displayOrder: order++ });
    itemSpecifics.push({ name: 'Type', value: 'Smartphone', displayOrder: order++ });
    
    const productFeatures = [
      details.storage ? `${details.storage} Storage` : null,
      details.color ? `${details.color} Color` : null,
      'Original Device',
      'Fully Tested'
    ].filter(Boolean) as string[];

    const conditionMap: Record<string, string> = {
      'New': 'New',
      'Like New': 'Open box',
      'Excellent': 'Seller refurbished',
      'Good': 'Used',
      'Fair': 'Used',
      'Poor': 'For parts or not working',
      'For Parts': 'For parts or not working',
      'Damaged': 'For parts or not working'
    };

    const ebayCondition = conditionMap[item.condition] || 'Used';
    
    const title = `${details.brand || ''} ${details.model || ''} ${details.storage || ''} ${details.color || ''} - ${details.variant || 'Unlocked'}`.trim();
    
    const descriptionHtml = generateDescriptionHtml(item, itemSpecifics, productFeatures);
    
    setTimeout(() => {
      const generatedData = {
        title: title.substring(0, 80),
        condition: ebayCondition,
        conditionNotes: item.condition === 'For Parts' || item.condition === 'Damaged' 
          ? 'This device is being sold for parts only. Please see item description for details.'
          : '',
        price: item.salePrice || 299.00,
        categoryPath: 'Cell Phones & Accessories > Cell Phones & Smartphones',
        descriptionHtml,
        whatsIncluded: 'Device only. No original box or accessories included.',
        productFeatures,
        itemSpecifics
      };
      
      setFormData(generatedData);
      setIsGenerating(false);
    }, 1500);
  };

  const generateDescriptionHtml = (item: InventoryItem, specifics: ItemSpecific[], features: string[]) => {
    const details = item.details as any;
    
    return `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #0066c0; padding-bottom: 10px;">
    ${details.brand || ''} ${details.model || ''} ${details.storage || ''} - ${details.color || ''}
  </h2>
  
  <h3 style="color: #0066c0;">Product Description</h3>
  <p>This ${details.brand || ''} ${details.model || ''} features ${details.storage || 'storage'} capacity in ${details.color || 'a stylish color'}. ${
    details.network ? `Network: ${details.network}.` : ''
  }</p>
  
  <h3 style="color: #0066c0;">Condition</h3>
  <p><strong>${item.condition}</strong></p>
  <p>This device has been tested and inspected. All functions have been verified.</p>
  
  <h3 style="color: #0066c0;">What's Included</h3>
  <ul>
    <li>Device only</li>
    <li>No original box or accessories</li>
  </ul>
  
  <h3 style="color: #0066c0;">Key Features</h3>
  <ul>
${features.map(f => `    <li>${f}</li>`).join('\n')}
  </ul>
  
  <h3 style="color: #0066c0;">Shipping & Returns</h3>
  <p>Fast shipping with tracking. Returns accepted within 30 days.</p>
  
  <p style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
    <em>Thank you for shopping with us!</em>
  </p>
</div>`;
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      itemSpecifics: formData.itemSpecifics
    };

    if (existingListing?.id) {
      await updateListingMutation.mutateAsync({ id: existingListing.id, data: payload });
    } else {
      await createListingMutation.mutateAsync(payload);
    }
  };

  const handleExportSingle = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const response = await fetch('/api/ebay/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: [item.id] }),
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'ebay-export.csv';
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportMessage('CSV exported successfully!');
      setTimeout(() => setExportMessage(null), 3000);
    } catch (error) {
      setExportMessage('Export failed');
      setTimeout(() => setExportMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const addItemSpecific = () => {
    setFormData(prev => ({
      ...prev,
      itemSpecifics: [...prev.itemSpecifics, { name: '', value: '', displayOrder: prev.itemSpecifics.length }]
    }));
  };

  const updateItemSpecific = (index: number, field: 'name' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      itemSpecifics: prev.itemSpecifics.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      )
    }));
  };

  const removeItemSpecific = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itemSpecifics: prev.itemSpecifics.filter((_, i) => i !== index)
    }));
  };

  const addProductFeature = () => {
    setFormData(prev => ({
      ...prev,
      productFeatures: [...prev.productFeatures, '']
    }));
  };

  const updateProductFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      productFeatures: prev.productFeatures.map((f, i) => i === index ? value : f)
    }));
  };

  const removeProductFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productFeatures: prev.productFeatures.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const hasListing = existingListing || formData.title;

  return (
    <div className="h-full flex flex-col space-y-6">
      {!hasListing && !isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 border-2 border-dashed rounded-xl bg-card/30">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-semibold" data-testid="text-generate-heading">Ready to Generate Listing</h3>
            <p className="text-muted-foreground">
              Generate an eBay-ready listing with Item Specifics, formatted description, and pricing based on your item details.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={generateListing}
            className="h-12 px-8 text-base shadow-lg shadow-primary/25"
            data-testid="button-generate-listing"
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
            <h3 className="text-lg font-medium">Generating eBay Listing...</h3>
            <p className="text-sm text-muted-foreground">Creating Item Specifics and description</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold" data-testid="text-listing-preview">Listing Editor</h3>
              {exportMessage && (
                <span className={cn(
                  "text-sm",
                  exportMessage.includes('success') ? "text-emerald-600" : "text-red-500"
                )}>
                  {exportMessage}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generateListing} data-testid="button-regenerate">
                <RotateCcw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button 
                variant="outline"
                size="sm" 
                onClick={handleExportSingle}
                disabled={isExporting}
                data-testid="button-export-single"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={createListingMutation.isPending || updateListingMutation.isPending}
                data-testid="button-save-listing"
              >
                <Save className="w-4 h-4 mr-2" />
                {existingListing ? 'Update' : 'Save'} Listing
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    className="font-medium"
                    data-testid="input-title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Input 
                      id="condition" 
                      value={formData.condition} 
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                      data-testid="input-condition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input 
                        id="price" 
                        type="number" 
                        value={formData.price} 
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        className="pl-7 font-mono"
                        data-testid="input-price"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input 
                    id="category" 
                    value={formData.categoryPath} 
                    onChange={(e) => setFormData({...formData, categoryPath: e.target.value})}
                    className="text-sm"
                    data-testid="input-category"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditionNotes">Seller Notes (Condition)</Label>
                  <Textarea 
                    id="conditionNotes" 
                    value={formData.conditionNotes} 
                    onChange={(e) => setFormData({...formData, conditionNotes: e.target.value})}
                    placeholder="Additional notes about the item's condition..."
                    className="min-h-[80px]"
                    data-testid="input-condition-notes"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Item Specifics</CardTitle>
                  <Button variant="outline" size="sm" onClick={addItemSpecific} data-testid="button-add-specific">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formData.itemSpecifics.map((spec, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input 
                        value={spec.name} 
                        onChange={(e) => updateItemSpecific(index, 'name', e.target.value)}
                        placeholder="Name"
                        className="w-40 text-sm"
                        data-testid={`input-specific-name-${index}`}
                      />
                      <Input 
                        value={spec.value} 
                        onChange={(e) => updateItemSpecific(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 text-sm"
                        data-testid={`input-specific-value-${index}`}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItemSpecific(index)}
                        className="shrink-0"
                        data-testid={`button-remove-specific-${index}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  {formData.itemSpecifics.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No item specifics yet. Click "Add" to add specifics like Brand, Model, Color, etc.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Product Features</CardTitle>
                  <Button variant="outline" size="sm" onClick={addProductFeature} data-testid="button-add-feature">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formData.productFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input 
                        value={feature} 
                        onChange={(e) => updateProductFeature(index, e.target.value)}
                        placeholder="Feature description"
                        className="flex-1 text-sm"
                        data-testid={`input-feature-${index}`}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeProductFeature(index)}
                        className="shrink-0"
                        data-testid={`button-remove-feature-${index}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  {formData.productFeatures.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No product features yet. Add key selling points for your listing.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Description HTML</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowPreview(!showPreview)}
                    data-testid="button-toggle-preview"
                  >
                    {showPreview ? <Code className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showPreview ? 'Edit' : 'Preview'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showPreview ? (
                  <div 
                    className="border rounded-lg p-4 bg-white min-h-[300px]"
                    dangerouslySetInnerHTML={{ __html: formData.descriptionHtml }}
                    data-testid="div-description-preview"
                  />
                ) : (
                  <Textarea 
                    value={formData.descriptionHtml} 
                    onChange={(e) => setFormData({...formData, descriptionHtml: e.target.value})}
                    className="min-h-[300px] font-mono text-xs"
                    placeholder="Enter HTML description..."
                    data-testid="textarea-description-html"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsIncluded">What's Included</Label>
                  <Textarea 
                    id="whatsIncluded" 
                    value={formData.whatsIncluded} 
                    onChange={(e) => setFormData({...formData, whatsIncluded: e.target.value})}
                    placeholder="List what's included with the item..."
                    className="min-h-[60px]"
                    data-testid="textarea-whats-included"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
