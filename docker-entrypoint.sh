#!/bin/sh
# Fix ownership of the mounted Railway Volume before dropping to the
# unprivileged `nextjs` user. A freshly-attached volume's filesystem ships
# a root-owned `lost+found` directory that the `nextjs` user can't even
# scandir (EACCES) — Next.js's static file server crashes hard on that
# error when it enumerates public/media at startup. Only root can chown
# it, so this step has to run before the privilege drop below.
if [ -d /app/public/media ]; then
  chown -R nextjs:nodejs /app/public/media || true
fi

exec su -s /bin/sh nextjs -c "exec node server.js"
