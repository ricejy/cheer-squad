import type { HookOf, Register } from 'claude-code'

/** Registers the token weather row: context, 5-hour and 7-day pills above the prompt. */
export declare const register: Register

/** Token weather's session-start work: call it from the mod's own session.start hook. */
export declare const weatherSessionStart: HookOf<'session.start'>

/** Token weather's turn-end work: call it from the mod's own turn.complete hook. */
export declare const weatherTurnComplete: HookOf<'turn.complete'>

/** Token weather's usage readings: call it from the mod's own session.measure hook. */
export declare const weatherSessionMeasure: HookOf<'session.measure'>
