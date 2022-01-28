const LinuxInputListener = require('linux-input-device')
const input = new LinuxInputListener('/dev/input/event0')
const path = require('path')

// === GLOBAL VARS ==
// We have different set of commands based on the current mode.
let altmode = 0
// handle "current artist"
// to browse music by artist with the remote
let artistIndex = -1
let artistList = []

// Map all the commands by keys
const mode0 = new Map()
const mode1 = new Map()
const mode2 = new Map()
// To select the right command-map based on the current mode
const modesMap = [mode0, mode1, mode2]

// List of Artists/Actions to play with the key 0-9
const favoriteList = [
  [playCouleur3], // mode 0 key 0
  [playFavorites],
  ['Sytem of a Down'],
  ['Muse'],
  ['Twenty One Pilots'],
  ['Rammstein'],
  ['Marilyn Manson'],
  ['ACDC', 'A.C.D.C'],
  ['Lofofora'],
  ['Korn'],
  ['Imagine Dragons'], // mode 1 key 0
  ['Placebo'],
  ['Prodigy'],
  ['Evanescence'],
  ['IAM'],
  ['Brell'],
  ['Prodigy'],
  ['Noir désir'],
  ['Architects'],
  ['Puddle of Mudd'],
  ['Seether'], // mode 2 key 0
  ['Pleymo', 'Play Mo'],
  ['Soulfy', 'Soul-Fly'],
  ['Dub Inc', 'Dub. Inc']
]

// Controller KEY_CODES
// Keycodes from https://github.com/spotify/linux/blob/master/include/linux/input.h
// You can also see them via "ir-keytable -t" and pressing the remote button
// Or they are outputed to stdout if not mapped here but known by ir-keytable.
const KEY_WAKEUP = 143
const KEY_VIDEO_NEXT = 0x00f1
const KEY_PLAY = 207
const KEY_PAUSE = 119
const KEY_MUTE = 0x0071
const KEY_INFO = 0x166
const KEY_STOP = 128
const KEY_EJECT = 161
const KEY_VOLUMEDOWN = 114
const KEY_VOLUMEUP = 115
const KEY_NEXTSONG = 163
const KEY_PREVIOUSSONG = 165
const KEY_F11 = 0x1dc
const KEY_NUMERIC_0 = 0x0200

const KEY_OK = 352
const KEY_LEFT = 105
const KEY_RIGHT = 106
const KEY_MENU = 139
const KEY_UP = 103
const KEY_DOWN = 108

const KEY_FORWARD = 0x009f
const KEY_BACK = 0x009e
const KEY_TIME = 0x0167

// == FUNCTIONS ==

// Wait for ms milliseconds
async function sleep (ms) {
  return new Promise(resolve => { console.log('> sleep ' + ms); setTimeout(resolve, ms) })
}

// Run a program and output to stdout
async function run (cmd) {
  const exec = require('child_process').exec
  console.debug('> ' + cmd)
  return new Promise(function (resolve, reject) {
    function trace (error, stdout, stderr) {
      if (error) {
        console.error(stderr)
        console.log(stdout)
        reject(error, stderr)
        return
      }
      console.log(stdout)
      console.error(stderr)
      resolve(stdout, stderr)
    }
    exec(cmd, trace).unref()
  }).catch(exception => { if (cmd.indexOf('espeak') === -1) { say(('' + exception).substring(0, 40)) } })
}

// Execute actions callbacks one after another
async function chain (actions) {
  for (let i = 0; i < actions.length; i++) {
    await actions[i]()
  }
}

// Say something
async function say (text, convertSpecialChars = false) {
  // Replace special chars with normal one (Ex: Niño => nino)
  // See https://stackoverflow.com/a/37511463
  text = convertSpecialChars ? (text + '').normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text

  // for mbrola languages, install mbrola + mbrola-us1 packages.
  // see https://raspberry-pi.fr/faire-parler-raspberry-pi-espeak/
  await run('espeak -v mb-us1 "' + text + '"')
}

// Read the first line of "mpc status" who should be the playing song.
async function sayMpcStatus () {
  return run('mpc status').then(output => say(output.split('\n').shift(), true))
}

// Play the specified artist
async function artist (name, sayname) {
  return chain([
    () => say((sayname || name), true),
    () => run('~/play.sh ' + name.replace(/ /g, '+'))
  ])
}

// Run a helper to output audio to ueboom
async function pairUeBoom () {
  return await chain([
    () => say('u e boom'),
    () => run(path.join(__dirname, '/ueboom.sh'))
  ])
}

// Play couleur3, as it's a stream, it's slow to init.
async function playCouleur3 () {
  return await chain([
    () => say('Couleur 3'),
    () => run('mpc clear'),
    () => sleep(500),
    () => run('mpc load Couleur3'),
    () => sleep(500),
    () => run('mpc stop'),
    () => sleep(500),
    () => run('mpc play')
  ])
}

// Play the "favorite" playlist
async function playFavorites () {
  return await chain([
    () => say('Favorites'),
    () => run('mpc clear'),
    () => run('mpc load Favorites'),
    () => sleep(500),
    () => run('mpc random'),
    () => run('mpc shuffle'),
    () => sleep(500),
    () => run('mpc play')
  ])
}

// Load the list of artists with "mpc list artists"
async function artistListLoad (forceLoad = false) {
  if (artistList.length === 0 || forceLoad) {
    artistIndex = 0
    await run('mpc list artist').then(output => {
      // Remove the "The " from the artist. Then sort alphabetically
      // So "The Rapture" is classified on R as "Rapture"
      artistList = output.split('\n').filter(el => !!el).map(el => String(el).replace(/^The /ig, '').trim()).sort()
      console.log('Loaded ' + artistList.length + ' artists')
      return artistList.length
    })
  }
  return artistList.length
}

// Play the current artist
async function artistListPlaySelection () {
  await artistListLoad()
  if (isNaN(artistIndex) || artistIndex === undefined || artistIndex < 0 || artistIndex > artistList.length - 1) {
    artistIndex = 0
  }

  if (artistList[artistIndex]) {
    return artist(artistList[artistIndex])
  }
  return Promise.reject(new Error('Invalid selection'))
}

// Get the next/previous with a different letter (to jump faster)
async function artistListByLetter (increment) {
  await artistListLoad()

  const list = [...artistList].map((e) => {
    return e.substring(0, 1).toLowerCase()
  })
  if (artistIndex < 0) {
    return artistIndex
  }

  const letter = list[artistIndex]
  console.log('Current letter : << ' + letter + ' >>. Index ' + artistIndex)
  const nextIndex = () => {
    const maxIteration = list.length
    let nbIteration = 0
    let i = artistIndex
    while (nbIteration < maxIteration) {
      nbIteration++
      // Be sure we loop in reverse order (this is buggy)
      i = i + increment < 0 ? list.length - i + increment : i + increment
      if (i >= 0 && i < list.length && list[i] !== letter) {
        // on reverse order, continue to reverse until we find the first next letter and not the last one.
        if (increment < 0) {
          while (i - 1 >= 0 && list[i - 1] === list[i]) {
            i = i - 1
          }
        }
        return i
      }
    }
    return 0
  }

  artistIndex = nextIndex()
  console.log('Next letter: << ' + list[artistIndex] + ' >> at index ' + artistIndex + ' like ' + artistList[artistIndex])
  say(list[artistIndex], true)
}

// Move to the previous/next artist
async function artistListByIncrement (number) {
  await artistListLoad()
  artistIndex = artistIndex + number
  artistIndex = Math.max(0, (artistIndex) % (artistList.length + 1))
  console.log('index', artistIndex, 'length', artistList.length, 'item', artistList[artistIndex])
  if (artistList.length > 0) {
    say(artistList[artistIndex], true)
  } else {
    artistIndex = 0
  }
}

// Generic behaviour for all the numeric keys.
async function playByKeyNumber (index) {
  index = Math.min(favoriteList.length - 1, index)
  index = Math.max(0, index)
  if (typeof favoriteList[index][0] === 'function') {
    return favoriteList[index][0]()
  }
  return await artist(favoriteList[index][0], favoriteList[index][1] || false)
}

// Switch to the next mode
async function nextMode () {
  altmode = (++altmode) % modesMap.length
  return await say('Mode. ' + altmode)
}

// == Start mapping the keys ==
mode0.set(KEY_FORWARD, () => run('mpc seek +5'))
mode0.set(KEY_BACK, () => run('mpc seek -5'))
mode0.set(KEY_PAUSE, () => run('mpc pause'))
mode0.set(KEY_PLAY, () => run('mpc toggle'))
mode0.set(KEY_NEXTSONG, () => run('mpc next'))
mode0.set(KEY_PREVIOUSSONG, () => run('mpc prev'))
mode0.set(KEY_VOLUMEDOWN, () => run('pactl set-sink-volume @DEFAULT_SINK@ -15%'))
mode0.set(KEY_VOLUMEUP, () => run('pactl set-sink-volume @DEFAULT_SINK@ +15%'))
mode0.set(KEY_MUTE, () => run('pactl set-sink-mute @DEFAULT_SINK@ toggle'))

mode0.set(KEY_WAKEUP, () => say('set mode 1 first'))
mode0.set(KEY_VIDEO_NEXT, nextMode)
mode0.set(KEY_F11, () => run('mpc random on'))
mode0.set(KEY_STOP, () => run('mpc stop'))
mode0.set(KEY_INFO, () => pairUeBoom())
mode0.set(KEY_EJECT, () => run(path.join(__dirname, '/play.sh random 1')))

// Browse by artists
mode0.set(KEY_MENU, () => artistListLoad(true).then((nb) => say('Reloaded ' + nb + ' artists')))
mode0.set(KEY_RIGHT, () => artistListByIncrement(+1))
mode0.set(KEY_LEFT, () => artistListByIncrement(-1))
mode0.set(KEY_UP, () => artistListByLetter(-1))
mode0.set(KEY_DOWN, () => artistListByLetter(+1))
mode0.set(KEY_OK, () => artistListPlaySelection())
mode0.set(KEY_TIME, () => sayMpcStatus())

// Power off only on mode 1 for safety
mode1.set(KEY_WAKEUP, () => say('Powering off').then(() => run('sudo systemctl poweroff')))

// Map key KEY_NUMERIC_0 to KEY_NUMERIC_9 in each mode
modesMap.forEach((map, index) => {
  for (let key = 0; key < 10; key++) {
    map.set(KEY_NUMERIC_0 + key, () => playByKeyNumber(index * 10 + key))
  }
})

// When we press a key..
input.on('state', function (value, key, kind) {
  if (!value) {
    return
  }
  // Get the right commandmap based on the mode
  const commands = modesMap[altmode]

  // Use the command for the current key, fallback to mode0.
  if (commands.has(key)) {
    commands.get(key)()
  } else if (mode0.has(key)) {
    mode0.get(key)()
  } else {
    // The is not mapped, output it in stdout.
    console.log('State is now:', value, 'for key', key, 'of kind', kind, ', mode ', altmode)
  }
})

// Error handling for inputs
input.on('error', console.error)

// start by querying for the initial state.
input.on('open', () => input.query('EV_SW', 0))
