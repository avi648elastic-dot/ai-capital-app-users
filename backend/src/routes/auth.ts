c5a145
#10 extracting sha256:3697be50c98b9d071df4637e1d3491d00e7b9f3a732768c876d82309b3c5a145 3.2s done
#10 sha256:461077a72fb7fe40d34a37d6a1958c4d16772d0dd77f572ec50a1fdc41a3754d 446B / 446B done
#10 extracting sha256:461077a72fb7fe40d34a37d6a1958c4d16772d0dd77f572ec50a1fdc41a3754d
#10 extracting sha256:461077a72fb7fe40d34a37d6a1958c4d16772d0dd77f572ec50a1fdc41a3754d 0.0s done
#10 sha256:cd26c28fac9edd874625f99977e6340763bfcf5012f2cdb04b7b7771d0ec733d 92B / 92B done
#10 extracting sha256:cd26c28fac9edd874625f99977e6340763bfcf5012f2cdb04b7b7771d0ec733d 0.0s done
#10 sha256:8b6dcf6e0d4f6ee005d7824cfe2c67866ccd309d100580d1db55f0af6e24adde 23.61kB / 23.61kB done
#10 extracting sha256:8b6dcf6e0d4f6ee005d7824cfe2c67866ccd309d100580d1db55f0af6e24adde 0.0s done
#10 sha256:993be9e57a07511a10a5aab92ea17db36567d3b95d2fd7316e692e812a895b52 16.78MB / 42.20MB 0.2s
#10 sha256:993be9e57a07511a10a5aab92ea17db36567d3b95d2fd7316e692e812a895b52 42.20MB / 42.20MB 0.4s done
#10 extracting sha256:993be9e57a07511a10a5aab92ea17db36567d3b95d2fd7316e692e812a895b52
#10 extracting sha256:993be9e57a07511a10a5aab92ea17db36567d3b95d2fd7316e692e812a895b52 22.8s done
#10 CACHED
#11 [5/6] COPY backend/ .
#11 DONE 0.1s
#12 [6/6] RUN npm run build
#12 0.249 
#12 0.249 > aicapital-backend@1.0.0 build
#12 0.249 > tsc
#12 0.249 
#12 3.512 src/routes/auth.ts(49,33): error TS18046: 'user._id' is of type 'unknown'.
#12 3.512 src/routes/auth.ts(95,33): error TS18046: 'user._id' is of type 'unknown'.
#12 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
------
 > [6/6] RUN npm run build:
0.249 
0.249 > aicapital-backend@1.0.0 build
0.249 > tsc
0.249 
3.512 src/routes/auth.ts(49,33): error TS18046: 'user._id' is of type 'unknown'.
3.512 src/routes/auth.ts(95,33): error TS18046: 'user._id' is of type 'unknown'.
------
Dockerfile:13
--------------------
  11 |     
  12 |     # בניית TypeScript ל-JS
  13 | >>> RUN npm run build
  14 |     
  15 |     EXPOSE 5000
--------------------
error: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
error: exit status 1
