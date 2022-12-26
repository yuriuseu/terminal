import './icon-alt.png';

import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import {io} from 'socket.io-client';

window.addEventListener('load', () => {
  const terminal = new Terminal({
    scrollback: 9999999,
    cursorBlink: true,
    theme: {
      black: '#616161',
      blue: '#82aaff',
      cyan: '#89ddff',
      green: '#c3e88d',
      magenta: '#c792ea',
      red: '#f07178',
      white: '#e0e0e0',
      yellow: '#f78c6c',
      brightBlack: '#616161',
      brightBlue: '#82aaff',
      brightCyan: '#89ddff',
      brightGreen: '#c3e88d',
      brightMagenta: '#c792ea',
      brightRed: '#f07178',
      brightWhite: '#e0e0e0',
      brightYellow: '#f78c6c'
    }
  });
  terminal.open(document.body);
  terminal.focus();
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  const socket = io(location.origin.replace(/http(s?)/, 'ws$1'));
  terminal.onData((data) => socket.emit('input', data));
  socket.on('output', (data) => terminal.write(data));
  socket.on('exit', () => location.reload());
  let resize;
  (resize = () => {
    const {cols, rows} = fitAddon.proposeDimensions();
    socket.emit('resize', cols, rows);
    fitAddon.fit();
  })();
  window.addEventListener('resize', resize);
  const darkColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const setTheme = (theme) => ({...terminal.options.theme, ...theme});
  let colorScheme;
  (colorScheme = () => {
    if (darkColorScheme.matches) {
      terminal.options.theme = setTheme({
        background: '#212121',
        foreground: '#e0e0e0',
        selectionBackground: '#e0e0e0',
        selectionForeground: '#9e9e9e',
        cursor: '#e0e0e0',
        cursorAccent: '#9e9e9e'
      });
    } else {
      terminal.options.theme = setTheme({
        background: '#fafafa',
        foreground: '#616161',
        selectionBackground: '#616161',
        selectionForeground: '#9e9e9e',
        cursor: '#616161',
        cursorAccent: '#9e9e9e'
      });
    }
  })();
  darkColorScheme.addEventListener('change', colorScheme);
});
