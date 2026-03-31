/**
 * IAAA · PromptChip
 *
 * Clickable example prompt. Calls onSelect with the prompt text.
 * Used in HeroSection to fill the input field.
 *
 * Props: text (string), onSelect (callback)
 * No state. No API calls. Pure presentation + interaction primitive.
 */

interface PromptChipProps {
  text: string
  onSelect: (text: string) => void
}

export default function PromptChip({ text, onSelect }: PromptChipProps) {
  return (
    <button
      onClick={() => onSelect(text)}
      type="button"
      className="
        inline-flex items-center gap-1.5
        px-3 py-1.5
        text-xs font-sans
        text-parchment-dim
        border border-[rgba(196,168,130,0.14)]
        rounded-[2px]
        bg-transparent
        hover:border-[rgba(196,168,130,0.30)]
        hover:text-parchment
        transition-all duration-150
        cursor-pointer
        whitespace-nowrap
      "
      aria-label={`Use example: ${text}`}
    >
      <span
        className="text-gold opacity-60"
        aria-hidden="true"
        style={{ fontSize: '0.6rem' }}
      >
        ◆
      </span>
      {text}
    </button>
  )
}
