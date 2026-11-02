import { useMemo } from "react";
import {
  backspace,
  evaluate,
  formatNumber,
  pressAcid,
  pressConstant,
  pressDigit,
  pressEquals,
  pressOperator,
  type CalcMode,
  type Operator,
  type Token,
} from "../game/calculator.ts";
import { trayCards } from "../game/tray.ts";
import type { AminoAcid } from "../game/types.ts";

type Props = {
  acids: readonly AminoAcid[];
  mode: CalcMode;
  tokens: readonly Token[];
  onMode: (mode: CalcMode) => void;
  onTokens: (tokens: Token[]) => void;
};

const DIGITS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "."];
const OPERATORS: Operator[] = ["÷", "×", "−", "+"];
const OPERATOR_LABELS: Record<Operator, string> = {
  "÷": "わる",
  "×": "かける",
  "−": "ひく",
  "+": "たす",
};

/** 通常モードとアミノ酸モードで、同じ式（tokens）を使う。 */
export function Calculator({ acids, mode, tokens, onMode, onTokens }: Props) {
  const cards = useMemo(() => trayCards(acids.map((acid) => acid.code), acids), [acids]);
  const value = evaluate(tokens);

  return (
    <section className="calculator" aria-label="電卓">
      <div className="calc-head">
        <div className="calc-modes" role="tablist" aria-label="電卓のモード">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "normal"}
            className={mode === "normal" ? "calc-tab is-active" : "calc-tab"}
            onClick={() => onMode("normal")}
          >
            通常
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "amino"}
            className={mode === "amino" ? "calc-tab is-active" : "calc-tab"}
            onClick={() => onMode("amino")}
          >
            アミノ酸
          </button>
        </div>
      </div>

      <div className="calc-display" aria-live="polite">
        <p className="calc-expression">
          {tokens.length === 0 ? (
            <span className="calc-placeholder">0</span>
          ) : (
            tokens.map((token, index) => <TokenView key={index} token={token} />)
          )}
        </p>
        <p className="calc-result">{value === null ? " " : `= ${formatNumber(value)}`}</p>
      </div>

      <div className="calc-body">
        {mode === "normal" ? (
          <div className="calc-digits">
            {DIGITS.map((digit) => (
              <button
                key={digit}
                type="button"
                className="calc-key"
                onClick={() => onTokens(pressDigit(tokens, digit))}
              >
                {digit}
              </button>
            ))}
          </div>
        ) : (
          <div className="calc-acids">
            <button
              type="button"
              className="calc-key is-const"
              aria-label="数字の1"
              onClick={() => onTokens(pressConstant(tokens, "1"))}
            >
              1
            </button>
            <button
              type="button"
              className="calc-key is-const"
              aria-label="数字の19"
              onClick={() => onTokens(pressConstant(tokens, "19"))}
            >
              19
            </button>
            {cards.map((card) => (
              <button
                key={card.key}
                type="button"
                className="calc-key is-acid"
                aria-label={`${card.acid.nameJa} ${card.acid.residueMass}`}
                onClick={() => onTokens(pressAcid(tokens, card.code, card.acid.residueMass))}
              >
                <span className="calc-acid-code">{card.code}</span>
                <span className="calc-acid-mass">{card.acid.residueMass}</span>
              </button>
            ))}
          </div>
        )}

        <div className="calc-ops">
          {OPERATORS.map((op) => (
            <button
              key={op}
              type="button"
              className="calc-key is-op"
              aria-label={OPERATOR_LABELS[op]}
              onClick={() => onTokens(pressOperator(tokens, op))}
            >
              {op}
            </button>
          ))}
          <button
            type="button"
            className="calc-key is-control"
            aria-label="1つ消す"
            onClick={() => onTokens(backspace(tokens))}
          >
            ⌫
          </button>
          <button
            type="button"
            className="calc-key is-control"
            aria-label="全部消す"
            onClick={() => onTokens([])}
          >
            C
          </button>
          <button
            type="button"
            className="calc-key is-equals"
            aria-label="計算する"
            onClick={() => onTokens(pressEquals(tokens))}
          >
            =
          </button>
        </div>
      </div>
      {mode === "amino" ? (
        <p className="note calc-note">
          アミノ酸は残基質量で計算します。続けて押すと + が入ります。
        </p>
      ) : null}
    </section>
  );
}

function TokenView({ token }: { token: Token }) {
  if (token.kind === "op") return <span className="calc-op">{token.op}</span>;
  if (token.kind === "acid") {
    return (
      <span className="calc-chip" title={`${token.mass}`}>
        {token.code}
      </span>
    );
  }
  return <span className="calc-num">{token.text}</span>;
}
