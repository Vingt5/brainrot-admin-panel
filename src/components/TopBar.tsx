import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface TopBarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function TopBar({ title, subtitle, children }: TopBarProps) {
  return (
    <header className="h-14 shrink-0 flex items-center gap-4 border-b border-border px-4 bg-card/50">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {children && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
