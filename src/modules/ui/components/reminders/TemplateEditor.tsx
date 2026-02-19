import { useRef, useCallback, useEffect } from 'react'
import { useTheme } from '@/modules/ui/context/ThemeContext'
import { cn } from '@/lib/utils'

const VARIABLE_REGEX = /(\{\{[a-zA-Z]+\}\})/g

export interface TemplateEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  rows?: number
  className?: string
}

export function TemplateEditor({ value, onChange, label, rows = 3, className }: TemplateEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const { colors } = useTheme()

  const buildHTML = useCallback((template: string): string => {
    const parts = template.split(VARIABLE_REGEX)
    return parts.map(part => {
      const match = /^\{\{([a-zA-Z]+)\}\}$/.exec(part)
      if (match) {
        const varName = match[1]
        return `<span contenteditable="false" data-variable="${varName}" style="display:inline-block;background:${colors.accentColor};color:${colors.textOnPrimary};padding:1px 6px;border-radius:6px;font-size:0.8125rem;font-weight:600;margin:0 1px;border:1.5px solid ${colors.accentColorDark};user-select:none;pointer-events:none;">\u200B{{${varName}}}\u200B</span>`
      }
      return part
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
    }).join('')
  }, [colors])

  const readContent = useCallback((): string => {
    if (!editorRef.current) return value
    let result = ''
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += (node.textContent || '').replace(/\u200B/g, '')
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el.dataset.variable) {
          result += `{{${el.dataset.variable}}}`
        } else if (el.tagName === 'BR') {
          result += '\n'
        } else if (el.tagName === 'DIV' && result.length > 0 && !result.endsWith('\n')) {
          result += '\n'
          el.childNodes.forEach(walk)
        } else {
          el.childNodes.forEach(walk)
        }
      }
    }
    editorRef.current.childNodes.forEach(walk)
    return result
  }, [value])

  useEffect(() => {
    if (!editorRef.current) return
    const currentContent = readContent()
    if (currentContent !== value) {
      editorRef.current.innerHTML = buildHTML(value)
    }
  }, [value, buildHTML, readContent])

  const handleInput = useCallback(() => {
    const newValue = readContent()
    onChange(newValue)
  }, [readContent, onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  const minHeight = `${rows * 1.5 + 0.75}rem`

  return (
    <div className={cn(className)}>
      {label && (
        <label className="mb-1 block text-sm font-semibold text-[#1e293b]">
          {label}
        </label>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className={cn(
          'block w-full rounded-xl border-2 border-[#1e293b] bg-white px-3 py-2',
          'text-[#334155] text-sm leading-relaxed',
          'focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5',
          'transition-all duration-150',
          'overflow-y-auto whitespace-pre-wrap break-words'
        )}
        style={{ minHeight }}
        role="textbox"
        aria-label={label}
        aria-multiline="true"
      />
    </div>
  )
}
