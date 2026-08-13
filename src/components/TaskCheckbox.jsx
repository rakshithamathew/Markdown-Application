import { useState } from 'react'

function TaskCheckbox({ checked = false, disabled: _disabled, node: _node, onChange, ...props }) {
  const [isChecked, setIsChecked] = useState(Boolean(checked))

  return (
    <input
      {...props}
      type="checkbox"
      checked={isChecked}
      aria-label={isChecked ? 'Mark task incomplete' : 'Mark task complete'}
      onChange={(event) => {
        setIsChecked(event.target.checked)
        onChange?.(event)
      }}
    />
  )
}

export default TaskCheckbox
