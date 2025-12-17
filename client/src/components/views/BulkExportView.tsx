import { InventoryItem } from '@/lib/mockData';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Download, ExternalLink, FileJson, Share2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface BulkExportViewProps {
  selectedIds: Set<string>;
  onClose: () => void;
  onComplete: () => void;
}

export function BulkExportView({ selectedIds, onClose, onComplete }: BulkExportViewProps) {
  const { items, updateItemStatus } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const selectedItems = items.filter(item => selectedIds.has(item.id));
  const readyItems = selectedItems.filter(item => item.listing);
  const notReadyItems = selectedItems.filter(item => !item.listing);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      // Mark all ready items as completed
      readyItems.forEach(item => {
        updateItemStatus(item.id, 'completed');
      });
      setIsExporting(false);
      setExported(true);
      setTimeout(onComplete, 2000); // Auto close after 2s
    }, 2000);
  };

  if (selectedItems.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Bulk Export</h2>
        <p className="text-muted-foreground">
          You are about to export {selectedItems.length} items to eBay.
        </p>
      </div>

      <div className="w-full grid gap-4">
        {readyItems.length > 0 && (
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold">{readyItems.length} Items Ready</h4>
                  <p className="text-sm text-muted-foreground">These items have listings generated and are ready to go.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {notReadyItems.length > 0 && (
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold">{notReadyItems.length} Items Not Ready</h4>
                  <p className="text-sm text-muted-foreground">Missing listing details. These will be skipped.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {exported ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-6 flex flex-col items-center gap-4 w-full text-center"
        >
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 text-lg">Bulk Export Successful!</h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
              {readyItems.length} listings have been pushed to eBay.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-sm pt-4">
          <Button 
            size="lg" 
            className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20"
            onClick={handleExport}
            disabled={isExporting || readyItems.length === 0}
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Processing {readyItems.length} Items...
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5 mr-2" /> Export {readyItems.length} Items
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
