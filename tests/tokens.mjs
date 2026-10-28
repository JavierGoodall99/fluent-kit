// Token counts for budgets. Claude's tokenizer is not public, so this uses js-tiktoken's o200k_base encoding as a
// consistent proxy: absolute numbers are approximate, but growth and relative size are what the budgets guard.
import { getEncoding } from "js-tiktoken";
const enc = getEncoding("o200k_base");
export const tokens = (s) => enc.encode(s).length;
