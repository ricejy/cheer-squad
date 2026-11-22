import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Crowd } from '../types'

import { makeColors } from './make-colors.js'

// Milky rice paper by day, a dark earthenware jar by night, celadon glaze for the accent.
const { theme, problems } = makeColors({
  label: 'Rice wine',
  roles: { accent: '#3f8f78', danger: '#b5402f', success: '#5d8a3a', warning: '#b07a1a', pro: '#7a5c9c' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#ebe7da',
        'surface-1': '#f2efe4',
        'surface-2': '#f8f6ee',
        'text-primary': '#22271f',
        'text-secondary': '#484e42',
        'text-muted': '#5f6558',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#161a17',
        'surface-1': '#1d221e',
        'surface-2': '#242a25',
        'surface-3': '#29302a',
        'text-primary': '#ece9dd',
        'text-secondary': '#c9c7b8',
        'text-muted': '#a5a696',
      },
    },
  },
})

// Rice grains drifting slowly upward, like sediment stirred in a bowl. Placed by a
// fixed sequence, and each one's place in its drift is taken from the clock, so a
// redraw carries every grain on from where it was and none jumps.
const buildGrains = (seconds: number): string => {
  let seed = 7
  const rand = (): number => {
    seed = (seed * 16807) % 2147483647

    return seed / 2147483647
  }
  const grains: string[] = []

  for (let i = 0; i < 46; i++) {
    const x = Math.round(rand() * 1600)
    const y = Math.round(rand() * 1000)
    const rx = (5 + rand() * 5).toFixed(1)
    const ry = (2 + rand() * 1.6).toFixed(1)
    const turn = Math.round(rand() * 180)
    const period = Math.round(38 + rand() * 40)
    const delay = (-((rand() * 60 + seconds) % period)).toFixed(2)
    const opacity = (0.1 + rand() * 0.16).toFixed(2)

    grains.push(
      `<g style="animation:rise ${period}s linear ${delay}s infinite">` +
        `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${opacity}" transform="rotate(${turn} ${x} ${y})"/></g>`,
    )
  }

  return (
    '<defs><radialGradient id="glow" cx="80%" cy="10%" r="70%">' +
    '<stop offset="0" stop-color="#3f8f78" stop-opacity="0.16"/><stop offset="1" stop-color="#3f8f78" stop-opacity="0"/>' +
    '</radialGradient></defs>' +
    '<rect width="1600" height="1000" fill="url(#glow)"/>' +
    // Two copies, one a screen below, so the field never runs empty.
    `<g fill="#8fae9c">${grains.join('')}<g transform="translate(0 1000)">${grains.join('')}</g></g>`
  )
}

// Every stickman is drawn about the same body: feet on y = 84, hips at 60,
// shoulders at 44, head at 32. Arms hang from a group set at the shoulder, so
// a CSS turn of that group swings them from there.
const HEAD = '<circle class="skin" cy="32" r="7"/>'
const BODY = '<path d="M0 39V60M0 60L-8 84M0 60L8 84"/>'
const shoulder = (cls: string, arms: string, delay = 0): string =>
  `<g transform="translate(0 44)"><g class="${cls}" style="animation-delay:${delay}s">${arms}</g></g>`

// A pom-pom: a fluffy ball of ribbons.
const pom = (x: number, y: number): string =>
  `<circle cx="${x}" cy="${y}" r="7" fill="#ffd23f" stroke="#ff4f8b" stroke-width="3.2" stroke-dasharray="2.2 1.6"/>`

// The cheerleader: ponytail, pleated skirt, pom-poms high, jumping.
const cheerleader =
  '<path d="M5 28q9 2 7 12" stroke-width="3"/>' +
  HEAD +
  BODY +
  '<path d="M-10 68L0 55L10 68z" fill="#e8334a" stroke-width="2"/>' +
  shoulder('shake', '<path d="M0 0L-13 -18M0 0L13 -18"/>' + pom(-14, -20) + pom(14, -20))

// The idol fan: headband and happi coat, two glow sticks swinging in arcs.
const idolFan =
  HEAD +
  '<path d="M-7 29h14" stroke="#ffffff" stroke-width="3.4"/><circle cx="0" cy="29" r="2" fill="#e8334a" stroke="none"/>' +
  BODY +
  '<path d="M-6 40h12l2 18h-16z" fill="#3a6fd8" stroke-width="2"/>' +
  shoulder('glowL', '<path d="M0 0L-12 -14"/><path d="M-12 -14L-17 -27" stroke="#ff5fd2" stroke-width="4" class="glow"/>') +
  shoulder('glowR', '<path d="M0 0L12 -14"/><path d="M12 -14L17 -27" stroke="#4fe3ff" stroke-width="4" class="glow"/>')

// The ouendan: a long pole and a big banner reading "certain victory".
const flagBearer =
  HEAD +
  '<path d="M-7 29h14" stroke="#ffffff" stroke-width="3.4"/>' +
  BODY +
  shoulder(
    'pole',
    '<path d="M0 0L8 -6M0 0L8 2"/><path d="M8 26V-52" stroke="#8a5a36" stroke-width="2.6"/>' +
      '<g class="flutter"><path d="M8 -52h30v26h-30z" fill="#ffffff" stroke-width="2"/>' +
      '<text x="23" y="-33" class="kanji">必勝</text></g>',
  )

// The world cup fan: painted face, scarf stretched overhead, jumping.
const worldCupFan =
  '<path d="M0 25a7 7 0 0 0 0 14z" fill="#2fa84f" stroke="none"/><path d="M0 25a7 7 0 0 1 0 14z" fill="#ffd23f" stroke="none"/>' +
  '<circle cy="32" r="7" fill="none"/>' +
  BODY +
  shoulder(
    'scarf',
    '<path d="M0 0L-14 -16M0 0L14 -16"/>' +
      '<path d="M-18 -22h36v7h-36z" fill="#e8334a" stroke-width="1.6"/>' +
      '<path d="M-12 -22v7M-4 -22v7M4 -22v7M12 -22v7" stroke="#ffffff" stroke-width="2.4"/>',
  )

// The foam finger fan, pumping a giant "number one" hand.
const foamFan =
  HEAD +
  BODY +
  '<path d="M0 44L-9 56"/>' +
  shoulder(
    'pump',
    '<path d="M0 0L9 -12"/>' +
      '<path d="M3 -12h14v-10h-4v-16a3 3 0 0 0 -6 0v16h-4z" fill="#ff8a1f" stroke-width="2" stroke-linejoin="round"/>' +
      '<text x="10" y="-15" class="one">#1</text>',
  )

// The drummer, beating a bass drum on the hip.
const drummer =
  HEAD +
  '<path d="M-7 27q7 -9 14 0z" fill="#3a6fd8" stroke-width="2"/>' +
  BODY +
  '<ellipse cx="14" cy="62" rx="9" ry="12" fill="#f4e6c8" stroke-width="2.4"/><path d="M5 62h18" stroke="#e8334a" stroke-width="2"/>' +
  shoulder('beat', '<path d="M0 0L10 6L15 -2"/><path d="M15 -2L22 -8" stroke="#8a5a36" stroke-width="2.4"/>') +
  '<path d="M0 44L-10 54"/>'


const STYLE =
  '<style>' +
  '.sq,.sq g{stroke:#2a2622;stroke-width:3;stroke-linecap:round;fill:none}' +
  '.skin{fill:#fffaf0}' +
  '.sq .bit{stroke:none}' +
  'text{stroke:none;font-family:system-ui,sans-serif;font-weight:800;text-anchor:middle}' +
  '.chant{fill:#e8334a;font-size:12px;letter-spacing:.5px}' +
  '.kanji{fill:#e8334a;font-size:11px}' +
  '.one{fill:#2a2622;font-size:6px}' +
  '@media (prefers-color-scheme:dark){.sq,.sq g{stroke:#ece6da}.skin{fill:#2b2723}.one{fill:#2a2622}}' +
  '@keyframes jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}' +
  '@keyframes shake{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}' +
  '@keyframes swingL{0%,100%{transform:rotate(-30deg)}50%{transform:rotate(25deg)}}' +
  '@keyframes swingR{0%,100%{transform:rotate(30deg)}50%{transform:rotate(-25deg)}}' +
  '@keyframes pole{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}' +
  '@keyframes flutter{0%,100%{transform:skewY(0)}50%{transform:skewY(6deg)}}' +
  '@keyframes scarf{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}' +
  '@keyframes pump{0%,100%{transform:rotate(10deg)}50%{transform:rotate(-20deg)}}' +
  '@keyframes beat{0%,100%{transform:rotate(-25deg)}50%{transform:rotate(15deg)}}' +
  '@keyframes glow{0%,100%{opacity:1}50%{opacity:.55}}' +
  '@keyframes fall{from{transform:translateY(0) rotate(0)}to{transform:translateY(420px) rotate(320deg)}}' +
  '@keyframes rise{from{transform:translateY(60px)}to{transform:translateY(-1060px)}}' +
  '.jump{animation:jump .8s ease-in-out infinite}' +
  '.shake{animation:shake .3s ease-in-out infinite}' +
  '.glowL{animation:swingL .55s ease-in-out infinite}' +
  '.glowR{animation:swingR .55s ease-in-out infinite}' +
  '.glow{animation:glow .55s ease-in-out infinite}' +
  '.pole{animation:pole 1.6s ease-in-out infinite}' +
  '.flutter{transform-origin:8px -52px;animation:flutter .5s ease-in-out infinite}' +
  '.scarf{animation:scarf .4s ease-in-out infinite}' +
  '.pump{animation:pump .45s ease-in-out infinite}' +
  '.beat{animation:beat .4s ease-in-out infinite}' +
  '.bit{animation:fall 3.4s linear infinite}' +
  '@media (prefers-reduced-motion:reduce){g,rect,ellipse{animation:none!important}}' +
  '</style>'


// Each side is one long line of the squad, top to bottom of the window:
// cheerleaders between each of the other fans, with a chant sign every few
// places. Each cheers a beat after the one above, so a wave runs down the line.
const CELL = 112
// Places above and below the middle; enough to fill a tall window.
const REACH = 10
// The middle of a stickman, from its head (25) to its feet (84).
const BODY_MID = 55

const sign = (chant: string): string =>
  '<path d="M-34 -10h68v22h-68z" fill="#fff6d6" stroke-width="2.2"/>' +
  `<text x="0" y="5.5" class="chant" textLength="58" lengthAdjust="spacingAndGlyphs">${chant}</text>`

const line = (chant: string, fans: string[], lead: number): string => {
  // A cheerleader, a fan, a cheerleader, the next fan, ... and a sign.
  const round = fans.flatMap(fan => [cheerleader, fan])
  const cycle = [...round, 'SIGN']
  let out = ''

  for (let k = -REACH; k <= REACH; k++) {
    const what = cycle[(((k + REACH) % cycle.length) + cycle.length) % cycle.length]
    const delay = (lead + (k + REACH) * 0.1) % 0.8
    const y = k * CELL
    const art = what === 'SIGN' ? sign(chant) : what
    const lift = what === 'SIGN' ? 0 : -BODY_MID

    out += `<g transform="translate(0 ${y + lift})"><g class="jump" style="animation-delay:${delay.toFixed(2)}s">${art}</g></g>`
  }

  return out
}

// Confetti drifting down the whole line.
const confetti = (colours: string[]): string => {
  let out = ''

  for (let i = 0; i < 2 * REACH; i++) {
    const x = -30 + ((i * 23) % 60)
    const y = (i - REACH) * CELL
    const c = colours[i % colours.length]

    out += `<rect class="bit" x="${x}" y="${y}" width="4" height="6" fill="${c}" style="animation-delay:-${((i * 0.9) % 3.4).toFixed(1)}s"/>`
  }

  return out
}

const LEFT = line('GO CLAUDE!', [idolFan, flagBearer, worldCupFan], 0)
const RIGHT = line('THINK BIG!', [foamFan, drummer, worldCupFan], 0.4)
const LEFT_BITS = confetti(['#ff4f8b', '#ffd23f', '#4fe3ff', '#2fa84f'])
const RIGHT_BITS = confetti(['#ff8a1f', '#ff5fd2', '#3a6fd8', '#e8334a'])

const SCENE_NAME = 'cheer-squad-stands'

// The squad stands at a fixed size in CSS pixels, a set distance either side
// of the chat column's middle, so it stays beside the chat (which keeps its
// own width as the window grows) instead of drifting out with the window.
// Half the chat column's width (about 370px), plus room clear of its frost.
const BESIDE = 480
// The chat sits in the area right of the app's sidebar, so its middle is half
// the sidebar's width right of the window's middle.
const CHAT_SHIFT = 126
// The squad's own units to a CSS pixel.
const SCALE = 0.8

const place = (x: number, art: string): string =>
  `<g class="sq" transform="translate(${x} 0) scale(${SCALE})">${art}</g>`

// The squad, drawn once: it does not change between redraws.
const SQUAD = place(-BESIDE, `${LEFT_BITS}<g>${LEFT}</g>`) + place(BESIDE, `${RIGHT_BITS}<g>${RIGHT}</g>`)

// The scene: rice grains drifting up across the whole window, and the squad
// down both sides of the chat while Claude works.
const buildScene = (crowd: Crowd, now: number): string =>
  // No viewBox: a unit is a CSS pixel, and the drawing fills the window.
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' +
  STYLE +
  // The grains stretch to cover the window.
  '<svg width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">' +
  buildGrains(now / 1000) +
  '</svg>' +
  // The window's middle, where the squad is placed from.
  '<svg x="50%" y="50%" width="1" height="1" overflow="visible">' +
  `<g transform="translate(${CHAT_SHIFT} 0)">` +
  (crowd.isWorking ? SQUAD : '') +
  '</g>' +
  '</svg>' +
  '</svg>'

// A light frost over the backdrop.
const LOOK: ThemeSetArgs = { colors: theme, backdrop: { scene: SCENE_NAME, glass: { blur: 4, opacity: 0.62 } } }

const crowd = atom({ plugin: 'cheer-squad', key: 'crowd' } as const, { isWorking: false })

// Only write when something changed: every write redraws the scene.
async function setWorking($: EngineInterface, isWorking: boolean): Promise<void> {
  const was = await read($, crowd)

  if (was.isWorking !== isWorking) {
    await update($, crowd, () => ({ isWorking }))
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(text => text.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    await update($, crowd, () => ({ isWorking: false }))
    // Where no surface draws the look (a terminal), it is simply not shown.
    await $.theme.set(LOOK)

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await setWorking($, true)
      // Ask for the scene again outright: a write made as a turn starts does
      // not always bring a redraw with it.
      await $.theme.set(LOOK)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const answer = await next(e)

    if (e.agentId === undefined) {
      await setWorking($, false)
    }

    return answer
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    // Draw for whichever surface asks, so long as it can draw an Svg.
    const table = $.ui.resolve(e)

    if (!('Svg' in table) || e.props.scene !== SCENE_NAME) {
      return next(e)
    }
    const { Svg } = table
    const state = await read($, crowd)
    const doing = state.isWorking
      ? 'and two long lines of costumed stickmen down both sides of the chat, cheerleaders between idol fans, flag bearers, World Cup fans, foam-finger fans and drummers, doing a wave'
      : 'and the stands empty while Claude rests'

    return <Svg source={buildScene(state, await $.clock.now())} alt={`Rice grains drifting upward, ${doing}`} />
  })
}
