import { Descendant, Node, Element as SlateElement } from "slate"
import { FileTreeNode } from "../../models/FileTree"
import { markdownSourceToMEditorNodes } from "../../components/editor/slate/parser/ParseMarkdownSourceToSlateNodes"
import { getFileName } from "../common"
import { FullSearchResult } from "../../models/Search"

const searchTypes = ['paragraph', 'table-cell', 'code-line', 'head']

const computeMatchScoreByTitle = (title: string, searchKeyWords: string): number => {
  const titleLowerCase = title.toLowerCase()
  if (titleLowerCase === searchKeyWords) {
    return 10000
  }
  if (titleLowerCase.startsWith(searchKeyWords)) {
    return 5000
  }
  if (titleLowerCase.includes(searchKeyWords)) {
    return 1000
  }
  return 0
}

const searchFile = (fileId: string, filePath: string, slateNodes: Descendant[], searchText: string): FullSearchResult | undefined => {
  let matchContents: {
    node: Descendant;
    content: string;
  }[] = []
  const searchKeyWords = searchText.toLowerCase().trim()
  const title = getFileName(filePath)
  let matchCount = 0
  let matchScore = computeMatchScoreByTitle(title, searchKeyWords)
  slateNodes.forEach(node => {
    if (SlateElement.isElement(node) && searchTypes.includes(node.type)) {
      const text = Node.string(node).toLowerCase()
      if (text.includes(searchKeyWords)) {
        matchCount += 1
        matchContents.push({
          node: node,
          // $&: The matched substring.
          content: text.replaceAll(searchKeyWords, '<span class="text-sky-500">$&</span>'),
        })
      }
    }
  });

  matchScore = matchScore + matchCount
  if (matchScore === 0) {
    return undefined
  }

  return {
    fileId: fileId,
    filePath: filePath,
    title: title,
    matchContents: matchContents,
    matchScore: matchScore,
  }
}

const fullSearchOnFileTree = async (slateNodesCache: Map<string, Descendant[]>, node: FileTreeNode | undefined, searchText: string, searchResults: FullSearchResult[]) => {
  if (!node) {
    return
  }

  if (node.children) {
    for (const child of node.children) {
      await fullSearchOnFileTree(slateNodesCache, child, searchText, searchResults)
    }
  } else {
    let slateNodes = slateNodesCache.get(node.path)
    if (!slateNodes) {
      const data: string = await new Promise((resolve, reject) => {
        window.api.readFile(node.path, (error: any, data: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      });
      slateNodes = markdownSourceToMEditorNodes(data)
      if (!slateNodes) {
        throw new Error('Failed to parse markdown source to slate nodes.')
      }
      slateNodesCache.set(node.path, slateNodes);
    }
    const res = searchFile(node.id, node.path, slateNodes, searchText)
    if (res) searchResults.push(res)
  }
}

export class FullSearchUtils {
  static fullSearch = async (slateNodesCache: Map<string, Descendant[]>, treeNode: FileTreeNode, searchText: string): Promise<FullSearchResult[]> => {
    let searchResults: FullSearchResult[] = []
    await fullSearchOnFileTree(slateNodesCache, treeNode, searchText, searchResults)
    return searchResults
  }
}