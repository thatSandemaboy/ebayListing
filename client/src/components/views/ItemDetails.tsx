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
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Product Details
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              {item.sku}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Product Name</span>
              <p className="font-medium">{item.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Condition</span>
              <Badge variant="outline" className="bg-background">{item.condition}</Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border">
              <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Brand</p>
                <p className="font-medium text-sm">{item.details.brand}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border">
              <Smartphone className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="font-medium text-sm">{item.details.model}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border">
              <div className="w-4 h-4 rounded-full bg-slate-200 mt-0.5 border" />
              <div>
                <p className="text-xs text-muted-foreground">Color</p>
                <p className="font-medium text-sm">{item.details.color}</p>
              </div>
            </div>

            {item.details.storage && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border">
                <HardDrive className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Storage</p>
                  <p className="font-medium text-sm">{item.details.storage}</p>
                </div>
              </div>
            )}

            {item.details.processor && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border">
                <Cpu className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Processor</p>
                  <p className="font-medium text-sm">{item.details.processor}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
