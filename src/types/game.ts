export type RelationshipStatus =
  | "casual_interest"
  | "romantic_interest"
  | "mutually_acknowledged"
  | "exclusive";

export interface CharacterState {
  attraction: number;
  trust: number;
  status: RelationshipStatus;
}

export interface GameState {
  currentSceneId: string;
  protagonistName: string;
  characters: {
    jake: CharacterState;
    ethan: CharacterState;
    ryan: CharacterState;
  };
  flags: Record<string, boolean>;
  history: string[];
}
