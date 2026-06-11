# PHASE 0 Discovery Report

## Skille użyte
engineering-discipline, local-rag-for-llms, ai-coding-agents, subagent-driven-development, frontend-development, requesting-code-review, zolzotron-devops.

## Mac Studio / oMLX
Endpoint `http://127.0.0.1:8585/v1` odpowiada. Model `gemma-4-12B-it-nvfp4` jest dostępny. Prosty test API zwrócił `OK`.

## Lenovo Server
`192.168.8.112` nie odpowiedział na ping ani SSH. To blokuje fazę 7/8, nie blokuje przygotowania artefaktów.

## Porty
Mac: `8585` zajęty przez oMLX; `8088` i `18585` wolne lokalnie.

## Thinking
Nie zmieniano oMLX. Backend wysyła `thinking:false`; jeśli runtime wymaga GUI preset, potrzebna ręczna weryfikacja thinking OFF.

## Działania wymagające zgody
SSH Remote Login, Tailscale/Funnel, systemd, firewalld, instalacje na Lenovo.

## Rollback
Fazy 1–6: `git reset --hard <commit>` lub usunięcie katalogu. Fazy 7–8: backup `/opt`, disable systemd, `tailscale funnel reset`.

```text
## host/date
Thu Jun 11 04:07:27 CEST 2026
Mac-Studio
Darwin Mac-Studio 25.5.0 Darwin Kernel Version 25.5.0: Mon Apr 27 20:39:09 PDT 2026; root:xnu-12377.121.6~2/RELEASE_ARM64_T6020 arm64
ProductName:		macOS
ProductVersion:		26.5
BuildVersion:		25F71
\n## skills/tools
/opt/homebrew/bin/opencode
/Users/radek/.hermes/hermes-agent/venv/bin/python
Python 3.11.14
/usr/local/bin/node
v25.4.0
/usr/local/bin/npm
11.7.0
/usr/local/bin/git
git version 2.52.0
/usr/bin/ssh
OpenSSH_10.2p1, LibreSSL 3.3.6
/opt/homebrew/bin/tailscale
1.98.5
  tailscale commit: 295179bf294d3d076397bcef6815b1d6854e197d
  long version: 1.98.5-t295179bf2
  go version: go1.26.3
\n## ports mac
COMMAND     PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
python3.1 13098 radek    4u  IPv4 0xafe78839d889f9ff      0t0  TCP *:8585 (LISTEN)
python3.1 72462 radek    4u  IPv4 0xafe78839d889f9ff      0t0  TCP *:8585 (LISTEN)
\n## resources
Mac14,13
68719476736
12
/dev/disk3s1s1   926Gi    12Gi    23Gi    35%    459k  241M    0%   /
Mach Virtual Memory Statistics: (page size of 16384 bytes)
Pages free:                                   487829.
Pages active:                                2067860.
Pages inactive:                              1248031.
Pages speculative:                             72233.
Pages throttled:                                   0.
Pages wired down:                             212523.
Pages purgeable:                                4784.
"Translation faults":                     6525141112.
Pages copy-on-write:                       898054010.
\n## omlx health
models_http=200
models_count= 11
target_present= True
\n## omlx simple completion
chat_http= 200 latency= 1.42
content_preview= OK
finish= stop
\n## lenovo connectivity
PING 192.168.8.112 (192.168.8.112): 56 data bytes

--- 192.168.8.112 ping statistics ---
1 packets transmitted, 0 packets received, 100.0% packet loss
ssh: connect to host 192.168.8.112 port 22: Operation timed out
\n## ssh mac remote login
You need administrator access to run this tool... exiting!
\n## opencode smoke
/bin/bash: line 60: timeout: command not found

```
