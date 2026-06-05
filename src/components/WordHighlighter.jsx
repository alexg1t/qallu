import React, { memo } from 'react'

const STATUS_CLASSES = {
  pending: 'text-gray-800',
  active: 'bg-yellow-200 text-yellow-900',
  correct: 'bg-green-100 text-green-800',
  missed: 'text-red-400 opacity-50',
}

const WordSpan = memo(function WordSpan({ word, status, isEmphasized }) {
  const base = STATUS_CLASSES[status] || STATUS_CLASSES.pending
  const emphasis = isEmphasized ? 'ring-2 ring-indigo-500 rounded' : ''
  return (
    <span className={`word-token ${base} ${emphasis}`}>
      {word}
    </span>
  )
})

export default function WordHighlighter({ tokens, statuses, activeIndex, emphasizedIndex }) {
  return (
    <p className="font-exercise text-3xl leading-relaxed text-center max-w-3xl mx-auto">
      {tokens.map((word, i) => (
        <React.Fragment key={i}>
          <WordSpan
            word={word}
            status={i === activeIndex && statuses[i] === 'pending' ? 'active' : statuses[i]}
            isEmphasized={emphasizedIndex === i}
          />
          {i < tokens.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </p>
  )
}
