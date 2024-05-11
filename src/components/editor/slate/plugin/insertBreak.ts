import { DefaultEmptyListItemElement, DefaultParagraphElement, HeadElement, ListItemElement, ParagraphElement } from './../Element';
import { Editor, Transforms, Element as SlateElement, Text, Range, Point, Node, Path, BaseRange } from 'slate'

// Handle the break when user press the enter key in head element
// 1. split the head into two parts -> head and a new paragraph
//    1.1 If the first head part is empty, remove it
export const insertBreakForHead = (editor: Editor, selection: BaseRange, head: HeadElement, path: Path) => {
  // let the content between the cursor and the end of the head be a new paragraph.
  const [start, end] = Range.edges(selection)
  const text = Node.string(head)
  const beforeText = text.slice(0, start.offset)
  const afterText = text.slice(end.offset)
  if (beforeText === '') {
    Transforms.insertNodes(editor, DefaultParagraphElement(), { at: path })
    // Set the cursor to the start of the new paragraph
    Transforms.select(editor, Editor.start(editor, path))
  } else {
    Transforms.removeNodes(editor, { at: path })
    Transforms.insertNodes(editor, { type: 'head', children: [{ text: beforeText }], level: head.level }, { at: path })
    Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: afterText }] }, { at: Path.next(path) })
    // Set the cursor to the start of the new paragraph
    Transforms.select(editor, Editor.start(editor, Path.next(path)))
  }
}

// Handle the break when user press the enter key in list item element
// 1. If the current list item is empty, convert it to a paragraph.
// 2. If the current list item is not empty, split it into two list items.
export const insertBreakForListItem = (editor: Editor, selection: BaseRange, paragraph: ParagraphElement, path: Path, listItem: ListItemElement, listItemPath: Path) => {
  // If the current list item is empty, convert it to a paragraph
  if (hasOnlyOneEmptyText(paragraph)) {
    // Lift the paragraph out of the list.
    Transforms.unwrapNodes(editor, { at: listItemPath });
    Transforms.liftNodes(editor, { at: listItemPath });
  } else {
    // If the current list item is not empty, split it into two list items.
    // If the cursor is at the start/end of the list item, Transforms.splitNodes() can't split the list item, we need to handle it manually.
    const start = Editor.start(editor, path)
    const end = Editor.end(editor, path)
    if (Point.equals(selection.anchor, start)) {
      Transforms.insertNodes(editor, DefaultEmptyListItemElement(), { at: listItemPath })
    } else if (Point.equals(selection.anchor, end)) {
      Transforms.insertNodes(editor, DefaultEmptyListItemElement(), { at: Path.next(listItemPath) })
      Transforms.select(editor, Editor.start(editor, Path.next(listItemPath)));
    } else {
      // Split the nodes at the current selection location.
      Transforms.splitNodes(editor)
      Transforms.wrapNodes(editor, DefaultEmptyListItemElement(), { at: Path.next(path) })
    }
  }
}

const hasOnlyOneEmptyText = (element: SlateElement) => {
  return element.children.length === 1 && Text.isText(element.children[0]) && element.children[0].text === ''
}
