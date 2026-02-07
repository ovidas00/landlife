import { Notyf } from 'notyf'
import 'notyf/notyf.min.css'

// Single Notyf instance
const notyf = new Notyf({
  duration: 3000, // auto-dismiss after 3s
  position: { x: 'right', y: 'bottom' },
  dismissible: true,
  ripple: false
})

export const showSuccess = (msg) => notyf.success(msg)
export const showError = (msg) => notyf.error(msg)
export default notyf
