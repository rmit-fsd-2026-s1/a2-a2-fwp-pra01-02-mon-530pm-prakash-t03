interface StarRatingProps {
  value: number
  max?: number
  onChange?: (val: number) => void
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
}

export default function StarRating({
  value,
  max = 5,
  onChange,
  size = 'md',
  readOnly = false,
}: StarRatingProps) {
  const sizes = { sm: '1rem', md: '1.35rem', lg: '1.75rem' }
  const fontSize = sizes[size]

  return (
    <div className="stars" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`star${i < value ? ' filled' : ''}`}
          style={{
            fontSize,
            cursor: readOnly ? 'default' : 'pointer',
            transition: 'color 0.15s',
          }}
          onClick={() => !readOnly && onChange?.(i + 1)}
          onKeyDown={e => !readOnly && e.key === 'Enter' && onChange?.(i + 1)}
          role={readOnly ? undefined : 'button'}
          tabIndex={readOnly ? -1 : 0}
          aria-label={`${i + 1} star`}
        >
          ★
        </span>
      ))}
    </div>
  )
}
