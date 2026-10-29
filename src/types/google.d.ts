// Type definitions for Google Identity Services (GIS)
export interface GoogleCredentialResponse {
  credential: string; // The Google ID Token (JWT)
  select_by?: string;
  clientId?: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
  ux_mode?: "popup" | "redirect";
  login_uri?: string;
  native_callback?: (response: unknown) => void;
}

export interface GoogleButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number | string;
  locale?: string;
}

export interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
  prompt: (notification?: (notification: {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
    getNotDisplayedReason: () => string;
    getSkippedReason: () => string;
    getDismissedReason: () => string;
  }) => void) => void;
  cancel: () => void;
  revoke: (hint: string, callback?: (response: unknown) => void) => void;
  disableAutoSelect: () => void;
  storeCredential: (credential: unknown, callback?: (response: unknown) => void) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}
