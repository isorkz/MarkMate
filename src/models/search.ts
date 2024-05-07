import { Descendant } from "slate";

export type FullSearchResult = {
  filePath: string;
  title: string;
  matchContents: {
    node: Descendant;
    content: string;
  }[];
  // The match score is used to sort the search results
  matchScore: number;
}