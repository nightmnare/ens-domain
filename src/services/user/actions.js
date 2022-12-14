import constants from "./constants";
import services from "services";

const actions = {
  setDomainIds: domainIds => {
    return {
      type: constants.SET_DOMAIN_IDS,
      domainIds
    };
  },

  setDomainCount: domainCount => {
    return {
      type: constants.SET_DOMAIN_COUNT,
      domainCount
    };
  },

  setLoadedDomainCount: loadedDomainCount => {
    return {
      type: constants.SET_LOADED_DOMAIN_COUNT,
      loadedDomainCount
    };
  },

  loadDomains: () => {
    return async (dispatch, getState) => {
      const api = services.provider.buildAPI();
      dispatch(actions.setDomainCount(null));
      const domains = await api.getDomainsByOwner(api.account);

      let domainIds = [];
      let loadedDomainCount = 0;
      dispatch(actions.setLoadedDomainCount(0));
      dispatch(actions.setDomainCount(domains.length));
      for (let i = 0; i < domains.length; i += 1) {
        let id = domains[i].tokenId;
        domainIds.push(id);
        loadedDomainCount += 1;
        if (loadedDomainCount % 10 === 0)
          dispatch(actions.setLoadedDomainCount(loadedDomainCount));
      }
      dispatch(actions.setLoadedDomainCount(domainIds.length));
      const lookups = services.names.selectors.reverseLookups(getState());
      for (let i = 0; i < domainIds.length; i += 1) {
        if (!lookups[domainIds[i]])
          dispatch(services.names.actions.lookup(domainIds[i]));
      }
      dispatch(actions.setDomainIds(domainIds));
    };
  },

  acceptDisclaimers: () => {
    return {
      type: constants.ACCEPT_DISCLAIMERS
    };
  },

  setToken: token => {
    return {
      type: constants.SET_TOKEN,
      token
    };
  },

  setWalletAutoconnect: wallet => {
    return {
      type: constants.SET_WALLET_AUTOCONNECT,
      wallet
    };
  }
};

export default actions;
