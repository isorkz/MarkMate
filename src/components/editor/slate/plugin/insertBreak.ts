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
// 1. If the current list item is empty, lift it out of the list.
// 2. If the current list item is not empty, split it into two list items.
export const insertBreakForListItem = (editor: Editor, selection: BaseRange, paragraph: ParagraphElement, path: Path, listItem: ListItemElement, listItemPath: Path) => {
  // If the current list item is empty, convert it to a paragraph
  if (hasOnlyOneEmptyText(paragraph)) {
    const list = Editor.parent(editor, listItemPath)
    const parentList = Editor.parent(editor, list[1])
    // If the current empty list item is in a sub-list, lift the list item out of the sub-list.
    if (parentList && SlateElement.isElement(parentList[0]) && parentList[0].type === 'list-item') {
      const nextListItem = Editor.next(editor, { at: listItemPath })
      if (nextListItem) {
        Transforms.removeNodes(editor, { at: listItemPath })
      } else {
        Transforms.moveNodes(editor, { at: listItemPath, to: Path.next(parentList[1]) });
        if (list[0].children.length === 1) {
          Transforms.removeNodes(editor, { at: list[1] })
        }
      }
    } else {
      // Lift the paragraph out of the list.
      Transforms.unwrapNodes(editor, { at: listItemPath });
      Transforms.liftNodes(editor, { at: listItemPath });
    }
  } else {
    // If the current list item is not empty, split it into two list items.
    // If the cursor is at the start/end of the list item, Transforms.splitNodes() can't split the list item, we need to handle it manually.
    const start = Editor.start(editor, path)
    const end = Editor.end(editor, path)
    if (Point.equals(selection.anchor, start)) {
      Transforms.insertNodes(editor, DefaultEmptyListItemElement(), { at: listItemPath })
      Transforms.select(editor, selection);
    } else if (Point.equals(selection.anchor, end)) {
      Transforms.insertNodes(editor, DefaultEmptyListItemElement(listItem.checked !== undefined && listItem.checked !== null ? true : false), { at: Path.next(listItemPath) })
      Transforms.select(editor, Editor.start(editor, Path.next(listItemPath)));
    } else {
      // Split the nodes at the current selection location.
      Transforms.splitNodes(editor)
      Transforms.moveNodes(editor, { at: Path.next(path), to: Path.next(listItemPath) })
      Transforms.wrapNodes(editor, { type: 'list-item', children: [] }, { at: Path.next(listItemPath) })
    }
  }
}

const hasOnlyOneEmptyText = (element: SlateElement) => {
  return element.children.length === 1 && Text.isText(element.children[0]) && element.children[0].text === ''
}

export const insertBreakForLink = (editor: Editor, selection: BaseRange, paragraph: ParagraphElement, path: Path) => {
  // The default behavior of insertBreak will insert new text in link, so we need to handle it manually.
  const [node] = Editor.node(editor, selection)
  if (Text.isText(node) && node.url) {
    const end = Editor.end(editor, path)
    if (Point.equals(selection.anchor, end)) {
      const parent = Editor.parent(editor, path)
      // If it's not in list-item, insert a new paragraph;
      if (parent[1].length === 0 || SlateElement.isElement(parent[0]) && parent[0].type !== 'list-item') {
        Transforms.insertNodes(editor, DefaultParagraphElement(), { at: Path.next(path) })
        Transforms.select(editor, Editor.start(editor, Path.next(path)))
        return true
      }
    }
  }

  // return false to let the default behavior to handle the break
  return false
}