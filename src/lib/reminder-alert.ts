import { Audio } from 'expo-av';
import { Vibration, Platform } from 'react-native';

import { hapticWarning } from '@/lib/haptics';

let sound: Audio.Sound | null = null;

/** Play reminder beep + vibrate. Safe to call repeatedly. */
export async function playReminderAlert() {
  try {
    hapticWarning();
    if (Platform.OS !== 'web') {
      Vibration.vibrate(Platform.OS === 'ios' ? 400 : [0, 220, 120, 220, 120, 320]);
    }
  } catch {
    // ignore
  }

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    if (sound) {
      await sound.replayAsync().catch(async () => {
        await sound?.unloadAsync().catch(() => {});
        sound = null;
        await loadAndPlay();
      });
      return;
    }
    await loadAndPlay();
  } catch {
    // Expo Go / missing asset — vibration already ran
  }
}

async function loadAndPlay() {
  const { sound: s } = await Audio.Sound.createAsync(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../assets/sounds/beep.wav'),
    { shouldPlay: true, volume: 1 },
  );
  sound = s;
  s.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      // keep loaded for quick replay
    }
  });
}

export async function stopReminderAlert() {
  try {
    await sound?.stopAsync();
  } catch {
    // ignore
  }
  try {
    Vibration.cancel();
  } catch {
    // ignore
  }
}
