import { createGame } from './game.js';
import { installNativeShell } from './native.js';
import { Capacitor } from '@capacitor/core';
const game = createGame({ nativeLifecycle: Capacitor.isNativePlatform() });
void installNativeShell(game).catch((error) => console.error('Native lifecycle:', error));
