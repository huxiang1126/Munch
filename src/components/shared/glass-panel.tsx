import * as React from "react";

import { cn } from "@/lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: number;
  children: React.ReactNode;
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ blur = 20, children, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(className)}
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          border: "1px solid rgba(255,255,255,0.1)",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassPanel.displayName = "GlassPanel";
