'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { MagicButton } from './magic-button';

export default function Header() {
  return (
    <header className="container mx-auto py-6 px-4 relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Image
              src="/images/chara-logo.svg"
              alt="CharaCodes Logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-navy-800 to-purple-600 dark:from-purple-400 dark:to-purple-600">
            CharaCodes
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a
            href="#features"
            className="text-navy-800 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-400 transition font-medium relative group"
          >
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a
            href="#subscribe"
            className="text-navy-800 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-400 transition font-medium relative group"
          >
            Subscribe
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a
            href="https://github.com/chara-codes/chara"
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy-800 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-400 transition font-medium relative group"
          >
            GitHub
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
          </a>
          <ThemeToggle />
          <MagicButton />
        </div>
      </div>
    </header>
  );
}