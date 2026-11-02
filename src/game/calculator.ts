/**
 * 電卓の式。通常モードとアミノ酸モードで同じ式を共有するので、
 * 数・アミノ酸・演算子を並べたトークン列として持つ。
 */
export type Operator = "+" | "−" | "×" | "÷";

export type Token =
  /** typed が true の数は、続けて押した数字がつながる。 */
  | { kind: "num"; text: string; typed: boolean }
  | { kind: "acid"; code: string; mass: number }
  | { kind: "op"; op: Operator };

export type CalcMode = "normal" | "amino";

const isValue = (token: Token | undefined): token is Exclude<Token, { kind: "op" }> =>
  token !== undefined && token.kind !== "op";

/**
 * 値が続けて入るときは、見えるように + を挟む（G を押してから A を押すと G + A）。
 */
function appendValue(tokens: readonly Token[], value: Token): Token[] {
  const last = tokens[tokens.length - 1];
  if (isValue(last)) return [...tokens, { kind: "op", op: "+" }, value];
  return [...tokens, value];
}

export function pressDigit(tokens: readonly Token[], digit: string): Token[] {
  const last = tokens[tokens.length - 1];
  if (digit === ".") {
    if (last?.kind === "num" && last.typed) {
      if (last.text.includes(".")) return [...tokens];
      return [...tokens.slice(0, -1), { ...last, text: `${last.text}.` }];
    }
    return appendValue(tokens, { kind: "num", text: "0.", typed: true });
  }
  if (last?.kind === "num" && last.typed) {
    const text = last.text === "0" ? digit : `${last.text}${digit}`;
    return [...tokens.slice(0, -1), { ...last, text }];
  }
  return appendValue(tokens, { kind: "num", text: digit, typed: true });
}

/** アミノ酸モードの 1 と 19。入力した数字とはつながらない。 */
export function pressConstant(tokens: readonly Token[], text: string): Token[] {
  return appendValue(tokens, { kind: "num", text, typed: false });
}

export function pressAcid(tokens: readonly Token[], code: string, mass: number): Token[] {
  return appendValue(tokens, { kind: "acid", code, mass });
}

export function pressOperator(tokens: readonly Token[], op: Operator): Token[] {
  const last = tokens[tokens.length - 1];
  if (last === undefined) return [];
  if (last.kind === "op") return [...tokens.slice(0, -1), { kind: "op", op }];
  return [...tokens, { kind: "op", op }];
}

export function backspace(tokens: readonly Token[]): Token[] {
  const last = tokens[tokens.length - 1];
  if (last === undefined) return [];
  if (last.kind === "num" && last.typed && last.text.length > 1) {
    return [...tokens.slice(0, -1), { ...last, text: last.text.slice(0, -1) }];
  }
  return tokens.slice(0, -1);
}

function valueOf(token: Token): number {
  if (token.kind === "acid") return token.mass;
  if (token.kind === "num") return Number(token.text);
  return Number.NaN;
}

/**
 * 四則演算。かけ算とわり算を先に計算する。
 * 式の右端が演算子のときは、その演算子を無視した値にする（12+ なら 12）。0 でわるときと式が空のときは null。
 */
export function evaluate(input: readonly Token[]): number | null {
  const last = input[input.length - 1];
  const tokens = last?.kind === "op" ? input.slice(0, -1) : input;
  if (tokens.length === 0 || tokens.length % 2 === 0) return null;
  const values: number[] = [];
  const ops: Operator[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    if (index % 2 === 0) {
      if (token.kind === "op") return null;
      const value = valueOf(token);
      if (!Number.isFinite(value)) return null;
      values.push(value);
    } else {
      if (token.kind !== "op") return null;
      ops.push(token.op);
    }
  }

  const sums: number[] = [values[0]!];
  const signs: Operator[] = [];
  for (let index = 0; index < ops.length; index += 1) {
    const op = ops[index]!;
    const next = values[index + 1]!;
    if (op === "×") {
      sums[sums.length - 1] = sums[sums.length - 1]! * next;
    } else if (op === "÷") {
      if (next === 0) return null;
      sums[sums.length - 1] = sums[sums.length - 1]! / next;
    } else {
      signs.push(op);
      sums.push(next);
    }
  }
  let total = sums[0]!;
  signs.forEach((op, index) => {
    const value = sums[index + 1]!;
    total = op === "+" ? total + value : total - value;
  });
  return Math.round(total * 1e9) / 1e9;
}

export function formatNumber(value: number): string {
  return String(Number(value.toFixed(6)));
}

/** 「=」を押したとき。計算できるときだけ、式を結果の数1つにする（右端の演算子は捨てる）。 */
export function pressEquals(tokens: readonly Token[]): Token[] {
  const value = evaluate(tokens);
  if (value === null) return [...tokens];
  return [{ kind: "num", text: formatNumber(value), typed: false }];
}
