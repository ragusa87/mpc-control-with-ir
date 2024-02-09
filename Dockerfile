
# build ir-keytable - it's not available on amd64
# https://pkgs.alpinelinux.org/packages?name=ir_keytable&branch=edge&repo=&arch=&maintainer=
# You can try "apk add ir_keytable" instead
FROM balenalib/amd64-alpine as build
RUN install_packages build-base alsa-lib-dev argp-standalone eudev-dev libjpeg-turbo-dev linux-headers qt5-qtbase-dev
# https://git.alpinelinux.org/aports/tree/community/v4l-utils/APKBUILD
RUN wget https://distfiles.alpinelinux.org/distfiles/edge/v4l-utils-1.24.1.tar.bz2 && \
    tar -xf v4l-utils-1.24.1.tar.bz2 && \
    cd v4l-utils-1.24.1 && \
    ./configure && \
    make && \
    make install

FROM balenalib/amd64-alpine-node:18 as base
# Install ir_keytable (from build above)
COPY --link --from=build /usr/local/bin/ir-keytable /usr/local/bin/ir-keytable
COPY --link --from=build /usr/lib/libintl.so.8 /usr/lib/
COPY --link --from=build /lib/ld-musl-x86_64.so.1 /lib/

ENV PULSE_SERVER=tcp:localhost:4317

RUN mkdir -p /usr/lib/controller
WORKDIR /usr/lib/controller

# Es-Speak + paplay (mbrola not supported ?)
RUN install_packages espeak pulseaudio-utils
RUN install_packages pulseaudio-utils


RUN mkdir -p /etc/rc_keymaps/
COPY L336 /etc/rc_keymaps/L336
#RUN /usr/local/bin/ir-keytable -c -w /etc/rc_keymaps/L336

# Npm install (with node-gyp depencencies)
#RUN install_packages python3 build-base
COPY package.json /usr/lib/controller/
COPY package-lock.json /usr/lib/controller/
RUN npm install 

# Main app
COPY play.sh /usr/lib/controller/play.sh
COPY playlist.sh /usr/lib/controller/
COPY main.js /usr/lib/controller/main.js
COPY start.sh /usr/lib/controller/start.sh
CMD ["/bin/sh", "/usr/lib/controller/start.sh"]


