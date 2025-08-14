"use client";

import * as React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

export type RSMGeo = { rsmKey?: string; id?: string; properties: { name?: string } };
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function WorldMap(props: {
  onCountryClick: (geo: RSMGeo) => void;
  onHover: (name: string, x: number, y: number) => void;
  onLeave: () => void;
}) {
  const { onCountryClick, onHover, onLeave } = props;

  return (
    <ComposableMap projection="geoNaturalEarth1" style={{ width: "100%", height: "520px" }}>
      <Geographies geography={GEO_URL}>
        {({ geographies }) => (
          <>
            {(geographies as RSMGeo[]).map((geo) => (
              <Geography
                key={geo.rsmKey ?? String(geo.id ?? Math.random())}
                geography={geo}
                onClick={() => onCountryClick(geo)}
                onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => {
                  onHover(geo.properties.name ?? "", e.clientX, e.clientY);
                }}
                onMouseMove={(e: React.MouseEvent<SVGPathElement>) => onHover("", e.clientX, e.clientY)}
                onMouseLeave={onLeave}
                style={{
                  default: { fill: "#e8ecff", outline: "none", stroke: "#ffffff", strokeWidth: 0.5 },
                  hover:   { fill: "#c7d2fe", outline: "none" },
                  pressed: { fill: "#a5b4fc", outline: "none" }
                }}
              />
            ))}
          </>
        )}
      </Geographies>
    </ComposableMap>
  );
}
