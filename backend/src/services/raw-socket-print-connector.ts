import fs from 'node:fs/promises'
import net from 'node:net'

interface SendPostScriptOptions {
  printerHost: string
  printerPort: number
  postScriptPath: string
  timeoutMs?: number
}

export class RawSocketPrintConnector {
  async sendPostScript({
    printerHost,
    printerPort,
    postScriptPath,
    timeoutMs = 15_000,
  }: SendPostScriptOptions) {
    const postScript = await fs.readFile(postScriptPath)
    const endOfJob = Buffer.from([0x04])
    const payload = Buffer.concat([postScript, endOfJob])

    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host: printerHost, port: printerPort })
      let settled = false

      function finish(error?: Error) {
        if (settled) {
          return
        }

        settled = true
        socket.destroy()

        if (error) {
          reject(error)
          return
        }

        resolve()
      }

      socket.setTimeout(timeoutMs)

      socket.on('connect', () => {
        socket.end(payload)
      })

      socket.on('timeout', () => {
        finish(new Error(`Timed out sending print job to ${printerHost}:${printerPort}`))
      })

      socket.on('error', (error) => {
        finish(error)
      })

      socket.on('close', (hadError) => {
        if (!hadError) {
          finish()
        }
      })
    })

    return {
      bytesSent: payload.byteLength,
    }
  }
}
