"use client";

import Image from "next/image";
import { SubscribeForm } from "@/components/subscribe-form";
import {
  SparklesIcon,
  CodeIcon,
  WandIcon,
  ZapIcon,
  ClipboardIcon,
  CheckIcon,
} from "lucide-react";
import { FloatingElements } from "@/components/floating-elements";
import { MagicButton } from "@/components/magic-button";
import { GlowingCard } from "@/components/glowing-card";
import { ParticleBackground } from "@/components/particle-background";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const packageManager =
      document.getElementById("package-manager")?.textContent?.trim() || "bunx";
    const command = `${packageManager} @chara-codes/cli dev`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white dark:bg-navy-950">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-16 md:py-28 overflow-hidden bg-white dark:bg-navy-950">
        <FloatingElements />

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="mb-8 flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-amber-300 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative">
              <Image
                src="/images/chara-logo.svg"
                alt="CharaCodes Logo"
                width={200}
                height={200}
                priority
                className="object-contain animate-float"
              />
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full blur-xl opacity-60 animate-pulse-slow"></div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-navy-800 via-purple-700 to-navy-800 dark:from-purple-400 dark:via-purple-300 dark:to-amber-300 animate-gradient">
              Coding Magic
            </span>
            <br />
            <span className="text-navy-900 dark:text-white">Powered by AI</span>
          </h1>

          <p className="text-xl md:text-2xl text-navy-700 dark:text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            CharaCodes transforms your design dreams into reality with AI
            wizardry, helping frontend developers conjure production-ready code
            in seconds.
          </p>

          <div className="inline-block relative mb-12 group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full blur opacity-70 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 px-6 py-3 rounded-full font-bold text-lg border border-amber-300 shadow-lg">
              <span className="animate-pulse-slow inline-block mr-2">✨</span>
              Currently Brewing Our Magic
              <span className="animate-pulse-slow inline-block ml-2">✨</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="#subscribe"
              className="group relative px-8 py-4 overflow-hidden rounded-xl bg-gradient-to-r from-navy-800 to-purple-700 text-white font-bold text-lg shadow-xl transition-all duration-300 hover:shadow-purple-500/20 hover:scale-105"
            >
              <span className="relative z-10">Get Early Access</span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-navy-700 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="absolute top-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full blur-xl group-hover:animate-pulse-slow"></span>
              <span className="absolute bottom-0 right-0 w-20 h-20 bg-purple-300 opacity-10 rounded-full blur-xl group-hover:animate-pulse-slow"></span>
            </a>
            <a
              href="#features"
              className="group relative px-8 py-4 overflow-hidden rounded-xl bg-white text-navy-800 font-bold text-lg border border-navy-100 shadow-lg transition-all duration-300 hover:shadow-amber-500/20 hover:scale-105 dark:bg-navy-800 dark:text-white dark:border-navy-700"
            >
              <span className="relative z-10">Discover Features</span>
              <span className="absolute inset-0 bg-gradient-to-r from-amber-50 to-purple-50 dark:from-navy-700 dark:to-purple-900 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="absolute top-0 left-0 w-20 h-20 bg-amber-300 dark:bg-amber-500 opacity-5 rounded-full blur-xl group-hover:animate-pulse-slow"></span>
            </a>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent dark:from-navy-950 dark:to-transparent"></div>
      </section>

      {/* Code Preview Section */}
      <section className="py-20 relative bg-white dark:bg-navy-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="relative">
                {/* Replace the existing tab buttons with this segmented control */}
                <div className="absolute top-0 right-0 z-10 translate-y-[-100%]">
                  <div className="inline-flex p-1 bg-navy-800/50 backdrop-blur-sm rounded-t-lg shadow-lg">
                    {[
                      {
                        value: "npx",
                        label: "NPM",
                        color: "from-purple-500 to-purple-700",
                      },
                      {
                        value: "bunx",
                        label: "BUN",
                        color: "from-amber-500 to-amber-600",
                      },
                      {
                        value: "pnpm dlx",
                        label: "PNPM",
                        color: "from-navy-600 to-navy-800",
                      },
                    ].map((option, index) => (
                      <button
                        key={option.value}
                        className={`px-3 py-1.5 text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                          index === 1
                            ? "bg-gradient-to-r " +
                              option.color +
                              " text-white rounded-md shadow-inner"
                            : "text-white/80 hover:text-white hover:bg-white/10 rounded-md"
                        }`}
                        onClick={() => {
                          const el = document.getElementById("package-manager");
                          if (el) el.textContent = option.value;

                          // Update active state visually
                          const buttons = document.querySelectorAll(
                            "[data-segment-button]",
                          );
                          buttons.forEach((btn, i) => {
                            if (i === index) {
                              btn.classList.add(
                                "bg-gradient-to-r",
                                ...option.color.split(" "),
                                "text-white",
                                "shadow-inner",
                              );
                              btn.classList.remove(
                                "text-white/80",
                                "hover:bg-white/10",
                              );
                            } else {
                              btn.classList.remove(
                                "bg-gradient-to-r",
                                ...option.color.split(" "),
                                "text-white",
                                "shadow-inner",
                              );
                              btn.classList.add(
                                "text-white/80",
                                "hover:bg-white/10",
                              );
                            }
                          });
                        }}
                        data-segment-button
                      >
                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                          {option.label[0]}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <pre className="bg-navy-900 text-white p-6 pt-10 rounded-2xl shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 overflow-x-auto relative">
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors duration-200"
                    aria-label="Copy command to clipboard"
                  >
                    {copied ? (
                      <CheckIcon className="w-4 h-4 text-green-400" />
                    ) : (
                      <ClipboardIcon className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <code className="text-sm md:text-base font-mono flex flex-col">
                    <div className="flex items-center">
                      <span className="text-green-400 mr-2">$</span>
                      <span id="package-manager" className="text-amber-300">
                        bunx
                      </span>
                      <span className="text-white"> @chara-codes/cli dev</span>
                    </div>
                  </code>
                </pre>
              </div>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 dark:text-white mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-navy-800 dark:from-purple-400 dark:to-amber-300">
                  AI That Understands Design
                </span>
              </h2>
              <p className="text-lg text-navy-700 dark:text-purple-100 mb-6 leading-relaxed">
                Our magical AI doesn't just convert pixels to code—it
                understands design intent, component relationships, and frontend
                best practices.
              </p>
              <ul className="space-y-4">
                {[
                  {
                    icon: <CodeIcon className="w-5 h-5 text-purple-600" />,
                    text: "Generates clean, semantic HTML and CSS",
                  },
                  {
                    icon: <WandIcon className="w-5 h-5 text-purple-600" />,
                    text: "Creates responsive layouts automatically",
                  },
                  {
                    icon: <ZapIcon className="w-5 h-5 text-purple-600" />,
                    text: "Optimizes for performance and accessibility",
                  },
                  {
                    icon: <SparklesIcon className="w-5 h-5 text-purple-600" />,
                    text: "Adapts to your preferred framework",
                  },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-purple-100 dark:bg-purple-900/50 p-1.5 rounded-full">
                      {item.icon}
                    </div>
                    <span className="text-navy-800 dark:text-purple-100">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-b from-white to-purple-50 dark:from-navy-950 dark:to-navy-900 relative"
      >
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent dark:from-navy-950 dark:to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="inline-block text-3xl md:text-5xl font-bold text-navy-900 dark:text-white mb-4 relative">
              <span className="relative z-10">Magical Features</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 10"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0,5 Q50,9 100,5 T200,5"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
              </svg>
            </h2>
            <p className="text-xl text-navy-700 dark:text-purple-100 max-w-2xl mx-auto">
              Discover the enchanting capabilities that will transform your
              frontend development workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Design to Code",
                description:
                  "Transform Figma, Sketch, or any design into production-ready React, Vue, or HTML/CSS.",
                icon: <CodeIcon className="w-6 h-6 text-white" />,
                gradient: "from-purple-500 to-purple-700",
              },
              {
                title: "Component Magic",
                description:
                  "Automatically identify and extract reusable components from your designs.",
                icon: <WandIcon className="w-6 h-6 text-white" />,
                gradient: "from-amber-500 to-amber-700",
              },
              {
                title: "Responsive Spells",
                description:
                  "Generate fully responsive layouts that work perfectly across all devices.",
                icon: <ZapIcon className="w-6 h-6 text-white" />,
                gradient: "from-navy-600 to-navy-800",
              },
              {
                title: "Animation Potions",
                description:
                  "Add delightful animations and transitions with our AI-powered suggestions.",
                icon: <SparklesIcon className="w-6 h-6 text-white" />,
                gradient: "from-purple-600 to-navy-700",
              },
              {
                title: "Accessibility Charms",
                description:
                  "Ensure your code meets accessibility standards with automatic enhancements.",
                icon: <CodeIcon className="w-6 h-6 text-white" />,
                gradient: "from-amber-600 to-purple-600",
              },
              {
                title: "Framework Flexibility",
                description:
                  "Generate code for your preferred framework, from React to Vue and beyond.",
                icon: <WandIcon className="w-6 h-6 text-white" />,
                gradient: "from-navy-700 to-purple-700",
              },
            ].map((feature, i) => (
              <GlowingCard
                key={i}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                gradient={feature.gradient}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section id="subscribe" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-purple-900 to-navy-900 opacity-95"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="stars-container"></div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="bg-white/10 backdrop-blur-xl p-8 md:p-12 rounded-2xl shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Join Our Magical Journey
              </h2>
              <p className="text-lg text-purple-100 max-w-2xl mx-auto">
                Be among the first wizards to experience CharaCodes when we
                launch. Subscribe now for exclusive early access and magical
                updates.
              </p>
            </div>

            <SubscribeForm />

            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2 text-purple-200 text-sm">
                <SparklesIcon className="w-4 h-4" />
                <span>No spam, only magic in your inbox</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
