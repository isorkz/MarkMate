import { HeadElement, ListItemElement, ParagraphElement } from './../Element';
import { Editor, Transforms, Point, Node, Path, BaseRange, Element as SlateElement } from 'slate'

// Handle the delete backward when user press the backspace key in head element
// 1. If user is deleting at the start of the head, convert it to a paragraph.
// 2. Otherwise, use the default delete backward behavior.
export const deleteBackwardForHead = (editor: Editor, selection: BaseRange, head: HeadElement, path: Path) => {
  const start = Editor.start(editor, path)
  if (Point.equals(selection.anchor, start)) {
    // If the user is deleting at the beginning of a head node, convert it to a paragraph.
    Transforms.setNodes(editor, { type: 'paragraph' })
    return true
  }

  // Return false to use the default delete backward behavior.
  return false
}

// Handle the delete backward when user press the backspace key in list item element
// 1. If user is deleting at the start of the list item, convert it to a paragraph.
// 2. Otherwise, use the default delete backward behavior.
export const deleteBackwardForListItem = (editor: Editor, selection: BaseRange, paragraph: ParagraphElement, path: Path, listItem: ListItemElement, listItemPath: Path) => {
  const start = Editor.start(editor, path)
  if (Point.equals(selection.anchor, start)) {
    // If it's a check list item, remove the check mark.
    if (listItem.checked !== undefined && listItem.checked !== null) {
      Transforms.setNodes(editor, { checked: undefined }, { at: listItemPath })
      return true
    }

    const prevNode = Editor.previous(editor, { at: path })
    // If the user is deleting at the beginning of a list item node and the previous node is a paragraph, use the default delete backward behavior.
    if (prevNode && SlateElement.isElement(prevNode[0])) {
      // Return false to use the default delete backward behavior.
      return false
    }

    // If has previous list item, move the current list item to the end of the previous list item.
    const prevListItem = Editor.previous(editor, { at: listItemPath })
    if (prevListItem) {
      if (SlateElement.isElement(prevListItem[0]) && prevListItem[0].type === 'list-item') {
        if (prevListItem[0].checked === undefined || prevListItem[0].checked === null) {
          const toPath = prevListItem[1].concat([prevListItem[0].children.length])
          Transforms.moveNodes(editor, { at: listItemPath, to: toPath })
          Transforms.unwrapNodes(editor, { at: toPath })
        } else {
          Transforms.unwrapNodes(editor, { at: listItemPath });
          Transforms.liftNodes(editor, { at: listItemPath });
        }
        return true
      }
    } else {
      // If has no previous list item, move the current list item to the previous node of the list.
      const list = Editor.parent(editor, listItemPath)
      const childrenCount = list[0].children.length
      Transforms.moveNodes(editor, { at: listItemPath, to: list[1] })
      if (childrenCount === 1) {
        Transforms.removeNodes(editor, { at: Path.next(list[1]) })
      }
      Transforms.unwrapNodes(editor, { at: list[1] })
      return true
    }
  }

  // Return false to use the default delete backward behavior.
  return false
}

// Handle the delete backward when user press the backspace key in paragraph element
// 1. If the user is deleting the first empty paragraph node
//   (1) If the whole document is not empty, delete the empty paragraph node.
//   (2) If the whole document is empty, do nothing.
// 2. Otherwise, use the default delete backward behavior.
export const deleteBackwardForParagraph = (editor: Editor, selection: BaseRange, paragraph: ParagraphElement, path: Path) => {
  if (Path.equals(path, [0])) {
    const leaf = Node.leaf(editor, selection.focus.path)
    if (leaf.text?.length === 0 && editor.children.length > 1) {
      Transforms.delete(editor, { at: path })
      return true
    }
  }

  // If it's a empty top level paragraph, delete it.
  // Cannot use the default behavior because the result is unexpected for the case: Hr -> Paragraph
  if (path.length === 1 && Node.string(paragraph) === '') {
    if (editor.children.length > 1) {
      Transforms.delete(editor, { at: path })
      // Move the cursor to the end of the previous node.
      Transforms.select(editor, Editor.end(editor, Path.previous(path)))
    }
    return true
  }

  // Return false to use the default delete backward behavior.
  return false
}
