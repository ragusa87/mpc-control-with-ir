#!/bin/bash
set -xe

# MPC hangs if playing rtp files, the SIGTEM has no effect neither.
# kills it, remove the current state and start it again

STATEFILE=/var/lib/mpd/state

if [ -f $STATEFILE ]; then
        cat $STATEFILE
	hasRtp=$(cat $STATEFILE | grep rtp)
	if [[ "$hasRtp" == "" ]]; then
		echo "Remove current status"
		echo "" > $STATEFILE
	fi
fi

 echo "Kill mpd" 
 killall -s9 mpd || echo "Already killed"
 

 echo "Start mpd"
 systemctl --user start mpd
 mpc clear


