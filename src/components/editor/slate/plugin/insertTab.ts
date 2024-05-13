import { ListItemElement, ParagraphElement } from './../Element';
import { Editor, Transforms, Element as SlateElement, Path, BaseRange } from 'slate'

export const insertTabForListItem = (editor: Editor, selection: BaseRange, paragraph: ParagraphElement, path: Path, listItem: ListItemElement, listItemPath: Path) => {
  // If has previous list item, make the current list item a child of the previous list item.
  const previousNode = Editor.previous(editor, { at: listItemPath })
  if (previousNode && SlateElement.isElement(previousNode[0]) && previousNode[0].type === 'list-item') {
    const previousListItemPath = previousNode[1]
    // Insert the new list at the end of the previous list item
    const newList: SlateElement = { type: 'list', children: [listItem] };
    const newListPath = [...previousListItemPath, previousNode[0].children.length];
    Transforms.insertNodes(editor, newList, { at: newListPath });
    Transforms.removeNodes(editor, { at: listItemPath });
    return
  }
}