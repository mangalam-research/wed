import "rangy";

declare module "rangy" {
  interface WordOptions {
    includeTrailingSpace?: boolean;
    wordRegex?: RegExp;
    // tokenizer?: ??? not documented yet, so....
  }

  interface CharacterOptions {
    includeBlockContentTrailingSpace?: boolean;
    includeSpaceBeforeBr?: boolean;
    includePreLineTrailingSpace?: boolean;
    ignoreCharacters?: string;
  }

  interface FindTextOptions {
    caseSensitive?: boolean;
    withinRange?: Range | null;
    wholeWordsOnly?: boolean;
    wrap? : boolean;
    direction?: Direction;
    wordOptions?: WordOptions;
    characterOptions?: CharacterOptions;
  }

  interface RangyRange {
    findText(searchTerm: string | RegExp, options?: FindTextOptions): boolean;
  }
}
