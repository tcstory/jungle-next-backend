#!/usr/bin/env bash

NODE_ENV=development PORT=7020 node app/app.js &

sleep 2

ab -k -c 10 -n 250 "http://localhost:7020/test"

kill %1

exit 0
