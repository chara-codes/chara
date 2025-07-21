'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white py-8 border-t border-purple-800/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
            <div className="relative">
              <Image
                src="/images/chara-logo.svg"
                alt="CharaCodes Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-amber-300">
              CharaCodes
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/chara-codes/chara"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-300 hover:text-purple-100 transition-colors duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span>GitHub</span>
            </a>
            <div className="text-purple-300 text-sm">
              © {new Date().getFullYear()} CharaCodes. Crafting code magic.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}