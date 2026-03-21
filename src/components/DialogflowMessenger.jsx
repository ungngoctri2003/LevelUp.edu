import { useEffect } from 'react'

/** Phải khớp index.html — nếu thiếu script, <df-messenger> không đăng ký được. */
const DIALOGFLOW_BOOTSTRAP_URL =
  'https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1'

const AGENT_ID = import.meta.env.VITE_DIALOGFLOW_AGENT_ID ?? ''
const CHAT_TITLE = import.meta.env.VITE_DIALOGFLOW_CHAT_TITLE ?? 'HoiThao'
const LANGUAGE_CODE = import.meta.env.VITE_DIALOGFLOW_LANGUAGE_CODE ?? 'vi'
const INTENT = import.meta.env.VITE_DIALOGFLOW_INTENT ?? 'WELCOME'

const PROJECT_ID = import.meta.env.VITE_DIALOGFLOW_PROJECT_ID
const LOCATION_ID = import.meta.env.VITE_DIALOGFLOW_LOCATION_ID ?? 'global'

function hasBootstrapScript() {
  return !!document.querySelector('script[src*="dialogflow-console/fast/messenger/bootstrap"]')
}

function loadBootstrapOnce() {
  return new Promise((resolve, reject) => {
    if (hasBootstrapScript()) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = DIALOGFLOW_BOOTSTRAP_URL
    s.async = true
    s.onload = () => resolve()
    s.onerror = () =>
      reject(new Error('Không tải được bootstrap Dialogflow (mạng / adblock / CSP).'))
    document.head.appendChild(s)
  })
}

function waitForMessenger(timeoutMs = 20000) {
  return Promise.race([
    customElements.whenDefined('df-messenger'),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'df-messenger chưa đăng ký. Kiểm tra bootstrap.js đã load và không bị chặn.',
            ),
          ),
        timeoutMs,
      ),
    ),
  ])
}

/**
 * Gắn <df-messenger> vào document.body + setAttribute.
 * Vite: dùng VITE_DIALOGFLOW_AGENT_ID trong .env / .env.local (không commit ID thật nhầm môi trường).
 * Dialogflow CX: thêm VITE_DIALOGFLOW_PROJECT_ID (+ location nếu cần).
 */
export function DialogflowMessenger() {
  useEffect(() => {
    if (!AGENT_ID.trim()) {
      console.warn(
        '[DialogflowMessenger] Thiếu VITE_DIALOGFLOW_AGENT_ID. Sao chép .env.example → .env.local và điền ID.',
      )
      return undefined
    }

    let cancelled = false
    let el = null

    ;(async () => {
      try {
        await loadBootstrapOnce()
        await waitForMessenger()
        if (cancelled) return

        el = document.createElement('df-messenger')
        el.setAttribute('intent', INTENT)
        el.setAttribute('chat-title', CHAT_TITLE)
        el.setAttribute('agent-id', AGENT_ID.trim())
        el.setAttribute('language-code', LANGUAGE_CODE)
        if (PROJECT_ID) {
          el.setAttribute('project-id', PROJECT_ID)
          el.setAttribute('location-id', LOCATION_ID)
        }

        document.body.appendChild(el)
      } catch (e) {
        console.error('[DialogflowMessenger]', e)
      }
    })()

    return () => {
      cancelled = true
      if (el && el.parentNode) el.remove()
    }
  }, [])

  return null
}
