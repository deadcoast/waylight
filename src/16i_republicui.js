'use strict';
/* Waylight v3.32 — THE BANNER SHEET: the Republic in session, on LEDGERLIGHT paper. One sheet,
   two ledgers: THE COURT (every banner the world knows, its stance sealed by lore or walked by
   play) and THE HOLDINGS (every town's light as a political fact, the doctrines that answer the
   dark ones, the mountain road, the kit of Farkeep). Reads the REP registries and the Republic
   engine only — a new faction row renders here with zero new UI code.
   v3.34 THE HOLDINGS: every place carries its OWNER on the plate (towns, camps, larders, bowls,
   reaches, the exile city, the door), the camps take the TAKING, THE WORLD ASKS ages its
   questions under the holdings, and THE WORLD'S OWN WARS reads the relations ledger.
   v3.39 THE LOSABLE HOLDINGS: a risen town takes THE STORMING beside the quell and reads GARRISONED
   with RELEASE; a watchpost shows its shields with STAND THE POST and the storm's warning in the
   reprisal season, a fallen post its price; a larder reads RAIDED or HUSHED. */

const RepublicUI = (() => {
  const $ = id => document.getElementById(id);

  const chip = pal => `<span class="rpChip"><i style="background:${pal.A}"></i><i style="background:${pal.B}"></i></span>`;
  const plate = st => { const d = REP.STANCES[st] || REP.STANCES.UNKNOWN; return `<span class="rpPlate" style="color:${d.col};border-color:${d.col}">${d.name.toUpperCase()}</span>`; };
  const cost = c => Systems.fmtCost(c);

  /* ---------- THE COURT ---------- */
  function courtRows() {
    let htm = '';
    for (const [fid, f] of Object.entries(FACT.FACTIONS)) {
      const rule = REP.RULES[fid] || {}, st = Republic.stance(fid);
      let ctl = '';
      if (rule.locked) ctl = `<span class="rpSeal">SEALED BY THE FOUNDING</span>`;
      else if (rule.mirror) ctl = `<span class="rpSeal dim">READ FROM THE ${rule.mirror === 'exileRank' ? 'GUILD LEDGER' : 'COLD DOOR'}</span>`;
      else {
        ctl = (rule.steps || []).map(s2 => {
          const on = st === s2, g = Republic.gateOk(fid, s2);
          return `<button class="miniBtn rpStep ${on ? 'on' : ''} ${g.ok ? '' : 'no'}" data-fid="${fid}" data-st="${s2}">${(REP.STANCES[s2] || {}).name || s2}</button>`;
        }).join('');
        const need = Object.entries(rule.gate || {}).map(([s2, g2]) => Republic.gateOk(fid, s2).ok ? '' : g2.line).filter(Boolean)[0];
        if (need) ctl += `<div class="rpGate">${need}</div>`;
      }
      /* the line: whole sentences until the row has enough voice, then a clean word-boundary cut */
      let line = '';
      for (const sen of f.culture.split('. ')) { line += (line ? '. ' : '') + sen; if (line.length > 90) break; }
      if (!line.endsWith('.')) line += '.';
      if (line.length > 170) line = line.slice(0, 167).replace(/\s+\S*$/, '') + '…';
      /* v3.35: the court reads the live flag — a banner IN THE FIELD or one still a RUMOUR */
      const field = f.live ? '' : `<span class="rpSeal dim" style="margin-left:6px">RUMOUR — NOT YET MET</span>`;
      htm += `<div class="rpRow">
        <div class="rpTop">${chip(f.pal)}<span class="rpName">${f.name}</span><span class="rpPeople">${f.people}</span>${plate(st)}${field}</div>
        <div class="rpLine">${line}</div>
        <div class="rpCtl">${ctl}</div></div>`;
    }
    return htm;
  }

  /* ---------- THE HOLDINGS: every place the world knows, with its OWNER on the plate (v3.34) ---------- */
  const owner = (name, col) => `<span class="rpPlate rpOwner" style="color:${col};border-color:${col}">${name}</span>`;
  const GOLD = 'var(--gold)', RUST = 'var(--rust)', DIM = 'var(--bone-faint)', GREY = '#8d979c', FLAME = '#ffb54f', LEAF = '#8fb08a', BONE = '#c9b98a';
  function holdingsRows() {
    const q = Republic.quell(), ct = Republic.courted();
    let htm = '';
    /* the towns: the light as a political fact, and who holds it */
    for (const id of DATA.stationOrder) {
      const st = S.stations[id], def = DATA.stations[id];
      const unlit = Republic.isUnlit(id), quiet = !!(S.quiet && S.quiet[id]) && !unlit, courted = ct && ct.id === id, held = Republic.isHeld(id);
      const own = unlit ? owner('THE UNLIT', RUST) : held ? owner('THE REPUBLIC — GARRISONED', GREY) : st.connected ? owner(courted ? 'THE ORDER — COURTED' : 'THE ORDER', courted ? '#e0a05e' : GOLD) : owner('NOBODY — DARK', DIM);
      const state = unlit ? '<span class="rpPlate" style="color:var(--rust);border-color:var(--rust)">UNLIT — BY CHOICE</span>'
        : quiet ? '<span class="rpPlate" style="color:var(--bone-faint);border-color:var(--line2)">QUIET — STARVED</span>'
        : st.connected ? '<span class="rpPlate" style="color:var(--gold);border-color:var(--gold)">LIT</span>'
        : '<span class="rpPlate" style="color:var(--bone-faint);border-color:var(--line2)">DARK</span>';
      let act = '';
      if (unlit) {
        if (q && (q.kind === 'quell' || q.kind === 'storm') && q.target === id) act = `<span class="rpGate">${q.kind === 'storm' ? 'THE COLUMN MARCHES ON THE DOOR' : 'THE COLUMN MARCHES'} — ${Math.round(q.t / q.dur * 100)}%</span>`;
        else {
          const SD = REP.DOCTRINE.storm, cs = Republic.canStorm(id);
          act = `<button class="miniBtn rpAct" data-quell="${id}" ${q ? 'disabled' : ''}>${REP.DOCTRINE.quell.name} — ${cost(REP.DOCTRINE.quell.cost)}</button>
          <button class="miniBtn rpAct" data-storm="${id}" ${(q || !cs.ok) ? 'disabled' : ''} title="${SD.line}">${SD.name} — ${cost(SD.cost)}</button>
          <span class="rpGate">or WALK there: the parley wants ${REP.DOCTRINE.parley.needLikes} likes at their door + ${cost(REP.DOCTRINE.parley.gift)}${cs.ok ? ` · or TAKE the town: ${SD.line}` : ` · the storming waits on the mountain road`}</span>`;
        }
      } else if (held) {
        const SD = REP.DOCTRINE.storm, h = Republic.held()[id], sh = h.shields || SD.garrison, restless = Republic.squareRestless(id);
        act = `<button class="miniBtn rpAct" data-release="${id}">RELEASE THE GARRISON</button>
          <button class="miniBtn rpAct" data-reinforce="${id}" ${sh >= SD.rise.garrisonMax ? 'disabled' : ''}>REINFORCE THE GARRISON — +1 shield · ${cost(SD.rise.reinforceCost)}</button>
          <span class="rpGate">held since day ${Math.floor(h.t0 / DATA.T.dayLen) + 1} · <b>${sh}/${SD.rise.garrisonMax}</b> shields under the pennant${h.own ? ` · <b style="color:var(--gold-hot)">${h.own} of the town's own</b> beside them (no tithe) — <b>${Republic.standingOwn(id)}</b> in the square this hour by THE HOURS they keep (the muster roll, AT THE SQUARES)` : st.likesTo >= SD.rise.recruitAt ? ` · <span style="color:var(--gold-hot)">the town loves the Order enough to stand its own — one walks in every ${Math.round((Republic.recruitEvery ? Republic.recruitEvery(id) : SD.rise.recruitEvery) / 60)} minutes${Republic.stonesOf && Republic.stonesOf(id) ? ` (slower by the ${Republic.stonesOf(id)} stone${Republic.stonesOf(id) > 1 ? 's' : ''} at the field's edge)` : ''}</span>` : ` · at ${SD.rise.recruitAt} likes the town stands its own`}${Republic.stonesOf && Republic.stonesOf(id) ? ` · <span style="color:var(--rust)">${Republic.stonesOf(id)} of its own at THE FIELD STONES${Republic.kinAt && Republic.kinAt(id) ? ' — their kin keep the place in the square' : ''}</span>` : ''} · the garrison has eaten ${h.ate || 0} rations off the shelf · the town's love: ${Math.round(st.likesTo)} likes${restless ? ` · <span style="color:var(--rust)">THE SQUARE IS RESTLESS — ${SD.rise.line}</span>` : ` · it holds while the shields stand and the town's love stays above ${SD.rise.likesAt}`}; released, it gives back ${SD.releaseLikes} likes and its own choice</span>`;
      } else if (courted) {
        const E = REP.EVENTS.unlitCourting;
        act = `<button class="miniBtn rpAct" data-hear="1">HEAR THEM OUT — ${cost(E.hearGift)}</button>
          <span class="rpGate">a half-flown shutter beside the door — the rising's warning. Hearing them out wants ${E.hearLikes} likes at their door; ignored, the rising takes this town first</span>`;
      }
      /* v3.44 — the stones a town has cut for its own, held or not: the kin keep the place, and the next one comes slower */
      const stonesN = Republic.stonesOf ? Republic.stonesOf(id) : 0;
      if (stonesN && !held) act += `<span class="rpGate" style="color:var(--rust)">${stonesN} of its own at THE FIELD STONES${Republic.kinAt && Republic.kinAt(id) ? ' — their kin keep the place in the square' : ''}; garrisoned again, it would stand its own ${Math.round(Math.min(REP.DOCTRINE.storm.rise.kin.maxStones, stonesN) * REP.DOCTRINE.storm.rise.kin.slowPerStone / 60)} minutes slower for the stones</span>`;
      htm += `<div class="rpHold"><span class="rpName">${def.name}</span>${own}${state}${act ? `<div class="rpCtl">${act}</div>` : ''}</div>`;
    }
    /* the camps: the raiders' ground, the light's, or the Republic's */
    const D = REP.DOCTRINE.take, mtOpen = Republic.mountain().phase === 'open';
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id]; if (!c) continue;
      const own = c.taken ? owner('THE REPUBLIC — WATCHPOST', GREY) : c.wired ? owner('ON THE WIRE — THE CHIEF KEEPS THE DOOR', GOLD) : c.pacified ? owner('STOOD DOWN — THE LIGHT\'S', GOLD) : owner('THE RAIDERS', RUST);   // v3.48
      const culled = c.culled && S.time - c.culled < DATA.T.dayLen;
      let act = '';
      const SW = REP.WATCHPOST.storm, rp = Republic.reprisal();
      const swept = c.swept && S.time - c.swept < REP.EVENTS.bunkerSweep.sweptDur;
      const roll = (cd.roll || ['knife']).map(k => FACT.CAMP_CLASSES[k] ? FACT.CAMP_CLASSES[k].name.toLowerCase() : k);   // v3.41: the camp's own, by trade
      if (c.taken) {
        const sh = c.taken.shields || REP.WATCHPOST.shields;
        act = `<button class="miniBtn rpAct" data-stand="${cd.id}" ${sh >= SW.shieldsMax ? 'disabled' : ''}>STAND THE POST — +1 shield · ${cost(SW.reinforceCost)}</button>
          <span class="rpGate">${c.storm ? `<span style="color:var(--rust)">THE KNIVES ARE AT THE FIRE — ${Math.max(0, Math.round(c.storm.dur - c.storm.t))}s to hold; you stand the post</span> · ` : ''}held since day ${Math.floor(c.taken.t0 / DATA.T.dayLen) + 1} · <b>${sh}/${SW.shieldsMax}</b> shields stand the fire · salvage tithe ${c.stash.length}/${REP.WATCHPOST.titheCap} by the post${rp && !c.storm ? ` · <span style="color:var(--rust)">the camps may STORM it by night this season — ${SW.knives} knives; the post holds when its shields, and the walker standing it, match them — stand it yourself and the storm is fought in the open</span>` : ''}</span>`;
      }
      else if (c.wired) act = `<span class="rpGate">a lit door since day ${Math.floor(c.wired.t / DATA.T.dayLen) + 1} — the relay at the fire, the chief at the board, the rags up for good</span>`;   // v3.48
      else if (c.pacified) act = '<span class="rpGate">the light reached them and they stood down by themselves — a rest stop on the road, and a gift once given</span>';
      else if (q && q.kind === 'take' && q.camp === cd.id) act = `<span class="rpGate">THE COLUMN MARCHES — ${Math.round(q.t / q.dur * 100)}%</span>`;
      else {
        const tc = Republic.takeCost(cd.id), SL = REP.EVENTS.bunkerSweep.sell, buy = Republic.canBuyCount(cd.id);
        act = `${swept ? `<button class="miniBtn rpAct" data-buy="${cd.id}" ${buy.ok ? '' : 'disabled'} title="${buy.ok ? SL.line : buy.line}">BUY THE COUNT — ${cost(SL.cost)}</button>` : ''}<button class="miniBtn rpAct" data-take="${cd.id}" ${(q || !mtOpen) ? 'disabled' : ''}>${D.name} — ${cost(tc)}</button>
        <span class="rpGate">the camp's own: <b>${roll.join(', ')}</b>${(cd.roll || []).includes('chief') ? (Republic.chiefGone(cd) ? ` · <span style="color:var(--rust)">SHORT A CHIEF — the rag on a stake, the road one knife short, the fire courting the Unlit</span>` : Republic.chiefUp(cd) ? (Republic.grudgeOf && Republic.grudgeOf(cd) ? ` · <span style="color:var(--rust)">THE CHIEF HOLDS A GRUDGE — you put his brother down; ${Republic.grudgeTarget(cd) ? Republic.grudgeTarget(cd).name : 'your nearest post'} is his first storm, the next night</span>` : ' · the chief keeps the fire') : '') : ''}${swept ? ` · <span style="color:#8fb08a">${buy.ok ? SL.line : buy.line}</span>` : ''}</span>
        <span class="rpGate">${c.lost ? `<span style="color:var(--rust)">the post here FELL on day ${Math.floor(c.lost.t / DATA.T.dayLen) + 1}${c.lost.n > 1 ? ` (${c.lost.n} times)` : ''} — the camps expect the column: the taking costs ×${Math.pow(SW.retakeMul, c.lost.n).toFixed(1)}</span> · ` : ''}${mtOpen ? D.line : 'the mountain road is not cut — Farkeep takes no ground it cannot reach'}${culled ? ' · a hooded stake stands in the ring: the Reapers took a runner last night' : ''}</span>`;
      }
      const sweptPlate = c.sold ? `<span class="rpPlate" style="color:#8fb08a;border-color:#8fb08a">SOLD BY THE SOCIETY · day ${Math.floor(c.sold / DATA.T.dayLen) + 1}</span>` : swept ? `<span class="rpPlate" style="color:#8fb08a;border-color:#8fb08a">COUNTED BY THE SOCIETY · ${Math.round(REP.EVENTS.bunkerSweep.sweptDur - (S.time - c.swept))}s</span>` : '';
      htm += `<div class="rpHold"><span class="rpName">${cd.name}</span>${own}${sweptPlate}<div class="rpCtl">${act}</div></div>`;
    }
    /* the presences the doctrine answers: larders and bowls */
    const all = (S.rep && S.rep.sites) || [];
    all.forEach((s2, i) => {
      if (s2.p === 'hollowfire') {
        if (s2.cleared) { htm += `<div class="rpHold"><span class="rpName">A HOLLOW FIRE</span>${owner('CLEARED — THE MOUNTAIN', GREY)}</div>`; return; }
        const marching = q && q.kind === 'burn' && q.site === i;
        const low = s2.raided && S.time - s2.raided < REP.EVENTS.larderRaid.lowDur, hushed = s2.hushed > S.time;
        const plate2 = hushed ? `<span class="rpPlate" style="color:#9aa4ff;border-color:#9aa4ff">HUSHED — THE FILE PASSED · ${Math.round(s2.hushed - S.time)}s</span>` : low ? `<span class="rpPlate" style="color:var(--rust);border-color:var(--rust)">RAIDED — BURNS LOW · ${Math.round(REP.EVENTS.larderRaid.lowDur - (S.time - s2.raided))}s</span>` : '';
        htm += `<div class="rpHold"><span class="rpName">A HOLLOW FIRE</span>${owner('THE HOLLOW FIRES', '#c25038')}${plate2}
          <div class="rpCtl">${marching ? `<span class="rpGate">THE STRIKE MARCHES — ${Math.round(q.t / q.dur * 100)}%</span>` : `<button class="miniBtn rpAct" data-burn="${i}" ${q ? 'disabled' : ''}>${REP.DOCTRINE.burn.name} — ${cost(REP.DOCTRINE.burn.cost)}</button>`}</div></div>`;
      } else if (s2.p === 'flameshrine') {
        const fed = s2.fedUntil > S.time, doused = s2.doused && S.time - s2.doused < REP.EVENTS.shrineRaid.dousedDur;
        const near = DATA.stations[nearestId(s2.x, s2.y)].name;
        htm += `<div class="rpHold"><span class="rpName">THE BOWL NEAR ${near.toUpperCase()}</span>${owner('THE FLAME KEEPERS', FLAME)}
          <span class="rpPlate" style="color:${fed ? FLAME : doused ? RUST : DIM};border-color:${fed ? FLAME : doused ? RUST : 'var(--line2)'}">${fed ? 'FED' : doused ? 'DOUSED' : 'COLD'}</span></div>`;
      }
    });
    /* the reaches, the exile city, the door — every place the table knows carries its banner */
    if (typeof Frontier !== 'undefined') for (const [rid, reach] of Object.entries(Frontier.REACHES)) {
      const fr = Frontier.info(rid);
      if (fr.phase === 'outpost') htm += `<div class="rpHold"><span class="rpName">${reach.outpost}</span>${owner('THE ORDER — OUTPOST', GOLD)}</div>`;
      else if (fr.phase !== 'unknown') htm += `<div class="rpHold"><span class="rpName">${reach.name}</span>${owner('NOBODY — CHARTED', DIM)}</div>`;
    }
    if (typeof Exile !== 'undefined') {
      if (Exile.phase() === 'open') htm += `<div class="rpHold"><span class="rpName">SHUTTERLIGHT</span>${owner('THE NOMADS', BONE)}</div>`;
      if (S.exile && S.exile.door === 'opened') htm += `<div class="rpHold"><span class="rpName">THE DIEFENBUNKER</span>${owner('THE SOCIETY', LEAF)}</div>`;
    }
    return htm;
  }
  function nearestId(x, y) { let b = 'haven', bd = 1e9; for (const id of DATA.stationOrder) { const d = U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y); if (d < bd) { bd = d; b = id; } } return b; }

  /* ---------- THE WORLD ASKS: questions put to the Republic, aging (v3.34) ---------- */
  function asksRows() {
    const asks = Republic.asks(), q = Republic.quell();
    if (!asks.length) return '<div class="rpGate">Nothing is asked of the Republic tonight. The banners settle their own wars — the ledger below reads how.</div>';
    let htm = '';
    for (const a of asks) {
      const left = Math.max(0, Math.round(a.dur - (S.time - a.t0)));
      const s2 = (S.rep.sites || [])[a.site];
      /* the mountain's answer: the taking at the camp nearest the wrong — gated like every taking */
      let nearCamp = null, bd = 1e9;
      if (s2) for (const cd of DATA.camps) { const c = S.camps[cd.id]; if (!c || c.pacified) continue; const d = U.dist(cd.x, cd.y, s2.x, s2.y); if (d < bd) { bd = d; nearCamp = cd; } }
      const takeBtn = nearCamp ? `<button class="miniBtn rpAct" data-take="${nearCamp.id}" ${(q || !Republic.canTake(nearCamp.id).ok) ? 'disabled' : ''}>${REP.DOCTRINE.take.name} at ${nearCamp.name}</button>` : '';
      htm += `<div class="rpHold"><span class="rpName">${a.name.toUpperCase()}</span>${owner('THE FLAME KEEPERS ASK', FLAME)}<span class="rpPlate" style="color:${left < 120 ? RUST : DIM};border-color:var(--line2)">${left}s TO ANSWER</span>
        <div class="rpCtl">${takeBtn}<span class="rpGate">${REP.EVENTS.shrineRaid.line}: walk to the bowl and FEED it by hand (${cost(REP.PRESENCES.flameshrine.feedCost)}), or send the mountain to the camp that did it. Silence costs a step of their stance.</span></div></div>`;
    }
    return htm;
  }

  /* ---------- THE WORLD'S OWN WARS: relations between banners (v3.34) ---------- */
  function relationRows() {
    const F = FACT.FACTIONS;
    return Republic.relations().map(r => `<div class="rpRel"><span class="rpRelPair">${chip(F[r.a].pal)} ${F[r.a].name} <i>·</i> ${chip(F[r.b].pal)} ${F[r.b].name}</span>
      <span class="rpPlate" style="color:${r.col};border-color:${r.col}">${r.name}</span><div class="rpGate">${r.line}${r.why ? ` — last moved by ${r.why}` : ''}</div></div>`).join('');
  }

  /* ---------- THE MOUNTAIN + THE KIT ---------- */
  function mountainRow() {
    const mt = Republic.mountain(), M = REP.MOUNTAIN;
    if (mt.phase === 'unknown') return `<div class="rpHold"><span class="rpName">THE MOUNTAIN PASS</span><span class="rpPlate" style="color:var(--bone-faint);border-color:var(--line2)">UNCUT</span>
      <div class="rpCtl"><button class="miniBtn rpAct" data-mountain="1">FUND THE ROAD — ${cost(M.cost)}</button><div class="rpGate">the road their grandfathers walked DOWN — cut it back UP and Farkeep answers the wire</div></div></div>`;
    if (mt.phase === 'cutting') return `<div class="rpHold"><span class="rpName">THE MOUNTAIN ROAD</span><span class="rpPlate" style="color:var(--gold);border-color:var(--gold)">CUTTING — ${Math.round(mt.t / M.dur * 100)}%</span></div>`;
    let kit = '';
    for (const [cls, row] of Object.entries(REP.KIT)) {
      const def = FACT.FK_CLASSES[cls];
      kit += `<button class="miniBtn rpAct" data-hire="${cls}">${def.name} — ${cost(row.fee)}${row.req === 'horse' ? ' · wants a horse' : ''}</button>`;
    }
    return `<div class="rpHold"><span class="rpName">FARKEEP</span><span class="rpPlate" style="color:var(--gold);border-color:var(--gold)">THE ROAD IS CUT</span>
      <div class="rpCtl">${kit}<div class="rpGate">the kit of the mountain — each answers from its own row when trouble closes</div></div></div>`;
  }

  function body() {
    const t = Republic.truce(), rp = Republic.reprisal();
    return `<div class="rpCols">
      <div class="rpCol"><div class="railHead">THE COURT — EVERY BANNER THE WORLD KNOWS</div>${courtRows()}
        <div class="railHead" style="margin-top:14px">THE WORLD'S OWN WARS — HOW THE BANNERS STAND TO EACH OTHER</div>${relationRows()}</div>
      <div class="rpCol"><div class="railHead">THE HOLDINGS — EVERY PLACE, AND WHO HOLDS IT</div>
        ${t ? '<div class="rpGate" style="margin-bottom:8px">A RAIDER TRUCE STANDS — the camps hold, and the horns hold WITH them</div>' : ''}
        ${rp ? `<div class="rpGate" style="margin-bottom:8px;color:var(--rust)">THE CAMPS' SEASON OF REPRISAL — ${Math.round(rp.t)}s: every camp that stands claims wider and runs quicker, and a held post may be STORMED by night</div>` : ''}
        ${Republic.unlitReprisal() ? `<div class="rpGate" style="margin-bottom:8px;color:var(--rust)">THE STORY OF THE STORMING — ${Math.round(Republic.unlitReprisal().t)}s: the Unlit's drum beats ×${REP.EVENTS.unlitReprisal.pressureMul} in every town with a lamp to douse</div>` : ''}
        ${holdingsRows()}${mountainRow()}
        <div class="railHead" style="margin-top:14px">THE WORLD ASKS</div>${asksRows()}
        <div class="docFoot">THE REPUBLIC OF CONNECTION · <b>WAYLIGHT CARRIES THE LIGHT · FARKEEP CARRIES THE WEIGHT</b></div></div></div>`;
  }

  function render() { const el = $('repBody'); if (el) el.innerHTML = body(); }
  function open() {
    UI.closeAllModals();
    $('republicOv').classList.remove('hidden');
    render();
    Systems.tut && Systems.tut('firstBanner');
    Snd.sfx.ui();
  }
  function close() { $('republicOv').classList.add('hidden'); }
  
  /* ---------- the desks on the table ---------- */
  function renderDesk(el, id) {
    const bankRow = `<div class="fdBank">BANKED · ${['metal', 'wood', 'ceramic', 'provisions', 'lumen'].map(k => `${k} <b>${Math.floor(S.banked[k] || 0)}</b>`).join(' · ')}</div>`;
    const mt = Republic.mountain(), M = REP.MOUNTAIN;
    let head = '[ THE MOUNTAIN PASS ]', bodyH = '';
    if (id === 'mountain') {
      if (mt.phase === 'unknown') bodyH = `<div class="fdLine">The Farkeepers walked DOWN this pass when the Order fed the Farlands famine. Nobody has walked it UP since — the galleries fell, the pins rusted, the cold kept the rest.</div>
        <div class="fdLine dim">Fund the road-gangs and the mountain opens: Farkeep answers the wire, and the kit of the mountain hires at their desk.</div>
        ${bankRow}<button class="fdBtn" data-act="rep_mountain">FUND THE MOUNTAIN ROAD — ${Systems.fmtCost(M.cost)}</button>`;
      else if (mt.phase === 'cutting') bodyH = `<div class="fdLine">The road-gangs are on the switchbacks — <b>${Math.round(mt.t / M.dur * 100)}%</b>. The mountain does not hurry and does not stop.</div>`;
      else { head = '[ THE MOUNTAIN ROAD ]'; bodyH = `<div class="fdLine">CUT AND HELD. Farkeep answers the wire; the Republic sits in session on the banner sheet, and the kit hires at Farkeep's own desk past the pass.</div>`; }
    } else {
      head = '[ FARKEEP ]';
      let kit = '';
      for (const [cls, row] of Object.entries(REP.KIT)) { const def = FACT.FK_CLASSES[cls]; kit += `<button class="fdBtn" data-act="rep_hire_${cls}">${def.name.toUpperCase()} — ${Systems.fmtCost(row.fee)}${row.req === 'horse' ? ' · WANTS A HORSE' : ''}</button>`; }
      bodyH = `<div class="fdLine">The Republic's muscle, at home. Stone rows up the pass, shield-doors, and the long practice yards where the kit is made.</div>
        <div class="fdLine dim">Longbowman — the wall of Farkeep, carried on a shoulder. Rifle Rider — a breech and a horse. Berserker — a pistol, a claymore, and no argument.</div>
        ${bankRow}${kit}<button class="fdBtn" data-act="rep_hall">WALK THE LONG HALL — the shield wall, the hearth, the yard</button><button class="fdBtn" data-act="rep_sheet">OPEN FACTIONS</button>`;
    }
    el.innerHTML = `<div class="fdHead"><span>${head}</span><button class="fdX" data-act="close">✕</button></div>${bodyH}`;
  }
  function deskAct(act) {
    if (act === 'rep_mountain') Republic.fundMountain();
    else if (act === 'rep_sheet') { Continent.close && Continent.close(); UI.toggleMap(false); open(); }
    else if (act === 'rep_hall') { Continent.close && Continent.close(); UI.toggleMap(false); Republic.enterRoom('farkeep_hall'); }   // v3.34: the hall is WALKED
    else if (act.startsWith('rep_hire_')) Republic.hireKit(act.slice(9));
  }

  /* ---------- wiring ---------- */
  function init() {
    const ov = $('republicOv');
    if (!ov) return;
    $('repClose').addEventListener('click', close);
    ov.addEventListener('click', e => {
      if (e.target === ov) { close(); return; }
      const t = e.target.closest ? e.target.closest('button') : null;
      if (!t) return;
      if (t.dataset.fid) { Republic.setStance(t.dataset.fid, t.dataset.st); render(); }
      else if (t.dataset.quell) { Republic.fundQuell(t.dataset.quell); render(); }
      else if (t.dataset.burn !== undefined) { Republic.fundBurn(+t.dataset.burn); render(); }
      else if (t.dataset.mountain) { Republic.fundMountain(); render(); }
      else if (t.dataset.hire) { Republic.hireKit(t.dataset.hire); render(); }
      else if (t.dataset.take) { Republic.fundTake(t.dataset.take); render(); }      // v3.34
      else if (t.dataset.hear) { Republic.hearOut(); render(); }
      else if (t.dataset.storm) { Republic.fundStorm(t.dataset.storm); render(); }   // v3.39
      else if (t.dataset.release) { Republic.release(t.dataset.release); render(); }
      else if (t.dataset.stand) { Republic.standPost(t.dataset.stand); render(); }
      else if (t.dataset.reinforce) { Republic.reinforce(t.dataset.reinforce); render(); }   // v3.40
      else if (t.dataset.buy) { Republic.buyCount(t.dataset.buy); render(); }   // v3.41
    });
    const rb = $('railRepublicBtn');
    if (rb) rb.addEventListener('click', () => { UI.toggleMap(false); open(); });
  }
  init();

  return { open, close, render, renderDesk, deskAct };
})();


