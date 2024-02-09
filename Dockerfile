FROM balenalib/amd64-alpine-node:18



ENV PULSE_SERVER=tcp:localhost:4317

RUN mkdir -p /usr/lib/controller
WORKDIR /usr/lib/controller

# Es-Speak + paplay (mbrola not supported ?)
RUN install_packages espeak pulseaudio-utils

RUN install_packages pulseaudio-utils

# Install ir-codes
RUN install_packages ir_keytable
RUN mkdir -p /etc/rc_keymaps/
COPY L336 /etc/rc_keymaps/L336
#RUN /usr/bin/ir-keytable -c -w /etc/rc_keymaps/L336

# Npm install (with node-gyp depencencies)
RUN install_packages python3 build-base
COPY package.json /usr/lib/controller/
RUN npm install 

# Main app
COPY play.sh /usr/lib/controller/play.sh
COPY playlist.sh /usr/lib/controller/
COPY main.js /usr/lib/controller/main.js
CMD ["/usr/bin/bash", "-c", "/usr/bin/ir-keytable -c -w /etc/rc_keymaps/L336 ; npm main.js"]


