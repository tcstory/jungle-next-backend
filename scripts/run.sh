#!/usr/bin/env bash

clear
Mode=local NODE_ENV=development PORT=7020 ./node_modules/.bin/nodemon --watch app app/app.js
