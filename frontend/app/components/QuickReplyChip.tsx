interface QuickReplyChipProps {
  text: string;
  onClick: () => void;
}

export function QuickReplyChip({ text, onClick }: QuickReplyChipProps) {
  return (
    <button
      onClick={onClick}
      className="inline-block px-4 py-2 rounded-full bg-white border-2 border-wti-teal text-wti-dark-teal hover:bg-wti-teal hover:text-white transition-all duration-200 active:scale-95 min-h-[44px]"
    >
      {text}
    </button>
  );
}