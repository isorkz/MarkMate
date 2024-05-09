import { useEffect, useState } from 'react';
import { Node, Element as SlateElement } from 'slate'
import useStore from '../../../store/MStore';
import { useMEditor } from '../../../models/MEditor';
import { getFileName } from '../../../utils/common';
import { Divider } from '@mui/material';

interface TocItem {
  level: number;
  title: string;
}

interface TocViewProps {
  tabIndex: number;
  tabId: string;
};

const levelClassMap = new Map([
  [1, ''],
  [2, 'pl-4'],
  [3, 'pl-8'],
  [4, 'pl-12'],
  [5, 'pl-12'],
  [6, 'pl-12']
])

const TocView = ({ tabIndex, tabId }: TocViewProps) => {
  const [toc, setToc] = useState<TocItem[]>([]);

  const showTocPanel = useStore((state) => state.showTocPanel);

  const activeEditor = useMEditor()

  useEffect(() => {
    if (tabId !== activeEditor.id) {
      return;
    }

    if (activeEditor.editor) {
      const newToc: TocItem[] = [];
      activeEditor.editor.children.forEach((node) => {
        if (SlateElement.isElement(node) && node.type === 'head') {
          newToc.push({
            level: node.level,
            title: Node.string(node),
          })
        }
      })
      setToc(newToc)
    } else {
      setToc([])
    }
  }, [activeEditor.sourceContent])

  const getLevelClass = (level: number) => {
    const minLevel = toc.reduce((prev, current) => {
      return prev.level < current.level ? prev : current
    })
    const indent = level - minLevel.level + 1
    return levelClassMap.get(indent) || ''
  }

  return (
    // flex-none: don't grow or shrink, fixed width
    // Use 'w-0' to hide the left sidebar instead of 'hidden', to have a smooth transition effect.
    <div className={`flex flex-none h-full overflow-y-auto ${showTocPanel ? 'w-[18rem]' : 'w-0'} transition-all duration-300`}>
      <Divider orientation="vertical" flexItem />

      <div className="flex flex-col p-4">
        <h2 className="text-lg">[{activeEditor.filePath ? getFileName(activeEditor.filePath) : 'Untitled'}]</h2>
        <div className="flex flex-col m-2 text-sky-500">
          {toc.map((item, index) => (
            <div key={index} className={`${getLevelClass(item.level)} my-1 text-sm`}>
              {item.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TocView