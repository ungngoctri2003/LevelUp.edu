import { createPortal } from 'react-dom'

/**
 * Renders modal UI on document.body so fixed positioning and z-index are not affected by
 * the dashboard shell (sticky header above main) or transform on the Outlet wrapper.
 */
export function ModalPortal({ children }) {
  return createPortal(children, document.body)
}
