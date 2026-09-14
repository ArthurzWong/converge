import type { Mode, Story } from "../types";
import { uid } from "../id";
import { LocalProvider } from "./local";
import { OpenAIProvider } from "./openai";
import type { AIProvider } from "./provider";

export function getProvider(): AIProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return new OpenAIProvider({ apiKey, baseUrl: process.env.OPENAI_BASE_URL, model: process.env.OPENAI_MODEL });
  }
  return new LocalProvider();
}

export const localProvider = new LocalProvider();

/** Full pipeline: INPUT → UNDERSTAND → STRUCTURE → STORY/VISUALIZE → ACTION. */
export async function converge(text: string, mode: Mode, provider: AIProvider = getProvider()): Promise<Story> {
  const run = async (p: AIProvider): Promise<Story> => {
    const analysis = await p.analyze({ text, mode });
    const [logic, scenes, actions] = await Promise.all([
      p.generateStory(analysis, mode),
      p.generateScenes(analysis, mode),
      p.generateActions(analysis, mode),
    ]);
    return {
      id: uid("story"),
      createdAt: new Date().toISOString(),
      mode,
      input: text,
      analysis: { ...analysis, actions },
      scenes,
      logic,
      provider: p.name,
    };
  };
  try {
    return await run(provider);
  } catch (err) {
    if (provider.name === localProvider.name) throw err;
    console.error("[converge] hosted provider failed, falling back to local engine:", err);
    const story = await run(localProvider);
    return { ...story, provider: `${localProvider.name} (fallback)` };
  }
}
