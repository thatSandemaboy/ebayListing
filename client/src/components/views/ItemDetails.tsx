import { InventoryItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Tag, Cpu, HardDrive, Smartphone } from 'lucide-react';

interface ItemDetailsProps {
  item: InventoryItem;
}

export function ItemDetails({ item }: ItemDetailsProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em]">Product Name</span>
            <p className="text-[16px] font-semibold text-foreground/90 leading-tight">{item.name}</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5 flex-1 min-w-[120px]">
              <span className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em]">SKU</span>
              <div className="font-mono text-[13px] text-foreground/70 bg-muted/30 px-2.5 py-1 rounded border border-border/40 inline-block">
                {item.sku}
              </div>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[120px]">
              <span className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em]">Condition</span>
              <div>
                <Badge variant="outline" className="bg-background text-[11px] font-bold border-border/60 text-foreground/70 px-2.5">
                  {item.condition}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-muted/[0.15] border border-border/30">
            <Tag className="w-3.5 h-3.5 text-muted-foreground/60 mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Brand</span>
            <span className="text-[13px] font-semibold text-foreground/80">{item.details.brand}</span>
          </div>
          
          <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-muted/[0.15] border border-border/30">
            <Smartphone className="w-3.5 h-3.5 text-muted-foreground/60 mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Model</span>
            <span className="text-[13px] font-semibold text-foreground/80">{item.details.model}</span>
          </div>

          <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-muted/[0.15] border border-border/30">
            <div className="w-3 h-3 rounded-full bg-slate-200 border border-border/50 mb-1" />
            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Color</span>
            <span className="text-[13px] font-semibold text-foreground/80">{item.details.color}</span>
          </div>

          {item.details.storage && (
            <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-muted/[0.15] border border-border/30">
              <HardDrive className="w-3.5 h-3.5 text-muted-foreground/60 mb-1" />
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Storage</span>
              <span className="text-[13px] font-semibold text-foreground/80">{item.details.storage}</span>
            </div>
          )}
        </div>
      </div>
      
      {item.details.processor && (
        <div className="p-4 rounded-xl bg-muted/[0.05] border border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Cpu className="w-4 h-4 text-muted-foreground/50" />
             <span className="text-[12px] font-medium text-muted-foreground/70">Processor Specifications</span>
          </div>
          <span className="text-[12px] font-bold text-foreground/70">{item.details.processor}</span>
        </div>
      )}
    </div>
  );
}
