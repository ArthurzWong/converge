import type { Action, Analysis, LogicStep, Mode, Scene } from "../types";

export interface AnalyzeInput {
  text: string;
  mode: Mode;
}

/**
 * Provider-agnostic reasoning interface. Every step is independent so a
 * future provider (or a human) can replace any stage of the pipeline.
 */
export interface AIProvider {
  readonly name: string;
  analyze(input: AnalyzeInput): Promise<Analysis>;
  generateStory(analysis: Analysis, mode: Mode): Promise<LogicStep[]>;
  generateScenes(analysis: Analysis, mode: Mode, count?: number): Promise<Scene[]>;
  generateActions(analysis: Analysis, mode: Mode): Promise<Action[]>;
  regenerateScene(analysis: Analysis, mode: Mode, scene: Scene, instruction?: string): Promise<Scene>;
}
