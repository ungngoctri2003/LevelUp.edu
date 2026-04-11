import * as React from 'react'
import { Content, Portal, Root, Trigger } from '@radix-ui/react-popover'

/**
 * Popover căn chỉnh theo design dashboard — z-index cao hơn modal nội bộ (z-[100]).
 */
function Popover({ children, ...props }) {
  return <Root {...props}>{children}</Root>
}

const PopoverTrigger = Trigger

const PopoverContent = React.forwardRef(function PopoverContent(
  { className = '', children, align = 'start', sideOffset = 8, ...props },
  ref,
) {
  return (
    <Portal>
      <Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={`z-200 w-auto rounded-xl border border-slate-200 bg-white p-0 shadow-xl outline-none dark:border-white/15 dark:bg-slate-900 dark:shadow-black/40 ${className}`.trim()}
        {...props}
      >
        {children}
      </Content>
    </Portal>
  )
})

PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverContent }
