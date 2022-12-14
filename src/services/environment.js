//
// This service provides variables that
// may change dependent on deployment
// environment.
//
const environment = {
  DEFAULT_PROVIDER_URL: process.env.REACT_APP_DEFAULT_PROVIDER_URL,
  DEFAULT_BLOCK_EXPLORER_URL: process.env.REACT_APP_DEFAULT_BLOCK_EXPLORER_URL,
  DEFAULT_CHAIN_ID: process.env.REACT_APP_DEFAULT_CHAIN_ID,
  DEFAULT_CHAIN_NAME: process.env.REACT_APP_DEFAULT_CHAIN_NAME,
  BACKEND_BASE_URL: process.env.REACT_APP_BACKEND_BASE_URL,
  MAX_REGISTRATION_QUANTITY: 5, // years
  MAX_REGISTRATION_NAMES: 8, // number of names per registration chunk
  REGISTRATIONS_ENABLED: true,
  SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
  AUCTION_KEY: process.env.REACT_APP_AUCTION_KEY,
  PROOF_KEY: process.env.REACT_APP_PROOF_KEY,
}

export default environment
