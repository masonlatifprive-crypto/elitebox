import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])

  const toast = React.useCallback(({ ...props }) => {
    const id = genId()
    setToasts((prev) => [{ ...props, id, open: true }, ...prev].slice(0, TOAST_LIMIT))
    return id
  }, [])

  return {
    toast,
    toasts,
    dismiss: (toastId?: string) => setToasts((prev) => prev.filter((t) => t.id !== toastId)),
  }
}
