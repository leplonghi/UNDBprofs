// src/components/layout/AppLogo.tsx
'use client';

import React from 'react';

type AppLogoProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function AppLogo({
  className,
  width = 320,
  height = 96,
}: AppLogoProps) {
  return (
    <img
      src="https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.firebasestorage.app/o/Branding%2FPublic%2Flogoundbprofs.png?alt=media&token=f65c6cd0-b615-40d5-b9ef-01f8a4603c2f"
      alt="UNDBProf Logo"
      className={className ?? 'h-auto w-full max-w-[280px]'}
      width={width}
      height={height}
    />
  );
}
