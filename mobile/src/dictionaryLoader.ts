// Sözlüğü RN'de yükler — web'in fetch'i yerine paketlenmiş asset'i okur.
// 653KB / 63.583 kelime. expo-asset ile yerel URI'yi çöz, dosyayı oku, engine'in
// platform-bağımsız loadDictionaryFromText'ine ver (Set kurar). Hermes fetch'e dokunmaz.

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { loadDictionaryFromText } from "./engineApi";

// Döndürür: yüklenen kelime sayısı (beklenen 63583).
export async function loadDictionaryAsset(): Promise<number> {
  // Metro .txt'yi asset olarak paketler (metro.config.js assetExts).
  const asset = Asset.fromModule(require("../assets/kelimeler.txt"));
  await asset.downloadAsync(); // localUri'yi hazırla (Expo Go'da kopyalanır)
  const uri = asset.localUri ?? asset.uri;
  const text = await FileSystem.readAsStringAsync(uri);
  return loadDictionaryFromText(text);
}
