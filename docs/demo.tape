Output docs/demo.gif

Set Shell zsh
Set FontFamily "JetBrains Mono"
Set FontSize 14
Set Width 800
Set Height 520
Set Padding 16
Set Theme { "name": "warroom", "black": "#1e1e2e", "red": "#f38ba8", "green": "#a6e3a1", "yellow": "#f9e2af", "blue": "#89b4fa", "magenta": "#cba6f7", "cyan": "#89dceb", "white": "#cdd6f4", "brightBlack": "#585b70", "brightRed": "#f38ba8", "brightGreen": "#a6e3a1", "brightYellow": "#f9e2af", "brightBlue": "#89b4fa", "brightMagenta": "#cba6f7", "brightCyan": "#89dceb", "brightWhite": "#cdd6f4", "background": "#1e1e2e", "foreground": "#cdd6f4", "selectionBackground": "#45475a", "cursorColor": "#f5e0dc" }

Sleep 500ms
Type "warroom run 'Add a hello world Express server'"
Sleep 500ms
Enter
Sleep 1s

# Simulate the output
Type@0 ""
Sleep 300ms

# Banner
Type@0 ""
Sleep 100ms
Hide
Type "printf '\n  \033[1;37mwarroom\033[0m\n  \033[2m5 agents. 1 task. Let the debate begin.\033[0m\n\n  \033[1mTask:\033[0m Add a hello world Express server\n'"
Enter
Sleep 100ms
Show
Sleep 1.5s

# Phase 1
Hide
Type "printf '\n  \033[2m────────────────────────────────────────────\033[0m\n  \033[1;37mPhase 1: Design\033[0m\n  \033[2m────────────────────────────────────────────\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 800ms

# Architect
Hide
Type "printf '  \033[2m○\033[0m Waiting for \033[34mArchitect\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 2s

Hide
Type "printf '  \033[37m●\033[0m \033[1;34m[ARC]\033[0m \033[1mArchitect\033[0m  \033[2mI propose splitting server.js (app creation + routes) from index.js (entry\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 1.2s

# Challenger
Hide
Type "printf '  \033[2m○\033[0m Waiting for \033[31mChallenger\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 2s

Hide
Type "printf '  \033[37m●\033[0m \033[1;31m[CHL]\033[0m \033[1mChallenger\033[0m  \033[2mTwo real issues. No main or scripts in package.json -- npm start is brok\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 1.2s

# Architect revision
Hide
Type "printf '  \033[2m○\033[0m Waiting for \033[34mArchitect\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "printf '  \033[37m●\033[0m \033[1;34m[ARC]\033[0m \033[1mArchitect\033[0m  \033[2mBoth valid. Adding start script, main field, and error handler. @Builder:\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 1.2s

# Challenger final
Hide
Type "printf '  \033[2m○\033[0m Waiting for \033[31mChallenger\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 1.5s

Hide
Type "printf '  \033[37m●\033[0m \033[1;31m[CHL]\033[0m \033[1mChallenger\033[0m  \033[2mDesign approved. Error handling on the server instance is the right call.\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 1s

# Phase 2
Hide
Type "printf '\n  \033[2m────────────────────────────────────────────\033[0m\n  \033[1;37mPhase 2: Build\033[0m\n  \033[2m────────────────────────────────────────────\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 800ms

Hide
Type "printf '  \033[2m○\033[0m Waiting for \033[32mBuilder\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 2.5s

Hide
Type "printf '  \033[37m●\033[0m \033[1;32m[BLD]\033[0m \033[1mBuilder\033[0m  \033[2mImplemented. 4 files. server.js exports app without starting it. index.j\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 500ms

Hide
Type "printf '  4 files written\n'"
Enter
Sleep 100ms
Show
Sleep 1s

# Phase 3
Hide
Type "printf '\n  \033[2m────────────────────────────────────────────\033[0m\n  \033[1;37mPhase 3: Review\033[0m\n  \033[2m────────────────────────────────────────────\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 800ms

Hide
Type "printf '  \033[2m○\033[0m Waiting for \033[35mReviewer\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 2s

Hide
Type "printf '  \033[37m●\033[0m \033[1;35m[REV]\033[0m \033[1mReviewer\033[0m  \033[2mLGTM. server.js/index.js split is correct. Error handling on the server\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 1s

Hide
Type "printf '  \033[2m○\033[0m Waiting for \033[33mBreaker\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 2s

Hide
Type "printf '  \033[37m●\033[0m \033[1;33m[BRK]\033[0m \033[1mBreaker\033[0m  \033[2mTwo real bugs. PORT=0 reports port 0 instead of actual port. PORT=99999\033[0m\033[2m...\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 1.2s

# Done
Hide
Type "printf '\n  \033[1;32mDONE\033[0m\n\n  5 agents \033[2m·\033[0m 7 messages \033[2m·\033[0m 1 revision \033[2m·\033[0m 2 bugs caught \033[2m·\033[0m 4 files \033[2m·\033[0m 70s\n\n  \033[2m→\033[0m \033[36m.warroom/conversations/add-express-server-2026-03-27/conversation.md\033[0m\n  \033[2m→\033[0m \033[36m.warroom/conversations/add-express-server-2026-03-27/summary.md\033[0m\n'"
Enter
Sleep 100ms
Show
Sleep 3s
