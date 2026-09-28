import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2,
  HelpCircle,
  Compass,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import { useOperational, type UserRole } from '@/context/OperationalContext'
import {
  sendChatMessage,
  type ChatMessage,
  type ChatNavigationAction,
  VERIFIED_ROUTES,
} from '@/services/chatService'
import { cn } from '@/lib/utils'

// Initial suggested starter questions
const STARTER_QUESTIONS = [
  'How do I use PolarOps?',
  'What can I do in my role?',
  'How do I manage inventory?',
  'How does AI demand prediction work?',
  'How do I manage an expedition?',
  'How do I use Mission Control?',
]

// Quick Action Chips
const QUICK_ACTIONS = [
  { label: 'Explain this page', query: 'Explain this page', icon: Info },
  { label: 'Explain my role', query: 'What does my role allow me to do?', icon: Shield },
  { label: 'Explain AI prediction', query: 'How does AI demand prediction work?', icon: Cpu },
  { label: 'Application guide', query: 'Teach me how to use PolarOps.', icon: BookOpen },
  { label: 'Show me where to go', query: 'Where can I find inventory, cargo, and weather?', icon: Compass },
]

export const PolarOpsAssistant: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentRole, opconLevel, unreadAlertCount, theme } = useOperational()

  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-welcome',
      sender: 'assistant',
      text: `### Welcome to PolarOps Assistant

I am your **operational copilot and interactive product guide**. I can help you navigate modules, understand your role permissions (**${currentRole}**), explain the **AI Demand Prediction** ML engine, or walk you through Antarctic logistics workflows.

Click a suggested question below or ask me anything about the application.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
      actions: [
        { label: 'Explain this page', path: location.pathname, description: 'Get breakdown of current page' },
        { label: 'Teach me PolarOps', path: '/dashboard', description: 'Step-by-step onboarding guide' },
      ],
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      inputRef.current?.focus()
    }
  }, [isOpen, messages, isLoading])

  // Global ESC key listener to close assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Handle sending a message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim()
    if (!query || isLoading) return

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    if (!textToSend) {
      setInputValue('')
    }
    setIsLoading(true)

    try {
      const response = await sendChatMessage(
        query,
        {
          currentRole,
          pathname: location.pathname,
          opconLevel,
          unreadAlerts: unreadAlertCount,
          theme,
        },
        [...messages, userMessage]
      )

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: response.actions,
        category: response.category,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `PolarOps Assistant is temporarily unavailable. You can continue using the application normally.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle clicking navigation action
  const handleNavigate = (path: string) => {
    if (path) {
      navigate(path)
    }
  }

  // Clear chat history
  const handleClearHistory = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        text: `Chat history cleared. How can I help you operate **PolarOps** today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'general',
      },
    ])
  }

  // Render formatted markdown text cleanly
  const renderFormattedText = (rawText: string) => {
    // Split into lines
    const lines = rawText.split('\n')
    const elements: React.ReactNode[] = []

    let inCodeBlock = false
    let codeContent: string[] = []

    lines.forEach((line, index) => {
      // Code block start/end
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div
              key={`code-${index}`}
              className="my-2 p-2.5 bg-slate-900 text-slate-100 dark:bg-[#070B0D] dark:text-[#FFD21C] rounded font-mono text-[11px] overflow-x-auto border border-slate-700 dark:border-[#263238]"
            >
              {codeContent.join('\n')}
            </div>
          )
          codeContent = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeContent.push(line)
        return
      }

      // Headings
      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={`h3-${index}`}
            className="text-xs font-bold text-slate-900 dark:text-[#F5F7F8] mt-2 mb-1 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#02457A] dark:bg-[#FFD21C]" />
            {line.replace('### ', '')}
          </h3>
        )
        return
      }

      if (line.startsWith('#### ')) {
        elements.push(
          <h4
            key={`h4-${index}`}
            className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#A7B2B8] mt-2 mb-0.5"
          >
            {line.replace('#### ', '')}
          </h4>
        )
        return
      }

      // Horizontal separator
      if (line.trim() === '---') {
        elements.push(
          <hr key={`hr-${index}`} className="my-2 border-slate-200 dark:border-[#263238]" />
        )
        return
      }

      // Blockquotes / Alerts
      if (line.startsWith('> [!NOTE]') || line.startsWith('> [!IMPORTANT]') || line.startsWith('> [!WARNING]')) {
        return
      }

      if (line.startsWith('> ')) {
        elements.push(
          <div
            key={`bq-${index}`}
            className="my-1.5 pl-2.5 py-1 border-l-2 border-[#02457A] dark:border-[#FFD21C] bg-slate-100/60 dark:bg-[#11191D] rounded-r text-[11px] text-slate-700 dark:text-[#A7B2B8] italic"
          >
            {line.replace('> ', '')}
          </div>
        )
        return
      }

      // Unordered list items
      if (line.startsWith('- ')) {
        const itemContent = line.replace('- ', '')
        // Parse bold tags **text**
        const formatted = parseInlineFormatting(itemContent)
        elements.push(
          <div key={`li-${index}`} className="flex items-start gap-1.5 my-0.5 text-xs text-slate-800 dark:text-[#D6DEE2]">
            <span className="text-[#02457A] dark:text-[#FFD21C] text-[10px] mt-0.5">•</span>
            <span className="flex-1 leading-relaxed">{formatted}</span>
          </div>
        )
        return
      }

      // Empty line
      if (!line.trim()) {
        elements.push(<div key={`sp-${index}`} className="h-1" />)
        return
      }

      // Table line (skip or simple render)
      if (line.startsWith('|')) {
        if (line.includes('---')) return
        const cells = line.split('|').filter((c) => c.trim() !== '')
        elements.push(
          <div
            key={`tbl-${index}`}
            className="grid grid-cols-2 gap-2 text-[11px] py-0.5 border-b border-slate-100 dark:border-[#263238]/60 font-mono"
          >
            <span className="font-bold text-slate-900 dark:text-[#F5F7F8]">{parseInlineFormatting(cells[0] || '')}</span>
            <span className="text-slate-600 dark:text-[#A7B2B8]">{parseInlineFormatting(cells[1] || '')}</span>
          </div>
        )
        return
      }

      // Standard paragraph
      elements.push(
        <p key={`p-${index}`} className="my-0.5 text-xs text-slate-800 dark:text-[#D6DEE2] leading-relaxed">
          {parseInlineFormatting(line)}
        </p>
      )
    })

    return elements
  }

  // Parse inline backticks, bold, and badges
  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1 py-0.5 bg-slate-100 dark:bg-[#11191D] text-[#02457A] dark:text-[#28B6FF] border border-slate-200 dark:border-[#263238] rounded text-[11px] font-mono"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-[#F5F7F8]">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <>
      {/* ========================================================= */}
      {/* 1. FLOATING LAUNCH TRIGGER BUTTON (Bottom-Right)          */}
      {/* ========================================================= */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 select-none pointer-events-none">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-3 py-2.5 sm:px-3.5 sm:py-2.5 rounded-full bg-[#02457A] dark:bg-[#FFD21C] text-white dark:text-[#050708] font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 border border-slate-200 dark:border-[#FFD21C]/60 cursor-pointer group"
            aria-label="Open PolarOps Assistant"
            title="Open PolarOps Help Assistant"
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white dark:text-[#050708]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 dark:bg-[#050708] border border-white dark:border-[#FFD21C]" />
            </div>
            <span className="hidden sm:inline text-xs font-sans tracking-wide">PolarOps Assistant</span>
            <span className="sm:hidden text-xs font-sans tracking-wide font-bold">AI</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. CHAT PANEL (Floating Bottom-Right / Responsive Drawer) */}
      {/* ========================================================= */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50 transition-all duration-200 flex flex-col shadow-2xl border bg-white dark:bg-[#070B0D] border-slate-200 dark:border-[#263238] overflow-hidden',
            isMaximized
              ? 'inset-2 sm:inset-6 md:inset-10 rounded-xl'
              : 'bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-24px)] sm:w-[420px] max-w-full h-[520px] sm:h-[580px] max-h-[calc(100dvh-24px)] rounded-xl'
          )}
          role="dialog"
          aria-labelledby="assistant-title"
        >
          {/* A. HEADER */}
          <div className="px-4 py-3 bg-[#02457A] dark:bg-[#0D1316] text-white flex items-center justify-between border-b border-[#01355F] dark:border-[#263238] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-[#11191D] border border-white/20 dark:border-[#263238] flex items-center justify-center text-white dark:text-[#FFD21C]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div id="assistant-title" className="text-xs font-bold font-sans tracking-tight text-white dark:text-[#F5F7F8] flex items-center gap-1.5">
                  <span>POLAROPS ASSISTANT</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 dark:text-[#16C784] border border-emerald-400/30 text-[9px] font-mono rounded">
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] text-slate-200 dark:text-[#A7B2B8]">
                  How can I help you operate PolarOps?
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 text-white/70 dark:text-[#A7B2B8] hover:text-white dark:hover:text-[#F5F7F8] hover:bg-white/10 dark:hover:bg-[#11191D] rounded transition-colors cursor-pointer"
                title="Clear conversation history"
                aria-label="Clear chat history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="hidden sm:inline-flex p-1.5 text-white/70 dark:text-[#A7B2B8] hover:text-white dark:hover:text-[#F5F7F8] hover:bg-white/10 dark:hover:bg-[#11191D] rounded transition-colors cursor-pointer"
                title={isMaximized ? 'Restore window size' : 'Expand window'}
                aria-label="Toggle full screen"
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/70 dark:text-[#A7B2B8] hover:text-white dark:hover:text-[#F5F7F8] hover:bg-white/10 dark:hover:bg-[#11191D] rounded transition-colors cursor-pointer"
                title="Close assistant (ESC)"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* B. CONTEXT & OPCON STRIP */}
          <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-[#070B0D] border-b border-slate-200 dark:border-[#263238] flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-[#6F7C82] shrink-0 select-none">
            <div className="flex items-center gap-2 truncate">
              <span className="flex items-center gap-1 text-slate-700 dark:text-[#A7B2B8] truncate">
                <Shield className="w-3 h-3 text-[#02457A] dark:text-[#FFD21C]" />
                <strong className="truncate">{currentRole}</strong>
              </span>
              <span>·</span>
              <span className="text-[#02457A] dark:text-[#28B6FF] truncate">{location.pathname}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD21C]" />
              <span className="text-[9px] uppercase font-bold text-slate-700 dark:text-[#F5F7F8]">Grounded Help</span>
            </div>
          </div>

          {/* C. QUICK ACTION CHIPS */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-[#0D1316] border-b border-slate-200 dark:border-[#263238] shrink-0 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(action.query)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-sans font-medium whitespace-nowrap bg-white dark:bg-[#11191D] text-slate-700 dark:text-[#D6DEE2] border border-slate-300 dark:border-[#263238] hover:border-[#02457A] dark:hover:border-[#FFD21C] hover:text-[#02457A] dark:hover:text-[#FFD21C] transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Icon className="w-3 h-3 text-slate-400 dark:text-[#A7B2B8]" />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>

          {/* D. MESSAGES SCROLL CONTAINER */}
          <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto bg-white dark:bg-[#050708] text-slate-900 dark:text-[#F5F7F8]">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant'
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col',
                    isAssistant ? 'items-start' : 'items-end'
                  )}
                >
                  {/* Sender Name & Time */}
                  <div className="flex items-center gap-1.5 px-1 mb-1 text-[10px] font-mono text-slate-400 dark:text-[#6F7C82]">
                    <span>{isAssistant ? 'PolarOps Assistant' : 'You'}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'p-3 rounded-lg text-xs leading-relaxed max-w-[92%] sm:max-w-[88%] border shadow-2xs',
                      isAssistant
                        ? 'bg-slate-50 dark:bg-[#0D1316] text-slate-900 dark:text-[#F5F7F8] border-slate-200 dark:border-[#263238]'
                        : 'bg-[#02457A] dark:bg-[#FFD21C] text-white dark:text-[#050708] border-[#02457A] dark:border-[#FFD21C] font-medium'
                    )}
                  >
                    {isAssistant ? renderFormattedText(msg.text) : <p>{msg.text}</p>}

                    {/* Navigation Action Buttons if provided */}
                    {isAssistant && msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#263238] flex flex-wrap items-center gap-1.5">
                        {msg.actions.map((act, actIdx) => (
                          <button
                            key={actIdx}
                            type="button"
                            onClick={() => handleNavigate(act.path)}
                            className="px-2.5 py-1 rounded bg-white dark:bg-[#11191D] border border-slate-300 dark:border-[#263238] text-[11px] font-bold text-[#02457A] dark:text-[#FFD21C] hover:bg-[#02457A] hover:text-white dark:hover:bg-[#FFD21C] dark:hover:text-[#050708] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                            title={act.description || `Navigate to ${act.label}`}
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 px-1 mb-1 text-[10px] font-mono text-slate-400 dark:text-[#6F7C82]">
                  <span>PolarOps Assistant</span>
                  <span>·</span>
                  <span>Analyzing system context...</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#02457A] dark:bg-[#FFD21C] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#02457A] dark:bg-[#FFD21C] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#02457A] dark:bg-[#FFD21C] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Suggested Questions Grid (If only 1 message) */}
            {messages.length <= 1 && (
              <div className="pt-2 space-y-1.5">
                <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#6F7C82] tracking-wider px-1 font-mono">
                  Suggested Questions
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {STARTER_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      className="px-3 py-2 text-left text-xs bg-slate-50 dark:bg-[#0D1316] hover:bg-slate-100 dark:hover:bg-[#11191D] border border-slate-200 dark:border-[#263238] text-slate-700 dark:text-[#D6DEE2] rounded-md transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span>{q}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 dark:text-[#6F7C82] group-hover:text-[#02457A] dark:group-hover:text-[#FFD21C] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* E. INPUT BAR */}
          <div className="p-3 bg-slate-50 dark:bg-[#0D1316] border-t border-slate-200 dark:border-[#263238] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about inventory ML, role permissions, routes, or pages..."
                className="flex-1 px-3 py-2 bg-white dark:bg-[#050708] border border-slate-300 dark:border-[#263238] rounded-md text-xs text-slate-900 dark:text-[#F5F7F8] placeholder:text-slate-400 dark:placeholder:text-[#6F7C82] focus:outline-none focus:ring-2 focus:ring-[#02457A]/30 dark:focus:ring-[#FFD21C]/30 focus:border-[#02457A] dark:focus:border-[#FFD21C] transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-md bg-[#02457A] dark:bg-[#FFD21C] text-white dark:text-[#050708] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#01355F] dark:hover:bg-[#FFC928] transition-colors font-bold cursor-pointer"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-[#6F7C82] px-1 font-mono">
              <span>Press Enter to send</span>
              <span>PolarOps Operational AI v2.4</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
