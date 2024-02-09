const InputEvent = require('input-event');
const input = new InputEvent('/dev/input/event0');
const keyboard = new InputEvent.Keyboard(input);
const path = require('path')

// === GLOBAL VARS ==
// We have different set of commands based on the current mode.
let altmode = 0
// handle "current artist"
// to browse music by artist with the remote
let artistIndex = -1
let artistList = []

// To select the right command-map based on the current mode
const modesMap = [new Map(), new Map(), new Map()]

// List of Actions to play with the key 0-9 in each mode
// (mode 0 => index 0-9; mode 1 => index 10-19; mode 2 => index 20-29, etc)
const favoriteList = [
  () => playPlaylist('Couleur3'), // mode 0 key 0
  () => playPlaylist('aaa_rts'),
  () => artist('System of A Down'),
  () => artist('Muse'),
  () => artist('Twenty One Pilots'),
  () => artist('Rammstein'),
  () => artist('Marilyn Manson'),
  () => artist('ACDC', 'A.C.D.C'),
  () => artist('Lofofora'),
  () => artist('Korn'),
  () => artist('Imagine Dragons'), // mode 1 key 0
  () => artist('Placebo'),
  () => artist('Prodigy'),
  () => artist('Evanescence'),
  () => artist('IAM', 'I.A.M'),
  () => artist('Brell'),
  () => artist('Slipknot', 'Slip-Knot'),
  () => artist('Noir désir'),
  () => artist('Architects'),
  () => artist('Puddle of Mudd'),
  () => artist('Seether'), // mode 2 key 0
  () => artist('Pleymo', 'Play Mo'),
  () => artist('Soulfy', 'Soul-Fly'),
  () => artist('Dub Inc', 'Dub. Inc')
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
  }).catch(exception => { if (cmd.indexOf('espeak') === -1) { say(('' + exception).replace(__dirname, '').substring(0, 40)) } })
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
  await run('espeak "' + text + '" --stdout | paplay')
}

// Read the first line of "mpc status" who should be the playing song.
async function sayMpcStatus () {
  return run('mpc status').then(output => say(output.split('\n').shift(), true))
}

// Play the specified artist
async function artist (name, sayname) {
  return chain([
    () => say((sayname || name), true),
    () => run(path.join(__dirname, '/play.sh') + ' "' + name + '"')
  ])
}

// Play a playlist with random order
async function playPlaylist (name) {
  //  Make sure the playlist exsist with mpc lsplaylists
  return await run('mpc lsplaylist').then(e => ('' + e).split('\n')).then(e => e.filter(n => n)).then(function (list) {
    if (!list.includes(name)) {
      console.log('Invalid playlist "' + name + '" use ' + JSON.stringify(list))
      throw new Error(name + " doesn't exist")
    }
    return chain([
      () => say(name),
      () => run('mpc clear'),
      () => run('mpc load "' + name + '"'),
      () => sleep(500),
      () => run('mpc random'),
      () => run('mpc shuffle'),
      () => sleep(500),
      () => run('mpc play')
    ])
  }).catch(error => say(error))
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
  if (typeof favoriteList[index] !== 'function') {
    throw new Error('favoriteList must use a function at index ' + index)
  }
  return favoriteList[index]()
}

// Switch to the next mode
async function nextMode () {
  altmode = (++altmode) % modesMap.length
  return await say('Mode. ' + altmode)
}

// == Start mapping the keys ==
modesMap[0].set(KEY_FORWARD, () => run('mpc seek +5'))
modesMap[0].set(KEY_BACK, () => run('mpc seek -5'))
modesMap[0].set(KEY_PAUSE, () => run('mpc pause'))
modesMap[0].set(KEY_PLAY, () => run('mpc toggle'))
modesMap[0].set(KEY_NEXTSONG, () => run('mpc next'))
modesMap[0].set(KEY_PREVIOUSSONG, () => run('mpc prev'))
modesMap[0].set(KEY_VOLUMEDOWN, () => run('pactl set-sink-volume @DEFAULT_SINK@ -15%'))
modesMap[0].set(KEY_VOLUMEUP, () => run('pactl set-sink-volume @DEFAULT_SINK@ +15%'))
modesMap[0].set(KEY_MUTE, () => run('pactl set-sink-mute @DEFAULT_SINK@ toggle'))

modesMap[0].set(KEY_WAKEUP, () => say('set mode 1 first'))
modesMap[0].set(KEY_VIDEO_NEXT, nextMode)
modesMap[0].set(KEY_F11, () => run('mpc random on'))
modesMap[0].set(KEY_STOP, () => run('mpc stop'))

modesMap[0].set(KEY_EJECT, () => run(path.join(__dirname, '/play.sh random 1')))

// Browse by artists
modesMap[0].set(KEY_MENU, () => artistListLoad(true).then((nb) => say('Reloaded ' + nb + ' artists')))
modesMap[0].set(KEY_RIGHT, () => artistListByIncrement(+1))
modesMap[0].set(KEY_LEFT, () => artistListByIncrement(-1))
modesMap[0].set(KEY_UP, () => artistListByLetter(-1))
modesMap[0].set(KEY_DOWN, () => artistListByLetter(+1))
modesMap[0].set(KEY_OK, () => artistListPlaySelection())
modesMap[0].set(KEY_TIME, () => sayMpcStatus())

// Power off only on mode 1 for safety
modesMap[1].set(KEY_WAKEUP, () => say('Powering off').then(() => run('sudo systemctl poweroff')))

// Map key KEY_NUMERIC_0 to KEY_NUMERIC_9 in each mode
modesMap.forEach((map, index) => {
  for (let key = 0; key < 10; key++) {
    map.set(KEY_NUMERIC_0 + key, () => playByKeyNumber(index * 10 + key))
  }
})


// State is now: { tssec: 1707504353, tsusec: 320792, type: 1, code: 517, value: 1 } for key undefined of kind undefined , mode  0
keyboard.on('keydown' , console.log);


// When we press a key..
keyboard.on('keypress', function ({value, code, type}) {
  if (!value) {
    return
  }
  // Get the right commandmap based on the mode
  const commands = modesMap[altmode]

  // Use the command for the current key, fallback to mode-0.
  if (commands.has(code)) {
    commands.get(code)().catch(e => say(e))
  } else if (modesMap[0].has(code)) {
    modesMap[0].get(code)().catch(e => say(e))
  } else {
    // The is not mapped, output it in stdout.
    console.log('State is now:', value, 'for code', code, 'of type', type, ', mode ', altmode)
  }
})

