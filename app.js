import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function main() {
  const completions = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are a smart personal assistant. When a question requires recent or realtime information, use the available tools.`,
      },
      {
        role: "user",
        content:"When was iPhone 16 launched?",
        //  "When was iPhone 16 launched?"
        // "what is current weather in mumbai?"
      },
    ],
  tools: [
    {
      "type": "function",
      "function": {
        "name": "webSearch",
        "description": "Search the latest information and realtime data on the internet.",
        "parameters": {
          // JSON Schema object
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "The search query to perform search on."
            }
            
          },
          "required": ["query"]
        }
      }
    }
  ],
  tool_choice:'auto',
    
  });

  const toolCalls=completions.choices[0].message.tool_calls

  if(!toolCalls){
    console.log(`Assistant:${completions.choices[0].content}`);
    return;
  }

  for(const tool of toolCalls)
  {
    console.log('tool:',tool);
    const functionName=tool.function.name;
    const functionParams=tool.function.arguments;


    if (functionName===`webSearch`){
      const toolResult= await webSearch(JSON.parse(functionParams))
      console.log("Tool result:",toolResult);

    }
  }


//   console.log(JSON.stringify(completions.choices[0].message,null,2));
}

main();

async function webSearch({query}){
    // here we will do tavily api call
    console.log("Calling web serach...");
    return "iphone was launched on 20 sep 2024";

}