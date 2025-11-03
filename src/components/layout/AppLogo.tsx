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
      src="https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.firebasestorage.app/o/Branding%2Fpublic%2Flogoundbprofs.png?alt=media&token=8658ca45-42bc-43c8-a918-56764fa0f60d"
      alt="UNDB ProfAssist Logo"
      className={className ?? 'h-auto w-full max-w-[280px]'}
      width={width}
      height={height}
    />
  );
}
