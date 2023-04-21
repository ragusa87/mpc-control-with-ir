#!/bin/bash
set -xe
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


