// WebSocket connection to the NeoMud game server.
// Wire format: JSON with classDiscriminator "type" (kotlinx.serialization).

const PROTOCOL_VERSION = 1
const CLIENT_VERSION = '3d-0.1.0'

export class GameSocket {
  constructor(url) {
    this.url = url
    this.handlers = new Map() // type -> [fn]
    this.ws = null
  }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, [])
    this.handlers.get(type).push(fn)
    return this
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)
      this.ws.onopen = () => resolve()
      this.ws.onerror = (e) => reject(e)
      this.ws.onclose = () => this.emit('__closed', {})
      this.ws.onmessage = (ev) => {
        let msg
        try { msg = JSON.parse(ev.data) } catch { return }
        if (msg.type === 'server_hello') {
          this.send('client_hello', {
            clientVersion: CLIENT_VERSION,
            protocolVersion: PROTOCOL_VERSION
          })
        }
        this.emit(msg.type, msg)
        this.emit('*', msg)
      }
    })
  }

  emit(type, msg) {
    const fns = this.handlers.get(type)
    if (fns) for (const fn of fns) fn(msg)
  }

  send(type, payload = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }))
    }
  }
}
