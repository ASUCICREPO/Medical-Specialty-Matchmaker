import { Message } from './ChatBot';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isBot 
          ? 'bg-gray-100 text-gray-900' 
          : 'bg-blue-600 text-white'
      }`}>
        <p className="text-sm font-medium">{message.text}</p>
        <p className={`text-xs mt-1 ${
          isBot ? 'text-gray-600' : 'text-blue-100'
        }`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}