import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFile = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFile)

export const serverRoot = path.resolve(currentDir, '..', '..')
export const workspaceRoot = path.resolve(serverRoot, '..')
export const uploadsDir = path.resolve(serverRoot, 'uploads')
export const rootEnvPath = path.resolve(workspaceRoot, '.env')
