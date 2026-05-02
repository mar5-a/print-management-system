import { execFile, exec } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const execAsync = promisify(exec)

type PrintMode = 'sumatra' | 'powershell' | 'command'

interface PrintPdfOptions {
  mode: PrintMode
  pdfPath: string
  printerName: string
  sumatraPdfPath: string
  printCommand: string
  timeoutMs: number
}

export interface PrintCommandResult {
  command: string
  stdout: string
  stderr: string
}

function quotePowerShellString(value: string) {
  return `'${value.replaceAll("'", "''")}'`
}

function replaceCommandTokens(command: string, pdfPath: string, printerName: string) {
  return command
    .replaceAll('{file}', pdfPath)
    .replaceAll('{printer}', printerName)
}

export class WindowsPrintCommand {
  async printPdf({
    mode,
    pdfPath,
    printerName,
    sumatraPdfPath,
    printCommand,
    timeoutMs,
  }: PrintPdfOptions): Promise<PrintCommandResult> {
    if (mode === 'sumatra') {
      const args = ['-print-to', printerName, '-silent', pdfPath]
      const { stdout, stderr } = await execFileAsync(sumatraPdfPath, args, { timeout: timeoutMs })

      return {
        command: `${sumatraPdfPath} ${args.join(' ')}`,
        stdout,
        stderr,
      }
    }

    if (mode === 'powershell') {
      const command = [
        'Start-Process',
        '-FilePath',
        quotePowerShellString(pdfPath),
        '-Verb',
        'PrintTo',
        '-ArgumentList',
        quotePowerShellString(printerName),
        '-Wait',
      ].join(' ')

      const { stdout, stderr } = await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
        { timeout: timeoutMs },
      )

      return {
        command: `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ${command}`,
        stdout,
        stderr,
      }
    }

    if (!printCommand.trim()) {
      throw new Error('WINDOWS_PRINT_COMMAND is required when WINDOWS_PRINT_MODE=command.')
    }

    const command = replaceCommandTokens(printCommand, pdfPath, printerName)
    const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs })

    return {
      command,
      stdout,
      stderr,
    }
  }
}
