# RESEARCH — Karma & Diplomacy Systems (for WAYLIGHT v3.22)
Sources: Bannerlord's criminal rating ([gamepressure explainer](https://www.gamepressure.com/newsroom/bannerlord-criminal-rating-explained-how-to-get-rid-of-it/z24f71), [PC Gamer crime & punishment](https://www.pcgamer.com/heres-how-crime-and-punishment-will-work-in-mount-and-blade-2-bannerlord/)) and CK3's opinion/dread model ([ACOUP's CK3 analysis](https://acoup.blog/2022/10/07/collections-teaching-paradox-crusader-kings-iii-part-iii-constructivisting-a-kingdom/)), plus genre knowledge of both games' mercenary/smuggling loops.

## What Bannerlord teaches
Criminal rating is tracked PER KINGDOM, not globally: crimes in one territory do not follow you into
another. It is raised by degrees (smuggling is minor, caravan raiding major), its consequences are
gates (fines, entry restriction, prosecution), and it goes away two ways: paying/settling, or slow
decay with time. The design lesson: locality plus settlement makes crime a PLACE-SHAPED risk, never a
global morality meter.

## What CK3 teaches
Opinion and dread are two INDEPENDENT axes on the same relationships. The same act (an execution)
lowers some characters' opinion, raises others', and raises dread with almost everyone — fear works
where love does not, and neither is "the good one." The design lesson: two currencies, both biased,
neither a mirror of the other — exactly MIVIM's Han Solo law.

## The WAYLIGHT mapping
- **RENEGADE** = CK3-style second axis: a GLOBAL ledger of what the road knows you are willing to do.
  It only rises. Tiers change how the lawless side of the valley treats you — raiders respect the
  road's own — and unlock renegade work. It is not the anti-appreciation.
- **HEAT** = Bannerlord's per-territory rating: getting CAUGHT lands heat at THAT town only —
  wary keepers, inspections, colder welcomes. It decays with time, or is settled at the terminal
  (the fine). Clean work lands no heat anywhere.
- **APPRECIATION** stays what it is — and can RISE from a renegade act (smuggled smokes reaching
  people who wanted them), fall from a caught one, or ignore the whole affair. Independent, biased,
  never a mirror.
- **Consequences are SEEN**: caught towns greet you differently; supplied towns visibly lounge and
  smoke in the yard; raider camps shrink their claim against a road's-own walker and change what
  they shout. Never text-only.
