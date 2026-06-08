import { z } from 'zod';
import { TIME_OF_DAY } from '../../../types/domain.js';

/** 活動セット入力（SEC-002 入力検証）。 */
export const setInputSchema = z.object({
  name: z.string().trim().min(1, '名前を入れてください').max(60),
  timeOfDay: z.enum(TIME_OF_DAY),
});
export type SetInput = z.infer<typeof setInputSchema>;

/** アイテム入力。 */
export const itemInputSchema = z.object({
  name: z.string().trim().min(1, '名前を入れてください').max(60),
});
export type ItemInput = z.infer<typeof itemInputSchema>;
