interface ChatBubbleProps {
  message: string;
  isUser?: boolean;
  timestamp?: string;
}

export function ChatBubble({ message, isUser = false, timestamp }: ChatBubbleProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-wti-red text-white rounded-br-md'
              : 'bg-white text-wti-navy border border-gray-200 rounded-bl-md'
          }`}
        >
          <p className="whitespace-pre-wrap">{message}</p>
        </div>
        {timestamp && (
          <p className={`text-xs text-gray-500 mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}