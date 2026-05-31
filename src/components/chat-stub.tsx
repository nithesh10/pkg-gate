"use client";

import { useChat } from "@ai-sdk/react";

export function ChatStub() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <div className="border rounded-lg p-4 min-h-[200px] bg-white/5">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500">Ask anything to test the AI SDK stub.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="mb-2 text-sm">
            <strong>{m.role}: </strong>
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-foreground text-background px-4 py-2 text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
