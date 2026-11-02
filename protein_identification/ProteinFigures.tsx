/** 2026-11-02 にプレイから隔離。酵素で分ける図と、端の形の図。 */

export function ProteinFigures({ kind }: { kind: "digest" | "ends" }) {
  if (kind === "digest") return <DigestFigure />;
  return <EndsFigure />;
}

function DigestFigure() {
  return (
    <figure className="lesson-figure">
      <div className="figure-block">
        <p className="figure-kicker">1本のタンパク質</p>
        <div className="figure-chain">
          <Cap label="H" />
          <Bead code="G" />
          <Bead code="A" />
          <Bead code="K" />
          <span className="figure-cut">酵素</span>
          <Bead code="G" />
          <Bead code="F" />
          <Bead code="R" />
          <Cap label="OH" />
        </div>
      </div>
      <div className="figure-products">
        <div>
          <p className="figure-kicker">1本ずつ測るペプチド</p>
          <div className="figure-chain">
            <Cap label="H" />
            <Bead code="G" />
            <Bead code="A" />
            <Bead code="K" />
            <Cap label="OH" />
          </div>
        </div>
        <div>
          <p className="figure-kicker">もう1本</p>
          <div className="figure-chain">
            <Cap label="H" />
            <Bead code="G" />
            <Bead code="F" />
            <Bead code="R" />
            <Cap label="OH" />
          </div>
        </div>
      </div>
      <figcaption>
        長い鎖を酵素で短いペプチドに分け、そのペプチドを1本ずつ測ります。
      </figcaption>
    </figure>
  );
}

function EndsFigure() {
  return (
    <figure className="lesson-figure">
      <div className="figure-products">
        <div className="figure-block">
          <p className="figure-kicker">酵素で分かれたペプチド</p>
          <div className="figure-chain">
            <Cap label="H" />
            <Bead code="G" />
            <Bead code="A" />
            <Bead code="K" />
            <Cap label="OH" />
          </div>
          <p className="figure-note">分かれた位置の右端は K か R です。左の H と右の OH はそのままです。</p>
          <div className="figure-chain">
            <Cap label="H" />
            <Bead code="M" />
            <Bead code="H" />
            <Cap label="OH" />
          </div>
          <p className="figure-note">タンパク質本来の右端だけは、K でも R でもないことがあります。</p>
        </div>
        <div className="figure-block">
          <p className="figure-kicker">さらに分けたかけら</p>
          <div className="figure-chain">
            <Bead code="G" />
            <span className="figure-mass">+1</span>
          </div>
          <div className="figure-chain">
            <Bead code="A" />
            <Bead code="K" />
            <span className="figure-mass">+19</span>
          </div>
          <p className="figure-note">かけらの端は、ペプチドの H と OH とは別の形です。</p>
        </div>
      </div>
      <figcaption>
        酵素で分かれたペプチドと、そのペプチドをさらに分けたかけらでは、端の形が違います。
      </figcaption>
    </figure>
  );
}

function Bead({ code }: { code: string }) {
  return (
    <span className="bead" data-code={code}>
      {code}
    </span>
  );
}

function Cap({ label }: { label: "H" | "OH" }) {
  return <span className={label === "OH" ? "bead is-cap is-oh" : "bead is-cap"}>{label}</span>;
}
