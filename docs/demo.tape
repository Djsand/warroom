Output docs/demo.gif

Set Shell bash
Set FontFamily "JetBrains Mono"
Set FontSize 14
Set Width 800
Set Height 540
Set Padding 20
Set TypingSpeed 40ms
Set Theme { "name": "warroom", "black": "#1e1e2e", "red": "#f38ba8", "green": "#a6e3a1", "yellow": "#f9e2af", "blue": "#89b4fa", "magenta": "#cba6f7", "cyan": "#89dceb", "white": "#cdd6f4", "brightBlack": "#585b70", "brightRed": "#f38ba8", "brightGreen": "#a6e3a1", "brightYellow": "#f9e2af", "brightBlue": "#89b4fa", "brightMagenta": "#cba6f7", "brightCyan": "#89dceb", "brightWhite": "#cdd6f4", "background": "#1e1e2e", "foreground": "#cdd6f4", "selectionBackground": "#45475a", "cursorColor": "#f5e0dc" }

# Setup: alias warroom to our demo script so user sees "warroom run ..."
Hide
Type "alias warroom='bash docs/demo-output.sh #'"
Enter
Sleep 200ms
Type "export PS1='$ '"
Enter
Sleep 200ms
Show

Sleep 500ms
Type "warroom run 'Add a hello world Express server'"
Sleep 300ms
Enter
Sleep 28s
Sleep 3s
