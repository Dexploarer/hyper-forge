import React, { useState } from "react";
import {
  Send,
  Box,
  User,
  Flag,
  MessageSquare,
  Book,
  Music,
  Sparkles,
  Twitter,
  MessageCircle,
  Github,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function LandingPage() {
  const [inputValue, setInputValue] = useState("");
  const { login } = useAuth();

  const handleInputSubmit = async () => {
    if (inputValue.trim()) {
      // Show Privy login modal
      await login();
      // After successful login, App.tsx will automatically show the main app
    }
  };

  const tools = [
    {
      id: "3d-model",
      icon: Box,
      title: "3D Model",
      description: "Generate 3D assets, items, and avatars",
    },
    {
      id: "npc",
      icon: User,
      title: "NPC",
      description: "Create NPCs with personality and dialogue",
    },
    {
      id: "quest",
      icon: Flag,
      title: "Quest",
      description: "Design quests with objectives and rewards",
    },
    {
      id: "dialogue",
      icon: MessageSquare,
      title: "Dialogue",
      description: "Generate branching conversation trees",
    },
    {
      id: "lore",
      icon: Book,
      title: "Lore",
      description: "Build world lore and story content",
    },
    {
      id: "audio",
      icon: Music,
      title: "Audio",
      description: "Generate music and sound effects",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col relative overflow-hidden">
      {/* Hex-style grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Header Navigation */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/Untitled%20design%20(3)/1.png"
            alt="Asset Forge Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="text-lg font-semibold text-text-primary">
            Asset Forge
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <a
            href="/docs/quickstart.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            Docs
          </a>
          <a
            href="https://x.com/hyperscapeai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="X (Twitter)"
            title="Follow us on X"
          >
            <Twitter size={18} />
          </a>
          <a
            href="https://farcaster.xyz/~/channel/hyperscape"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Farcaster"
            title="Join our Farcaster channel"
          >
            <MessageCircle size={18} />
          </a>
          <a
            href="https://github.com/HyperscapeAI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="GitHub"
            title="View on GitHub"
          >
            <Github size={18} />
          </a>
          <a
            href="https://discord.gg/GdgJmmXp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Discord"
            title="Join our Discord"
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.25-.444.583-.608.856a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-.856.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C2.4 6.166 1.73 7.965 1.43 9.8a.082.082 0 0 0 .031.084 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 13.09 13.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.715 13.715 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.97 12.97 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.084c-.332-1.92-1.03-3.76-2.256-5.4a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>

          {/* Login Button */}
          <button
            onClick={async () => await login()}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 text-sm"
          >
            Login
          </button>
        </nav>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Title Section - Hex style */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight leading-tight gradient-text-primary">
              What would you like to create?
            </h1>
          </div>
          <p className="text-xl text-text-secondary font-normal max-w-2xl mx-auto">
            Choose a tool below or describe what you want to generate
          </p>
        </div>

        {/* Input Field */}
        <div className="w-full max-w-2xl mb-12">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInputSubmit();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full px-6 py-4 bg-bg-secondary border border-border-primary rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-lg"
            />
            <button
              type="submit"
              className="absolute right-2 p-3 bg-primary rounded-full hover:bg-primary/90 transition-colors text-white"
              aria-label="Submit"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        {/* Free VRM Converter Banner */}
        <div className="w-full max-w-5xl mb-8">
          <a
            href="/vrm-converter"
            className="block bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/30 rounded-xl p-6 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Box className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    Free VRM Converter
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Convert your GLB/GLTF character models to VRM format - no
                    login required
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-white font-medium">
                Try Now
                <Send size={16} />
              </div>
            </div>
          </a>
        </div>

        {/* Tool Cards Grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className="group relative bg-bg-secondary border border-border-primary rounded-xl p-6 hover:border-primary transition-all duration-200 text-left hover:shadow-lg micro-card-interactive"
                onClick={async () => {
                  // Show Privy login modal - app will automatically show generation page after login
                  await login();
                  // After successful login, App.tsx will automatically show the main app
                }}
              >
                <div className="flex flex-col items-start space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {tool.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-text-tertiary text-sm">
            Powered by AI • Simply describe what you need or select a tool above
          </p>
        </div>
      </footer>
    </div>
  );
}
