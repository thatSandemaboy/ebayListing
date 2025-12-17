import { InventoryItem } from '@/lib/mockData';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Download, ExternalLink, FileJson, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ExportViewProps {
  item: InventoryItem;
}

export function ExportView({ item }: ExportViewProps) {
  const { updateItemStatus } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(item.status === 'completed');

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExported(true);
      updateItemStatus(item.id, 'completed');
    }, 1500);
  };

  if (!item.listing) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="p-4 rounded-full bg-amber-100 text-amber-600 mb-4">
          <FileJson className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Listing Not Ready</h3>
        <p className="text-muted-foreground max-w-sm">
          You need to generate and approve a listing description before you can export this item.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Ready to Export</h2>
        <p className="text-muted-foreground">
          This item is ready to be pushed to eBay. Review the summary below.
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-md bg-muted overflow-hidden shrink-0">
              {item.photos[0] && <img src={item.photos[0]} className="w-full h-full object-cover" />}
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold line-clamp-1">{item.listing.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.listing.description}</p>
              <div className="pt-2 font-mono font-medium text-lg">${item.listing.price}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {exported ? (
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">Export Successful!</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">Item marked as completed and CSV generated.</p>
            </div>
            <Button variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-100">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
          
          <div className="flex justify-center gap-4 pt-4">
            <Button variant="ghost">Return to Inventory</Button>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on eBay
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Exporting...
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5 mr-2" /> Export to eBay
              </>
            )}
          </Button>
          <Button variant="outline" className="w-full">
            Download CSV Only
          </Button>
        </div>
      )}
    </div>
  );
}
