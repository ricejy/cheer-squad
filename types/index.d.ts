/** Whether the main turn is running, so the squad cheers only then. */
export type Crowd = { isWorking: boolean }

declare module 'claude-code' {
  interface PluginState {
    'cheer-squad': { crowd: Crowd }
  }
}
