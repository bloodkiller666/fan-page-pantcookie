'use client';
import React, { createContext, useContext, useRef, ReactNode, useEffect, useState } from 'react';
import { useRouter as useAppRouter, usePathname } from 'next/navigation';

interface TransitionContextType {
  revealerRef: React.RefObject<any>;
  transitionTo: (href: string) => Promise<void>;
  isManualTransition: React.RefObject<boolean>;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useAppRouter();
  const pathname = usePathname();
  
  const revealerRef = useRef<any>(null);
  const isManualTransition = useRef(false);

  const transitionTo = async (href: string) => {
    if (href === pathname || isManualTransition.current) return;

    if (revealerRef.current) {
      isManualTransition.current = true;
      await revealerRef.current.animateIn();
      
      router.push(href);
      
      setTimeout(() => {
        isManualTransition.current = false;
      }, 500);
    } else {
      router.push(href);
    }
  };

  return (
    <TransitionContext.Provider value={{ revealerRef, transitionTo, isManualTransition }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (context === undefined) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
}
