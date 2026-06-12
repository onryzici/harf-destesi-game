// Dokunsal geri bildirim (haptics) — küçük juice. Hata olursa sessiz geç.
import * as Haptics from "expo-haptics";

export const haptic = {
  tap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  pick() {
    Haptics.selectionAsync().catch(() => {});
  },
  play() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  big() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  error() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
