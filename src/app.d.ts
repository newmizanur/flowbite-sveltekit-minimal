// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
      } | null;
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  declare const __NAME__: string;
  declare const __VERSION__: string;
  declare const __GITHUBURL__: string;
  declare const __SVELTEVERSION__: string;
  declare const __SVELTEKITVERSION__: string;
  declare const __VITEVERSION__: string;
  declare const __TAILWINDCSSVERSION__: string;
  declare const __FLOWBITESVELTE__: string;
  declare const __FLOWBITESVETEICONS__: string;
  declare const __TAILWINDMERGE__: string;
}

export {};
