# Control Music Player Daemon (MPD) with an Infrared Remote Controller (IR) 

Goal is to be able to control MPD via a Javascript Deamon listening on infrared input



```
Kernel events     node application     Bash files / proc calls

┌────┐            ┌───────────────┐    ┌─────┐
│ IR ├────────────►main.js deamon ├────► MPC │ (play/pause/load/lsplaylists/etc)
└────┘            └────┬─────┬───┬┘    └─────┘
  (mapped codes)       │     │   │
                       │     │   │     ┌────────────┐
                       │     │   └─────► PulseAudio │ (volume control, dual output with bluetooth)
                       │     │         └────────────┘
                       │     │
                       │     │         ┌───────────┐
                       │     └─────────► Bluetooth │ (connect via bluetoothctl)
                       │               └───────────┘
                       │
                       │               ┌────────┐
                       └───────────────► Lights │ (bash script that forward the resquest somewhere else..)
                                       └────────┘
```

See [main.js](main.js) for the code.

Features:

- Play specific mpd playlists
- Play songs by artists
- Connect to bluetooth devices for audio output
- Select artists with arrows (speaking names)

Requirements:

- nodejs / npm
- systemctl
- mpd
- pulseaudio
- Mapped controller with ir-keytable (L336 is provided as an example)
- espeak + mbrola + mbrola-us1

Setup:

- Use systemctl file [enable-ir.service](enable-ir.service) to load the keytable
- Use [mpc-ir.service](mpc-ir.service) to load the node application
- Install the node dependencies with `npm i`
- For bluetooth usage, make sure you define the remote bluetooth mac adress in the `bluetooth.sh` file or in the `mpc-ir.service` definition.

Usage:
- Use keys 0-9 to play prefefined artists or playlist
- Use keys ↑/↓ to select a letter A-Z 0-9
- Use keys ←/→ to select an artist based on the selected letter
- Use key ↻ (random) to play a random artist
- Use the "bluetooth" key to connect to bluetooth and dual play song.
- Use the "speak" key to output the current playing song
- ...

Note: This is a personal project running on a raspberry-pi 3. You will need to adapt it a lot to fit your need. Everything is mostly hardcoded.


