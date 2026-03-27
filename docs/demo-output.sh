#!/bin/bash
# Simulates warroom CLI output for demo recording
# Used by docs/demo.tape

BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'
WHITE='\033[1;37m'
BLUE='\033[1;34m'
RED='\033[1;31m'
GREEN='\033[1;32m'
MAGENTA='\033[1;35m'
YELLOW='\033[1;33m'
CYAN='\033[36m'

LINE="${DIM}────────────────────────────────────────────${RESET}"

echo ""
echo -e "  ${WHITE}warroom${RESET}"
echo -e "  ${DIM}5 agents. 1 task. Let the debate begin.${RESET}"
echo ""
echo -e "  ${BOLD}Task:${RESET} Add a hello world Express server"
echo ""

sleep 1

# Phase 1
echo -e "  ${LINE}"
echo -e "  ${WHITE}Phase 1: Design${RESET}"
echo -e "  ${LINE}"

sleep 0.5
echo -e "  ${DIM}○${RESET} Waiting for ${BLUE}Architect${RESET}${DIM}...${RESET}"
sleep 2
echo -e "  ${WHITE}●${RESET} ${BLUE}[ARC]${RESET} ${BOLD}Architect${RESET}  ${DIM}I propose splitting server.js (app creation + routes) from index.js (entry${RESET}${DIM}...${RESET}"

sleep 0.8
echo -e "  ${DIM}○${RESET} Waiting for ${RED}Challenger${RESET}${DIM}...${RESET}"
sleep 2
echo -e "  ${WHITE}●${RESET} ${RED}[CHL]${RESET} ${BOLD}Challenger${RESET}  ${DIM}Two real issues. No main or scripts in package.json -- npm start is brok${RESET}${DIM}...${RESET}"

sleep 0.8
echo -e "  ${DIM}○${RESET} Waiting for ${BLUE}Architect${RESET}${DIM}...${RESET}"
sleep 1.5
echo -e "  ${WHITE}●${RESET} ${BLUE}[ARC]${RESET} ${BOLD}Architect${RESET}  ${DIM}Both valid. Adding start script, main field, and error handler. @Builder:${RESET}${DIM}...${RESET}"

sleep 0.8
echo -e "  ${DIM}○${RESET} Waiting for ${RED}Challenger${RESET}${DIM}...${RESET}"
sleep 1.5
echo -e "  ${WHITE}●${RESET} ${RED}[CHL]${RESET} ${BOLD}Challenger${RESET}  ${DIM}Design approved. Error handling on the server instance is the right call.${RESET}${DIM}...${RESET}"

sleep 0.5

# Phase 2
echo ""
echo -e "  ${LINE}"
echo -e "  ${WHITE}Phase 2: Build${RESET}"
echo -e "  ${LINE}"

sleep 0.5
echo -e "  ${DIM}○${RESET} Waiting for ${GREEN}Builder${RESET}${DIM}...${RESET}"
sleep 2.5
echo -e "  ${WHITE}●${RESET} ${GREEN}[BLD]${RESET} ${BOLD}Builder${RESET}  ${DIM}Implemented. 4 files. server.js exports app without starting it. index.j${RESET}${DIM}...${RESET}"
sleep 0.3
echo -e "  ${DIM}4 files written${RESET}"

sleep 0.5

# Phase 3
echo ""
echo -e "  ${LINE}"
echo -e "  ${WHITE}Phase 3: Review${RESET}"
echo -e "  ${LINE}"

sleep 0.5
echo -e "  ${DIM}○${RESET} Waiting for ${MAGENTA}Reviewer${RESET}${DIM}...${RESET}"
sleep 2
echo -e "  ${WHITE}●${RESET} ${MAGENTA}[REV]${RESET} ${BOLD}Reviewer${RESET}  ${DIM}LGTM. server.js/index.js split is correct. Error handling on the server${RESET}${DIM}...${RESET}"

sleep 0.8
echo -e "  ${DIM}○${RESET} Waiting for ${YELLOW}Breaker${RESET}${DIM}...${RESET}"
sleep 2
echo -e "  ${WHITE}●${RESET} ${YELLOW}[BRK]${RESET} ${BOLD}Breaker${RESET}  ${DIM}Two real bugs. PORT=0 reports port 0 instead of actual port. PORT=99999${RESET}${DIM}...${RESET}"

sleep 0.5

# Done
echo ""
echo -e "  ${GREEN}DONE${RESET}"
echo ""
echo -e "  5 agents ${DIM}·${RESET} 7 messages ${DIM}·${RESET} 1 revision ${DIM}·${RESET} 2 bugs caught ${DIM}·${RESET} 4 files ${DIM}·${RESET} 70s"
echo ""
echo -e "  ${DIM}→${RESET} ${CYAN}.warroom/conversations/add-express-server-2026-03-27/conversation.md${RESET}"
echo -e "  ${DIM}→${RESET} ${CYAN}.warroom/conversations/add-express-server-2026-03-27/summary.md${RESET}"
echo ""
