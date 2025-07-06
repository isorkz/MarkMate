import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import React from 'react'

// https://next.tiptap.dev/docs/examples/advanced/syntax-highlighting

// Neet to restart the app to make it effect
export default ({ node: { attrs: { language: defaultLanguage } }, updateAttributes, extension }) => (
  <NodeViewWrapper className="relative">
    <select
      contentEditable={false}
      defaultValue={defaultLanguage}
      onChange={event => updateAttributes({ language: event.target.value })}
      className="absolute bg-white right-1 top-1 rounded p-0.5 text-xs"
    >
      <option value="null">
        auto
      </option>
      <option disabled>
        —
      </option>
      {extension.options.lowlight.listLanguages().map((lang, index) => (
        <option key={index} value={lang}>
          {lang}
        </option>
      ))}
    </select>

    <pre>
      <NodeViewContent as="code" />
    </pre>
  </NodeViewWrapper>
)