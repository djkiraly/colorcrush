// Pre-commit lint config (used by lint-staged on staged files only).
//
// Same rules as the main config, EXCEPT `no-explicit-any` is turned off: the
// ~107 existing `any`s are a tracked backlog (Phase 4 of the lint cleanup) and
// we don't want to block edits to those files until they're addressed. Every
// other rule stays at error/warning so NEW lint issues can't creep back in.
import config from "./eslint.config.mjs";

const precommitConfig = [
  ...config,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default precommitConfig;
