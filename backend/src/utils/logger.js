import { mkdirSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';

const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}
const logPath = join(logsDir, 'recommendation.log');

export const logger = {
  info: (msg) => {
    const line = `${new Date().toISOString()} INFO ${msg}\n`;
    appendFileSync(logPath, line);
  },
  error: (msg) => {
    const line = `${new Date().toISOString()} ERROR ${msg}\n`;
    appendFileSync(logPath, line);
  },
};
