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
    <div className="w-80 border-r bg-sidebar flex flex-col h-full">
      <div className="p-4 space-y-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Inventory
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            className={cn("h-8 w-8", isRefreshing && "animate-spin")}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search SKU or Name..." 
            className="pl-9 bg-background/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {(['all', 'ready', 'in_progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 text-xs font-medium py-1.5 rounded-md transition-all capitalize",
                filter === f 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:bg-background/50"
              )}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => selectItem(item.id)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md group relative overflow-hidden",
                selectedItemId === item.id
                  ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
                  : "bg-card border-border hover:border-primary/50"
              )}
            >
              {selectedItemId === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              
              <div className="flex justify-between items-start mb-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-5 font-normal border-0",
                    item.status === 'ready' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                    item.status === 'in_progress' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                    item.status === 'completed' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                  )}
                >
                  {item.status === 'ready' && 'Ready'}
                  {item.status === 'in_progress' && 'In Progress'}
                  {item.status === 'completed' && 'Completed'}
                </Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(item.lastUpdated), { addSuffix: true })}
                </span>
              </div>
              
              <h3 className="text-sm font-medium leading-tight mb-1 line-clamp-2">
                {item.name}
              </h3>
              
              <p className="text-xs text-muted-foreground font-mono">
                {item.sku}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {item.photos.slice(0, 3).map((photo, i) => (
                    <div key={i} className="w-5 h-5 rounded-full ring-1 ring-background overflow-hidden bg-muted">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {item.photos.length > 3 && (
                    <div className="w-5 h-5 rounded-full ring-1 ring-background bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                      +{item.photos.length - 3}
                    </div>
                  )}
                </div>
                
                {item.status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No items found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
