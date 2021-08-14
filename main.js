const LinuxInputListener = require('linux-input-device')
const input = new LinuxInputListener('/dev/input/event0')
const path = require('path')
// Wait for ms milliseconds
function sleep (ms) {
  return new Promise(resolve => { console.log('> sleep ' + ms); setTimeout(resolve, ms) })
}

// Run a program and output to stdout
function run (cmd) {
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
async function say (text) {
  // for mbrola languages, install mbrola + mbrola-us1 packages.
  // see https://raspberry-pi.fr/faire-parler-raspberry-pi-espeak/
  await run('espeak -v mb-us1 "' + text + '"')
}

// Keycodes from https://github.com/spotify/linux/blob/master/include/linux/input.h
// You can also see them via "ir-keytable -t" and pressing the remote button
const KEY_WAKEUP = 143
const KEY_VIDEO_NEXT = 0x00f1
const KEY_PLAY = 207
const KEY_PAUSE = 119
const KEY_MUTE = 0x0071
const KEY_INFO = 0x166
const KEY_STOP = 128
const KEY_VOLUMEDOWN = 114
const KEY_VOLUMEUP = 115
const KEY_NEXTSONG = 163
const KEY_PREVIOUSSONG = 165
const KEY_F11 = 0x1dc
const KEY_NUMERIC_0 = 0x0200
const KEY_NUMERIC_1 = 0x0201
const KEY_NUMERIC_2 = 0x0202
const KEY_NUMERIC_3 = 0x0203
const KEY_NUMERIC_4 = 0x0204
const KEY_NUMERIC_5 = 0x0205
const KEY_NUMERIC_6 = 0x0206
const KEY_NUMERIC_7 = 0x0207
const KEY_FORWARD = 0x009f
const KEY_BACK = 0x009e
const KEY_TIME = 0x0167
let turnoffmode = false

const commands = new Map()
commands.set(KEY_FORWARD, () => run('mpc seek +5'))
commands.set(KEY_BACK, () => run('mpc seek -5'))
commands.set(KEY_PAUSE, () => run('mpc pause'))
commands.set(KEY_PLAY, () => run('mpc toggle'))
commands.set(KEY_WAKEUP, () => {
  if (turnoffmode) {
    say('Powering off').then(() => run('sudo systemctl poweroff'))
  } else {
    say('set mode first')
  }
})
commands.set(KEY_VIDEO_NEXT, () => {
  turnoffmode = !turnoffmode
  say(turnoffmode ? 'Off' : 'On')
})
commands.set(KEY_VOLUMEDOWN, () => run('pactl set-sink-volume @DEFAULT_SINK@ -15%'))
commands.set(KEY_VOLUMEUP, () => run('pactl set-sink-volume @DEFAULT_SINK@ +15%'))
commands.set(KEY_MUTE, () => run('~/mute.sh'))
commands.set(KEY_NEXTSONG, () => run('mpc next'))
commands.set(KEY_PREVIOUSSONG, () => run('mpc prev'))
commands.set(KEY_F11, () => run('mpc random on'))
commands.set(KEY_STOP, () => run('mpc stop'))
commands.set(KEY_INFO, () => {
  chain([
    () => say('u e boom'),
    () => run(path.join(__dirname, '/ueboom.sh'))
  ])
})
commands.set(KEY_NUMERIC_0, () => {
  chain([
    () => run('mpc clear'),
    () => sleep(500),
    () => run('mpc load Couleur3'),
    () => sleep(500),
    () => run('mpc stop'),
    () => sleep(500),
    () => run('mpc play')
  ])
})
commands.set(KEY_NUMERIC_1, () => {
  chain([
    () => run('mpc clear'),
    () => run('mpc load Favorites'),
    () => sleep(500),
    () => run('mpc random'),
    () => run('mpc shuffle'),
    () => sleep(500),
    () => run('mpc play')
  ])
})
commands.set(KEY_NUMERIC_2, () => run('~/play.sh System+Of+A+Down'))
commands.set(KEY_NUMERIC_3, () => run('~/play.sh Muse'))
commands.set(KEY_NUMERIC_4, () => run('~/play.sh Twenty+One+Pilots'))
commands.set(KEY_NUMERIC_5, () => run('~/play.sh Rammstein'))
commands.set(KEY_NUMERIC_6, () => run('~/play.sh Marilyn+Manson'))
commands.set(KEY_NUMERIC_7, () => run('~/play.sh ACDC'))
commands.set(KEY_TIME, () => {
  run('mpc status').then(output => say(output.split('\n').shift()))
})
input.on('state', function (value, key, kind) {
  if (!value) {
    return
  }

  if (commands.has(key)) {
    commands.get(key)()
  } else {
    console.log('State is now:', value, 'for key', key, 'of kind', kind)
  }
})

input.on('error', console.error)

// start by querying for the initial state.
input.on('open', () => input.query('EV_SW', 0))
