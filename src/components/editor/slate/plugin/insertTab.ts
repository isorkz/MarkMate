import { ListItemElement, ParagraphElement } from './../Element';
import { Editor, Transforms, Range, Element as SlateElement, Path, BaseRange } from 'slate'

const insertTabForListItem = (editor: Editor, selection: BaseRange, paragraph: ParagraphElement, path: Path, listItem: ListItemElement, listItemPath: Path) => {
  // If has previous list item, make the current list item a child of the previous list item.
  const prevListItem = Editor.previous(editor, { at: listItemPath })
  if (prevListItem && SlateElement.isElement(prevListItem[0]) && prevListItem[0].type === 'list-item') {
    const previousListItemPath = prevListItem[1]
    // Insert the new list at the end of the previous list item
    const newList: SlateElement = { type: 'list', children: [listItem] };
    const newListPath = [...previousListItemPath, prevListItem[0].children.length];
    Transforms.insertNodes(editor, newList, { at: newListPath });
    Transforms.removeNodes(editor, { at: listItemPath });
    return
  }
}

const insertTabForParagraph = (editor: Editor, selection: BaseRange, paragraph: ParagraphElement, path: Path) => {
  // If has previous list, insert the current paragraph into the list.
  const prevList = Editor.previous(editor, { at: path })
  if (prevList && SlateElement.isElement(prevList[0]) && prevList[0].type === 'list') {
    Transforms.wrapNodes(editor, { type: 'list-item', children: [paragraph] }, { at: path })
    Transforms.moveNodes(editor, { at: path, to: [...prevList[1], prevList[0].children.length] })
    return
  }

  // If has next list, insert the current paragraph into the list.
  const nextList = Editor.next(editor, { at: path })
  if (nextList && SlateElement.isElement(nextList[0]) && nextList[0].type === 'list') {
    Transforms.wrapNodes(editor, { type: 'list-item', children: [paragraph] }, { at: path })
    Transforms.moveNodes(editor, { at: path, to: [...nextList[1], 0] })
    return
  }

  // If has no previous list, convert the current paragraph to a list.
  Transforms.wrapNodes(editor, { type: 'list-item', children: [paragraph] }, { at: path })
  Transforms.wrapNodes(editor, { type: 'list', children: [] }, { at: path })
}

export const insertTab = (editor: Editor, selection: BaseRange) => {
  if (Range.isCollapsed(selection)) {
    const [block] = Editor.nodes<any>(editor, {
      match: n => SlateElement.isElement(n) && n.type === 'paragraph',
      mode: 'lowest'
    })
    if (block) {
      const [node, path] = block
      switch (node.type) {
        case 'paragraph':
          const [parentNode, parentPath] = Editor.parent(editor, path)
          // If the paragraph is the first paragraph in the document, insert a list item.
          if (parentPath && parentPath.length === 0) {
            insertTabForParagraph(editor, selection, node, path)
          } else if (parentNode && SlateElement.isElement(parentNode) && parentNode.type === 'list-item') {
            insertTabForListItem(editor, selection, node, path, parentNode, parentPath)
          }
          break
      }
    }
    // activeEditor.editor.insertText('\t')
  }
}