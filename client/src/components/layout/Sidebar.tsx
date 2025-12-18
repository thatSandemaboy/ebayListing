import { useState } from 'react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Package, Search, Filter, RefreshCw, CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function Sidebar() {
  const { items, selectedItemId, selectItem, refreshInventory } = useApp();
  const [filter, setFilter] = useState<'all' | 'ready' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      refreshInventory();
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="w-[320px] border-r bg-sidebar flex flex-col h-full overflow-hidden">
      <div className="p-4 space-y-4 border-b bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[14px] text-foreground/80 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Inventory
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            className={cn("h-7 w-7 text-muted-foreground hover:text-foreground", isRefreshing && "animate-spin")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search SKU or Name..." 
            className="pl-9 h-9 bg-background/50 border-border/50 text-[13px] transition-all focus:bg-background focus:ring-1 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg border border-border/50">
          {(['all', 'ready', 'in_progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all capitalize",
                filter === f 
                  ? "bg-background shadow-sm text-foreground ring-1 ring-border/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => selectItem(item.id)}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-all relative group overflow-hidden border border-transparent",
                selectedItemId === item.id
                  ? "bg-primary/5 border-primary/10 shadow-sm" 
                  : "hover:bg-accent/50 hover:border-border/50"
              )}
            >
              {selectedItemId === item.id && (
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full" />
              )}
              
              <div className="flex justify-between items-start mb-1.5">
                <div className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                  item.status === 'ready' && "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                  item.status === 'in_progress' && "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
                  item.status === 'completed' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
                )}>
                  {item.status.replace('_', ' ')}
                </div>
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 font-medium">
                  {formatDistanceToNow(new Date(item.lastUpdated), { addSuffix: true })}
                </span>
              </div>
              
              <h3 className={cn(
                "text-[13px] font-medium leading-snug mb-1 line-clamp-2 transition-colors",
                selectedItemId === item.id ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
              )}>
                {item.name}
              </h3>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-muted-foreground/60 font-mono tracking-tight">
                  {item.sku}
                </p>
                
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {item.photos.slice(0, 3).map((photo, i) => (
                      <div key={i} className="w-4 h-4 rounded-full ring-2 ring-background overflow-hidden bg-muted border border-border/50">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  {item.status === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shadow-sm" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-12 px-4">
              <Package className="w-8 h-8 text-muted/20 mx-auto mb-3" />
              <p className="text-[13px] text-muted-foreground font-medium">No items found</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">Try adjusting your filters or search</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
  );
}
