declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface PickedFolder {
  id: string;
  name: string;
}

function loadPickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Picker can only be used in the browser."));
      return;
    }
    if (!window.gapi) {
      reject(new Error("Google API script hasn't loaded yet. Try again in a moment."));
      return;
    }
    if (window.google?.picker) {
      resolve();
      return;
    }
    window.gapi.load("picker", { callback: resolve, onerror: reject });
  });
}

export async function openGoogleDrivePicker({
  accessToken,
  onPicked,
}: {
  accessToken: string;
  onPicked: (folders: PickedFolder[]) => void;
}): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_PICKER_API_KEY isn't configured.");
  }

  await loadPickerApi();

  const google = window.google;
  const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(true)
    .setMimeTypes("application/vnd.google-apps.folder");

  const picker = new google.picker.PickerBuilder()
    .addView(view)
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setOAuthToken(accessToken)
    .setDeveloperKey(apiKey)
    .setCallback((data: any) => {
      if (data.action === google.picker.Action.PICKED) {
        const folders: PickedFolder[] = (data.docs || []).map((doc: any) => ({
          id: doc.id,
          name: doc.name,
        }));
        onPicked(folders);
      }
    })
    .build();

  picker.setVisible(true);
}
