import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { PublicPage, openEnter } from "../lib/Page";
import { GridBand, deal, type Cell } from "../bands/bands";
import { PhotoCard } from "../lib/cards";
import { Fit } from "../lib/fit";
import { Icon, type IconName } from "../icons";
import { HOME, PAGES, REFERENCE } from "../content";
import { session } from "../lib/store";
import "../styles.css";

/**
 * The public home page, after the reference's: a hero of a photograph, a
 * green panel with the offer and the Online Banking box beside it; the row
 * of products; how to manage an account; three photographs with reasons to
 * bank; and the questions people ask. Entry is in the header's corner, and
 * the Online Banking box opens the same parody notice before the demo.
 */

function OnlineBanking() {
  const s = session.use();
  return (
    <div className="box box--card ob">
      <p className="ob__title">Online Banking</p>
      <div className="ob__acts">
        {s.in ? <a className="btn btn--green" href={PAGES.accounts}>Go to your accounts</a> : <button type="button" className="btn btn--green" onClick={openEnter}><Icon name="lock" size={18} />Enter the demo</button>}
        <span className="linkish">Sign-Up <Icon name="right" size={14} /></span>
      </div>
      <ul className="ob__links">
        <li><span className="linkish">Learn more about Personal Online Banking <Icon name="right" size={14} /></span></li>
        <li><span className="linkish">Protect yourself against fraud <Icon name="right" size={14} /></span></li>
        <li><span className="linkish">Book an Appointment <Icon name="right" size={14} /></span></li>
      </ul>
    </div>
  );
}

function Hero() {
  const cells: Cell[] = [
    (x, k) => <PhotoCard k="hero" title="A living room" x={x} slotKey={k} />,
    () => (
      <div className="box box--green hero__panel">
        <div className="box__fit box__fit--top"><Fit as="p" className="fit--title" min={18} max={80}>{HOME.hero.title}</Fit></div>
        <div className="box__body"><Fit as="div" className="fit--body" min={13} max={26}><p>{HOME.hero.body}</p></Fit></div>
        <div className="box__foot"><span className="btn btn--onGreen">{HOME.hero.cta}</span></div>
      </div>
    ),
    () => <OnlineBanking />,
  ];
  return <GridBand id="hero" title="GIFbank" quiet lead variant={0} cells={cells} />;
}

function Find() {
  const [on, setOn] = useState<string | null>(null);
  const groups = deal(HOME.find, 4);
  return (
    <>
      <div className="wrap intro"><h2 className="intro__title">Online Banking &amp; Financial Services to Meet Your Goals</h2><p className="intro__sub">What can we help you find?</p></div>
      {groups.map((g, gi) => (
        <GridBand key={gi} id={`find-${gi}`} title={gi === 0 ? "What can we help you find?" : "More to find"} quiet variant={gi + 1}
          cells={g.map((f): Cell => () => (
            <button type="button" className={`box box--find${on === f.label ? " is-on" : ""}`} aria-pressed={on === f.label} onClick={() => setOn(on === f.label ? null : f.label)}>
              <span className="find__icon" aria-hidden="true"><Icon name={f.icon as IconName} size={40} stroke={1.5} /></span>
              <span className="box__fit"><Fit as="span" className="fit--title" min={13} max={64}>{f.label}</Fit></span>
              <span className="box__foot"><span className="linkish">{on === f.label ? "Saved to compare" : "Compare"} <Icon name="right" size={14} /></span></span>
            </button>
          ))} />
      ))}
      <p className="wrap note" role="status">{on ? `${on}: noted for comparison. Product pages are not part of this study.` : ""}</p>
    </>
  );
}

function Manage() {
  const cells: Cell[] = [
    (x, k) => <PhotoCard k="kitchen" title="A kitchen table" x={x} slotKey={k} />,
    ...HOME.manage.map((m): Cell => () => (
      <div className="box box--tile">
        <div className="box__fit box__fit--top"><Fit as="p" className="fit--title" min={15} max={56}>{m.title}</Fit></div>
        <div className="box__body"><Fit as="div" className="fit--body" min={13} max={26}><p>{m.body}</p></Fit></div>
      </div>
    )),
  ];
  return <GridBand id="manage" title="Manage your bank accounts" sub="Ways to keep on top of your money, day and night." variant={3} cells={cells} />;
}

function Anywhere() {
  const cells: Cell[] = HOME.anywhere.map((a): Cell => (x, k) => (
    <PhotoCard k={a.k} title={a.title} x={x} slotKey={k}>
      <div className="photo__words"><p className="photo__title">{a.title}</p><p className="photo__body">{a.body}</p></div>
    </PhotoCard>
  ));
  return <GridBand id="anywhere" title="Bank anywhere, anytime" variant={4} cells={cells} />;
}

function Questions() {
  return (
    <section className="wrap faq" aria-labelledby="faq-title">
      <h2 id="faq-title" className="band__title">Have a question? Find answers here</h2>
      <ul>{HOME.questions.map((q) => <li key={q.q}><details><summary>{q.q}</summary><p>{q.a}</p></details></li>)}</ul>
    </section>
  );
}

function App() {
  return (
    <PublicPage source={[REFERENCE.home, REFERENCE.onlineBanking]}>
      <h1 className="visually-hidden">GIFbank personal banking</h1>
      <Hero />
      <Find />
      <Manage />
      <Anywhere />
      <Questions />
    </PublicPage>
  );
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
