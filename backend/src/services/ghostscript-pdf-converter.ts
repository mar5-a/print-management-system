import { spawn } from 'node:child_process'

interface ConvertPdfToPostScriptOptions {
  ghostscriptBin: string
  inputPdfPath: string
  outputPostScriptPath: string
}

export class GhostscriptPdfConverter {
  async convertPdfToPostScript({
    ghostscriptBin,
    inputPdfPath,
    outputPostScriptPath,
  }: ConvertPdfToPostScriptOptions) {
    const args = [
      '-dNOPAUSE',
      '-dBATCH',
      '-sDEVICE=ps2write',
      `-sOutputFile=${outputPostScriptPath}`,
      inputPdfPath,
    ]

    await new Promise<void>((resolve, reject) => {
      const child = spawn(ghostscriptBin, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stderr = ''

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString()
      })

      child.on('error', (error) => {
        reject(new Error(`Failed to start Ghostscript (${ghostscriptBin}): ${error.message}`))
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
          return
        }

        reject(new Error(`Ghostscript exited with code ${code}. ${stderr.trim()}`))
      })
    })
  }
}
