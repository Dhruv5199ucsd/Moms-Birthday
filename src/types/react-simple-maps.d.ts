declare module "react-simple-maps" {
    import * as React from "react";
  
    export const ComposableMap: React.FC<
      React.ComponentProps<"svg"> & { projection?: string | ((...args: unknown[]) => unknown) }
    >;
  
    export const Geographies: React.FC<{
      geography: string | object;
      children: (props: { geographies: unknown[] }) => React.ReactNode;
    }>;
  
    export const Geography: React.FC<{
      geography: unknown;
      onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
      onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void;
      onMouseMove?: (event: React.MouseEvent<SVGPathElement>) => void;
      onMouseLeave?: () => void;
      style?: Record<string, unknown>;
    }>;
  }
  