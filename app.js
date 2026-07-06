import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

// ---------------- Tool ----------------

async function webSearch({ query }) {
  console.log("Searching:", query);

  const response = await tvly.search(query);

  // Keep only the first 2 results
  const finalResult = response.results
    .slice(0, 2)
    .map(result => {
      return `
Title: ${result.title}
URL: ${result.url}
Content: ${result.content.substring(0, 300)}
`;
    })
    .join("\n\n");

  return finalResult;
}

// ---------------- Main ----------------

async function main() {
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful AI assistant. If the user asks about recent or realtime information, use the available tools.",
    },
    {
      role: "user",
      content: "When was iPhone 16 launched?",
    },
  ];

  // First LLM call
  const firstResponse = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages,
    temperature: 0,
    tool_choice: "auto",
    tools: [
      {
        type: "function",
        function: {
          name: "webSearch",
          description: "Search the web for latest information.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query",
              },
            },
            required: ["query"],
          },
        },
      },
    ],
  });

  const assistantMessage = firstResponse.choices[0].message;

  console.log("\nAssistant Response:");
  console.log(assistantMessage);

  // If no tool call
  if (!assistantMessage.tool_calls) {
    console.log("\nFinal Answer:");
    console.log(assistantMessage.content);
    return;
  }

  messages.push(assistantMessage);

  // Execute all tools
  for (const toolCall of assistantMessage.tool_calls) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    let toolResult = "";

    switch (functionName) {
      case "webSearch":
        toolResult = await webSearch(args);
        break;

      default:
        toolResult = "Unknown tool.";
    }

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: toolResult,
    });
  }

  // Second LLM call
  const finalResponse = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages,
    temperature: 0,
  });

  console.log("\n==============================");
  console.log("FINAL ANSWER");
  console.log("==============================");

  console.log(finalResponse.choices[0].message.content);
}

main().catch(console.error);