import { useState, useEffect } from 'react';
import { InventoryItem } from '@/lib/types';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Wand2, Save, RotateCcw, Plus, Trash2, Eye, Code, ExternalLink, CheckCircle2, XCircle, Upload, Loader2 } from 'lucide-react';
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
  const [isPushingToEbay, setIsPushingToEbay] = useState(false);
  const [ebayPushResult, setEbayPushResult] = useState<{ success: boolean; message: string } | null>(null);
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

  const { data: ebayStatus } = useQuery<{ connected: boolean; hasCredentials: boolean; redirectUri: string }>({
    queryKey: ['ebay-status'],
    queryFn: async () => {
      const res = await fetch('/api/ebay/status');
      if (!res.ok) throw new Error('Failed to fetch eBay status');
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

  const handleConnectEbay = async () => {
    try {
      const res = await fetch('/api/ebay/auth');
      if (!res.ok) throw new Error('Failed to get auth URL');
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to connect to eBay:', error);
    }
  };

  const handleDisconnectEbay = async () => {
    try {
      await fetch('/api/ebay/disconnect', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['ebay-status'] });
    } catch (error) {
      console.error('Failed to disconnect from eBay:', error);
    }
  };

  const handlePushToEbay = async () => {
    if (!existingListing) {
      setEbayPushResult({ success: false, message: 'Please save your listing first before pushing to eBay.' });
      setTimeout(() => setEbayPushResult(null), 5000);
      return;
    }

    setIsPushingToEbay(true);
    setEbayPushResult(null);

    try {
      const res = await fetch(`/api/ebay/push/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const result = await res.json();

      if (res.ok) {
        setEbayPushResult({ success: true, message: result.message || 'Successfully pushed to eBay!' });
        queryClient.invalidateQueries({ queryKey: ['ebay-listing', item.id] });
      } else {
        setEbayPushResult({ success: false, message: result.message || 'Failed to push to eBay' });
      }
    } catch (error: any) {
      setEbayPushResult({ success: false, message: error.message || 'Failed to push to eBay' });
    } finally {
      setIsPushingToEbay(false);
      setTimeout(() => setEbayPushResult(null), 8000);
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
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      {!hasListing && !isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 border border-dashed rounded-2xl bg-muted/[0.02] border-border/60">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/10 shadow-inner">
            <Sparkles className="w-9 h-9 text-primary/80" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground/80" data-testid="text-generate-heading">Optimize with AI</h3>
            <p className="text-[14px] text-muted-foreground/70 font-medium">
              We'll analyze your assets and item specifications to generate a professional, SEO-optimized eBay listing in seconds.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={generateListing}
            className="h-12 px-10 text-[14px] font-bold shadow-lg shadow-primary/10 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            data-testid="button-generate-listing"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Listing
          </Button>
        </div>
      ) : isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-primary/5"></div>
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            ></motion.div>
            <Sparkles className="w-10 h-10 text-primary/40 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-[16px] font-bold text-foreground/80">Synthesizing Listing Data...</h3>
            <p className="text-[13px] text-muted-foreground/50 font-medium uppercase tracking-widest">Optimizing for eBay Search Engine</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-20">
          <div className="flex items-center justify-between bg-muted/[0.05] p-4 rounded-xl border border-border/30">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/40 shadow-sm">
                  <Wand2 className="w-4 h-4 text-primary" />
               </div>
               <div>
                 <h3 className="text-[14px] font-bold text-foreground/80" data-testid="text-listing-preview">Smart Editor</h3>
                 <p className="text-[11px] text-muted-foreground/50 font-medium">AI-Generated Draft</p>
               </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={generateListing} className="h-9 text-[12px] font-bold text-muted-foreground hover:text-foreground" data-testid="button-regenerate">
                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                Regenerate
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={createListingMutation.isPending || updateListingMutation.isPending}
                className="h-9 px-4 text-[12px] font-bold shadow-sm"
                data-testid="button-save-listing"
              >
                <Save className="w-3.5 h-3.5 mr-2" />
                {existingListing ? 'Save Changes' : 'Create Listing'}
              </Button>
            </div>
          </div>

          <div className="grid gap-8">
            <div className="space-y-6">
              <h4 className="text-[12px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] px-1">Basic Information</h4>
              <div className="grid gap-6 bg-muted/[0.03] p-6 rounded-2xl border border-border/40 shadow-sm">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <Label htmlFor="title" className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Listing Title</Label>
                    <span className={cn("text-[10px] font-bold tracking-tight", formData.title.length > 80 ? "text-red-500" : "text-muted-foreground/40")}>
                      {formData.title.length}/80
                    </span>
                  </div>
                  <Input 
                    id="title" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="h-11 bg-background text-[15px] font-semibold border-border/60 focus:ring-primary/20 transition-all"
                    data-testid="input-title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="condition" className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">eBay Condition</Label>
                    <Input 
                      id="condition" 
                      value={formData.condition} 
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                      className="h-11 bg-background text-[14px] border-border/60"
                      data-testid="input-condition"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Target Price</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-[14px] font-bold text-muted-foreground/40">$</span>
                      <Input 
                        id="price" 
                        type="number" 
                        value={formData.price} 
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        className="h-11 pl-8 bg-background text-[14px] font-mono font-bold border-border/60"
                        data-testid="input-price"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Marketplace Category</Label>
                  <Input 
                    id="category" 
                    value={formData.categoryPath} 
                    onChange={(e) => setFormData({...formData, categoryPath: e.target.value})}
                    className="h-11 bg-background text-[13px] border-border/60 text-muted-foreground/80"
                    data-testid="input-category"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[12px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Item Specifics</h4>
                <Button variant="ghost" size="sm" onClick={addItemSpecific} className="h-7 text-[10px] font-bold uppercase tracking-wider text-primary" data-testid="button-add-specific">
                  <Plus className="w-3 h-3 mr-1" /> Add Field
                </Button>
              </div>
              <div className="bg-muted/[0.03] p-6 rounded-2xl border border-border/40 shadow-sm space-y-3">
                {formData.itemSpecifics.map((spec, index) => (
                  <div key={index} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2 duration-300">
                    <Input 
                      value={spec.name} 
                      onChange={(e) => updateItemSpecific(index, 'name', e.target.value)}
                      placeholder="Property"
                      className="w-1/3 h-10 text-[13px] font-bold bg-background border-border/40"
                      data-testid={`input-specific-name-${index}`}
                    />
                    <Input 
                      value={spec.value} 
                      onChange={(e) => updateItemSpecific(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 h-10 text-[13px] bg-background border-border/40"
                      data-testid={`input-specific-value-${index}`}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeItemSpecific(index)}
                      className="h-10 w-10 text-muted-foreground/30 hover:text-red-500 transition-colors"
                      data-testid={`button-remove-specific-${index}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {formData.itemSpecifics.length === 0 && (
                  <p className="text-[13px] text-muted-foreground/40 font-medium text-center py-6 italic border-2 border-dashed border-border/20 rounded-xl">
                    No specific properties defined.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-[12px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] px-1">Rich Description</h4>
               <div className="bg-muted/[0.03] p-2 rounded-2xl border border-border/40 shadow-sm">
                  <div className="flex bg-muted/50 p-1 rounded-xl mb-2 w-fit mx-2 mt-2">
                    <button 
                      onClick={() => setShowPreview(false)}
                      className={cn(
                        "px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all uppercase tracking-wider",
                        !showPreview ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Source
                    </button>
                    <button 
                      onClick={() => setShowPreview(true)}
                      className={cn(
                        "px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all uppercase tracking-wider",
                        showPreview ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Preview
                    </button>
                  </div>
                  
                  {showPreview ? (
                    <div className="p-4 bg-white rounded-xl min-h-[400px] shadow-inner m-1 overflow-auto">
                       <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: formData.descriptionHtml }}
                        data-testid="div-description-preview"
                      />
                    </div>
                  ) : (
                    <Textarea 
                      value={formData.descriptionHtml} 
                      onChange={(e) => setFormData({...formData, descriptionHtml: e.target.value})}
                      className="min-h-[400px] font-mono text-[12px] bg-background border-none focus-visible:ring-0 resize-none p-6"
                      placeholder="Enter HTML description..."
                      data-testid="textarea-description-html"
                    />
                  )}
               </div>
            </div>

            <Card className="border-primary/20 bg-primary/[0.02] overflow-hidden rounded-2xl">
              <CardHeader className="pb-4 bg-primary/[0.03] border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[15px] font-bold flex items-center gap-2 text-primary/80">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.5 5.5h-4v13h4v-13zM12 5.5H8v13h4v-13zm8.5 0h-4v13h4v-13zM16.5 5.5h-4v13h4v-13z" fill="#E53238"/>
                      <path d="M7.5 5.5h-4v13h4v-13z" fill="#0064D2"/>
                      <path d="M12 5.5H8v13h4v-13z" fill="#F5AF02"/>
                      <path d="M16.5 5.5h-4v13h4v-13z" fill="#86B817"/>
                    </svg>
                    Marketplace Integration
                  </CardTitle>
                  {ebayStatus?.connected ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">
                      Live Connection
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground/50 text-[10px] font-bold uppercase tracking-widest border-border/50">
                      Disconnected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {ebayPushResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-4 rounded-xl text-[13px] font-medium border shadow-sm",
                      ebayPushResult.success 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300" 
                        : "bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                       {ebayPushResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                       {ebayPushResult.message}
                    </div>
                  </motion.div>
                )}

                {!ebayStatus?.hasCredentials ? (
                  <div className="text-[13px] text-muted-foreground/70 p-5 bg-background/50 rounded-xl border border-border/40">
                    <p className="font-bold text-foreground/80 mb-2">API Credentials Required</p>
                    <p>To synchronize directly with eBay Seller Hub, please provide your developer credentials in the global settings.</p>
                  </div>
                ) : !ebayStatus?.connected ? (
                  <div className="space-y-4">
                    <p className="text-[13px] text-muted-foreground/70 leading-relaxed font-medium">
                      Authenticate your eBay seller account to enable direct draft synchronization.
                    </p>
                    <Button onClick={handleConnectEbay} className="w-full h-11 text-[13px] font-bold shadow-lg shadow-primary/10" data-testid="button-connect-ebay">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Authorize eBay Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-start gap-4 p-4 bg-background/50 rounded-xl border border-border/40">
                       <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/10">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                       </div>
                       <div>
                          <p className="text-[13px] font-bold text-foreground/80">Account Linked</p>
                          <p className="text-[12px] text-muted-foreground/60">Your eBay account is ready for synchronization.</p>
                       </div>
                    </div>
                    
                    {existingListing?.status === 'ready' && (
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 rounded-lg text-[12px] font-medium text-blue-600 flex items-center gap-2">
                        <Code className="w-3.5 h-3.5" />
                        This listing version is already synced with eBay.
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={handlePushToEbay} 
                        disabled={isPushingToEbay || !existingListing || existingListing?.status === 'ready'}
                        className="w-full h-12 text-[14px] font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        data-testid="button-push-to-ebay"
                      >
                        {isPushingToEbay ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Synchronizing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Push Draft to eBay
                          </>
                        )}
                      </Button>
                      {!existingListing && (
                        <p className="text-[11px] text-muted-foreground/40 text-center font-bold uppercase tracking-widest">
                          Save draft before pushing
                        </p>
                      )}
                      <Button variant="ghost" size="sm" onClick={handleDisconnectEbay} className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-red-400" data-testid="button-disconnect-ebay">
                        Revoke Access
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
