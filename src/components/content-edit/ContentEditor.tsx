import { Dispatch, SetStateAction } from 'react'

interface ContentEditorProps {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
}

const ContentEditor = ({
  content,
  setContent,
}: ContentEditorProps) => {
  return (
    <main className="relative top-0 left-0 flex flex-none flex-col h-full w-[18rem]">
      <span className="flex-none px-4 py-2 text-lg font-medium">{content}</span>
    </main>
  )
}

export default ContentEditor