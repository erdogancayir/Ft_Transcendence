#!/bin/sh

cd /home/omeryumusak/webapi && npm install -g prisma -y && npx prisma migrate dev --name dev && npm run start &
/usr/sbin/sshd -D 