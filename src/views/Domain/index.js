import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { CheckCircleIcon, ExternalLinkIcon } from "@heroicons/react/solid";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { ethers } from "ethers";

import services from "services";
import components from "components";

import SetEVMReverseRecord from "./SetEVMReverseRecord";
import SetRecord from "./SetRecord";
import SetResolver from "./SetResolver";
import TransferDomain from "./TransferDomain";
import actions from "./actions";
import constants from "./constants";
import reducer from "./reducer";
import selectors from "./selectors";

class Domain extends React.PureComponent {
  constructor(props) {
    super(props);
    const params = services.linking.getParams("Domain");
    const domain = params.domain ? params.domain.toLowerCase() : null;
    this.state = {
      domain: domain,
      connected: services.provider.isConnected(),
      setRecordReset: 0, // increment this to reset the form
      defaultResolver: undefined,
      dataExplorer: null,
      editRecordKey: null,
      deleteRecordKey: null,
    };
    this.searchPlaceholder = "Search for another name";
    this.loadDomain(domain);
    this.getWens();
  }

  async getWens() {
    const api = await services.provider.buildAPI();
    this.wens = api.wens;
  }

  async setDefaultResolver() {
    const api = await services.provider.buildAPI();
    this.setState({
      defaultResolver: api.getDefaultResolverAddress(),
    });
  }

  updateParams = () => {
    const params = services.linking.getParams("Domain");
    const domain = params.domain ? params.domain.toLowerCase() : null;
    this.setState(
      {
        domain: domain,
      },
      () => {
        this.loadDomain(domain);
      }
    );
  };

  loadDomain() {
    const params = services.linking.getParams("Domain");
    const domain = params.domain ? params.domain.toLowerCase() : null;
    this.props.loadDomain(domain);
    this.props.loadRegistrationPremium();
  }

  onConnect() {
    this.setState({
      connected: true,
    });
    if (this.connectModal) this.connectModal.hide();
    this.loadDomain();
  }

  onDisconnect() {
    this.setState({
      connected: false,
    });
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.setRecordComplete && this.props.setRecordComplete) {
      this.setRecordModal.toggle();
      this.props.resetSetRecord();
    }
  }

  setApi = async () => {
    this.api = await services.provider.buildAPI();
  };

  componentDidMount() {
    services.linking.addEventListener("Domain", this.updateParams);
    services.provider.addEventListener(
      services.provider.EVENTS.CONNECTED,
      this.onConnect.bind(this)
    );
    services.provider.addEventListener(
      services.provider.EVENTS.DISCONNECTED,
      this.onDisconnect.bind(this)
    );
    this.setDefaultResolver();
    this.setApi();
  }

  componentWillUnmount() {
    services.linking.removeEventListener("Domain", this.updateParams);
    services.provider.removeEventListener(
      services.provider.EVENTS.CONNECTED,
      this.onConnect.bind(this)
    );
    services.provider.removeEventListener(
      services.provider.EVENTS.DISCONNECTED,
      this.onDisconnect.bind(this)
    );
  }

  addToCart(navigator) {
    this.props.addToCart(this.state.domain);
    services.linking.navigate(navigator, "Register", {});
  }

  setResolver = () => {
    this.props.resetSetResolver();
    this.setResolverModal.toggle();
  };

  _handleSetRecord = (type, value) => {
    this.props.setStandardRecord(this.state.domain, type, value);
  };

  showSetRecord = (key, value) => {
    this.setState((currState) => ({
      editRecordKey: key,
      deleteRecordKey: null,
    }));
    if (!value) value = "";
    this.setRecord.setValue(value);
    this.setRecordModal.toggle();
  };

  showDeleteRecord = (key, value) => {
    this.setState((currState) => ({
      editRecordKey: null,
      deleteRecordKey: key,
    }));
    if (!value) value = "";
    this.setRecord.setValue(value);
    this.setRecordModal.toggle();
  };

  renderAvailableBody() {
    return (
      <div className="max-w-md m-auto">
        <div className="max-w-sm m-auto mt-4 flex items-center justify-center">
          <CheckCircleIcon className="w-6 text-alert-blue mr-2" />
          <div className="text-alert-blue">{"Available for registration"}</div>
        </div>
        {services.environment.REGISTRATIONS_ENABLED ? (
          <div className="mt-4">
            <components.buttons.Button
              text={"Register this name"}
              onClick={(navigator) => this.addToCart(navigator)}
            />
          </div>
        ) : null}
        <div className="mt-4">
          <components.DomainSearch placeholder={this.searchPlaceholder} />
        </div>
      </div>
    );
  }

  renderUnsupported() {
    return (
      <div className="max-w-md m-auto">
        <div className="max-w-sm m-auto mt-4 flex items-center justify-center">
          <components.labels.Error text={"This name cannot be registered"} />
        </div>
        <div className="mt-4">
          <components.DomainSearch placeholder={this.searchPlaceholder} />
        </div>
      </div>
    );
  }

  renderRegistered() {
    let account = services.provider.getAccount();
    const isOwned = account
      ? account.toLowerCase() === this.props.domain.owner.toLowerCase()
      : false;
    if (!this.wens) return;

    return (
      <div className="max-w-screen-lg m-auto flex w-full md:flex-row md:items-start">
        <components.Modal ref={(ref) => (this.dataExplorerModal = ref)}>
          <components.DataExplorer data={this.state.dataExplorer} />
        </components.Modal>
        <components.Modal
          title={"Set as Primary"}
          ref={(ref) => (this.setEVMReverseRecordModal = ref)}
        >
          <SetEVMReverseRecord
            domain={this.state.domain}
            onComplete={() => {
              this.setEVMReverseRecordModal.toggle();
            }}
          />
        </components.Modal>
        <components.Modal
          title={"Transfer Domain"}
          ref={(ref) => (this.transferDomainModal = ref)}
        >
          <TransferDomain
            onComplete={() => {
              this.loadDomain();
              this.transferDomainModal.toggle();
            }}
            domain={this.state.domain}
          />
        </components.Modal>
        <components.Modal
          title={
            this.state.deleteRecordKey
              ? "Delete Record"
              : this.state.editRecordKey
              ? "Edit Record"
              : "Add Record"
          }
          ref={(ref) => (this.setRecordModal = ref)}
        >
          <SetRecord
            deleteRecord={this.state.deleteRecordKey}
            editRecord={this.state.editRecordKey}
            handleSubmit={this._handleSetRecord}
            loading={this.props.isSettingRecord}
            api={this.api}
            ref={(ref) => (this.setRecord = ref)}
          />
        </components.Modal>
        <components.Modal
          title={"Set Resolver"}
          ref={(ref) => (this.setResolverModal = ref)}
        >
          <SetResolver
            onComplete={() => this.setResolverModal.toggle()}
            domain={this.state.domain}
            resolver={this.props.resolver}
          />
        </components.Modal>

        <div className="w-full">
          <div className="flex lg:flex-row md:flex-col flex-col justify-center  gap-3">
            <div className=" rounded-xl relative p-0 md:p-2 bg-gray-100 dark:bg-gray-800">
              <components.NFTCard name={this.state.domain} />
            </div>
            <div className=" rounded-xl w-full relative py-2 px-4 md:py-2 md:px-8 dark:bg-gray-800 w-full">
              <div className="flex justify-between items-center">
                <div className="font-bold">{"Basic Information"}</div>
              </div>
              <div
                className="w-full bg-gray-300 dark:bg-gray-700 mt-4"
                style={{ height: "1px" }}
              ></div>
              <div className="mt-4 text-sm">
                <div className="font-bold">{"Registrant"}</div>
                <div className="truncate flex items-center flex-wrap">
                  <div
                    className="flex items-center cursor-pointer w-full sm:w-auto"
                    onClick={() => {
                      this.setState({
                        dataExplorer: {
                          title: "View on Block Explorer",
                          data: this.props.domain.owner,
                          dataType: this.wens.RECORDS.EVM,
                        },
                      });
                      this.dataExplorerModal.toggle();
                    }}
                  >
                    <div className="truncate">{this.props.domain.owner}</div>
                    <ExternalLinkIcon className="w-4 ml-2 flex-shrink-0" />
                  </div>
                  {this.state.connected && isOwned ? (
                    <components.buttons.Transparent
                      onClick={() => {
                        this.props.resetTransferDomain();
                        this.transferDomainModal.toggle();
                      }}
                    >
                      <div className="sm:ml-2 inline-block cursor-pointer text-alert-blue underline">
                        Transfer
                      </div>
                    </components.buttons.Transparent>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 text-sm">
                <div className="font-bold">{"Resolver"}</div>
                <div className="truncate flex items-center">
                  {this.props.resolver ? (
                    <div>
                      {this.props.resolver.resolver ===
                      this.state.defaultResolver
                        ? "Default Resolver"
                        : "Unknown Resolver"}
                    </div>
                  ) : (
                    <div>Not set</div>
                  )}
                  {this.state.connected && isOwned ? (
                    <components.buttons.Transparent onClick={this.setResolver}>
                      <div className="ml-2 inline-block cursor-pointer text-alert-blue underline">
                        Set Resolver
                      </div>
                    </components.buttons.Transparent>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 text-sm">
                <div className="font-bold">{"Primary"}</div>
                <div className="truncate flex items-center flex-wrap">
                  {this.props.reverseRecords[this.wens.RECORDS.EVM] ? (
                    <div
                      className="flex items-center cursor-pointer w-full sm:w-auto"
                      onClick={() => {
                        this.setState({
                          dataExplorer: {
                            title: "View on Block Explorer",
                            data: this.props.domain.owner,
                            dataType: this.wens.RECORDS.EVM,
                          },
                        });
                        this.dataExplorerModal.toggle();
                      }}
                    >
                      <div className="truncate">{this.props.domain.owner}</div>
                      <ExternalLinkIcon className="w-4 ml-2 flex-shrink-0" />
                    </div>
                  ) : (
                    <div>Not set</div>
                  )}
                  {this.state.connected && isOwned ? (
                    <components.buttons.Transparent
                      onClick={() => {
                        this.setEVMReverseRecordModal.toggle();
                      }}
                    >
                      <div className="ml-2 inline-block cursor-pointer text-alert-blue underline">
                        Set as Primary
                      </div>
                    </components.buttons.Transparent>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4  rounded-xl w-full relative p-4 md:p-8 dark:bg-gray-800 w-full">
            <div className="flex justify-between items-center">
              <div className="font-bold">
                {"Records"}
                {this.props.resolver ? (
                  <span className="text-green-500 mx-4">
                    {this.props.resolver.resolver === this.state.defaultResolver
                      ? "Default Resolver"
                      : "Unknown Resolver"}
                  </span>
                ) : (
                  <span className="text-red-500 mx-4">
                    Set Resolver to set records
                  </span>
                )}
              </div>
            </div>
            <div
              className="w-full bg-gray-300 dark:bg-gray-700 mt-4"
              style={{ height: "1px" }}
            ></div>
            {this.props.isLoadingRecords ? (
              <div className="mt-4 w-full text-center">
                <components.Spinner />
              </div>
            ) : (
              <div className="mx-auto md:grid md:grid-rows-5 md:grid-flow-col gap-4">
                {this.wens?.RECORDS._LIST.map((record, index) => (
                  <div className="mt-4 flex flex-col md:flex-row gap-4" key={index}>
                    <div className="text-sm font-bold  w-full max-w-[200px]">{record.label}</div>
                    <div
                      className="text-sm flex items-center cursor-pointer w-full"
                      onClick={() => {
                        this.setState({
                          dataExplorer: {
                            data:
                              this.props.records.filter(
                                (rec) => rec.label === record.label
                              ).length > 0
                                ? this.props.records.filter(
                                    (rec) => rec.label === record.label
                                  )[0].value
                                : "",
                            dataType: record.key,
                          },
                        });
                        this.dataExplorerModal.toggle();
                      }}
                    >
                      <div className="truncate">
                        {this.props.records.filter(
                          (rec) => rec.label === record.label
                        ).length > 0
                          ? this.props.records.filter(
                              (rec) => rec.label === record.label
                            )[0].value
                          : "Not Set"}
                      </div>
                      <ExternalLinkIcon className="w-4 ml-2 pb-1 flex-shrink-0" />
                      {this.state.connected && isOwned ? (
                        <div className="flex items-center">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              this.showSetRecord(
                                record.key,
                                this.props.records.filter(
                                  (rec) => rec.label === record.label
                                ).length > 0
                                  ? this.props.records.filter(
                                      (rec) => rec.label === record.label
                                    )[0].value
                                  : ""
                              );
                            }}
                            className="ml-2 text-alert-blue underline cursor-pointer"
                          >
                            {this.props.records.filter(
                              (rec) => rec.label === record.label
                            ).length > 0
                              ? "Edit"
                              : "Set"}
                          </div>
                          {this.props.records.filter(
                            (rec) => rec.label === record.label
                          ).length > 0 && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                this.showDeleteRecord(record.key, record.value);
                              }}
                              className="ml-2 text-alert-blue underline cursor-pointer"
                            >
                              {"Delete"}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  renderLoader() {
    return (
      <div className="m-auto max-w-sm text-center">
        <components.Spinner className="w-6" size="md" dark={true} />
      </div>
    );
  }

  renderBody() {
    if (this.props.isLoading) return this.renderLoader();
    if (!this.props.domain) return null;
    if (!this.props.domain.supported) return this.renderUnsupported();

    const statuses = this.props.domain.constants.DOMAIN_STATUSES;

    switch (this.props.domain.status) {
      case statuses.AVAILABLE:
        return this.renderAvailableBody();

      case statuses.REGISTERED_OTHER:
        return this.renderRegistered();

      case statuses.REGISTERED_SELF:
        return this.renderRegistered();

      default:
        return null;
    }
  }

  render() {
    let account = services.provider.getAccount();
    const isOwned =
      account && this.props.domain?.owner
        ? account.toLowerCase() === this.props.domain.owner.toLowerCase()
        : false;
    return (
      <div>
        <div className="flex justify-between max-w-screen-lg m-auto items-center mt-2 md:mt-8 mb-4 bg-gray-100 p-4 rounded-xl">
          <Link to={services.linking.path("MyDomains")}>
            {!this.props.isLoading && isOwned ? (
              <ArrowLeftIcon className="w-6" />
            ) : null}
          </Link>
          <div className="text-lg text-center font-bold">
            {this.state.domain}
          </div>
          <div>
            {isOwned ? <ArrowLeftIcon className="w-6 invisible" /> : null}
          </div>
        </div>
        {this.renderBody()}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  isLoading: selectors.isLoading(state),
  domain: selectors.domain(state),
  isSettingRecord: selectors.isSettingRecord(state),
  isLoadingRecords: selectors.isLoadingRecords(state),
  records: selectors.records(state),
  setRecordComplete: selectors.setRecordComplete(state),
  avatarRecord: selectors.avatarRecord(state),

  isLoadingReverseRecords: selectors.isLoadingReverseRecords(state),
  reverseRecords: selectors.reverseRecords(state),

  resolver: selectors.resolver(state),
  registrationPremium: selectors.registrationPremium(state),
  isRevealed: services.names.selectors.isRevealed(state),
  isRevealingDomain: selectors.isRevealingDomain(state),
  isRevealComplete: selectors.isRevealComplete(state),
});

const mapDispatchToProps = (dispatch) => ({
  loadRegistrationPremium: () => dispatch(actions.loadRegistrationPremium()),
  loadDomain: (domain) => dispatch(actions.loadDomain(domain)),
  addToCart: (domain) => dispatch(services.cart.actions.addToCart(domain)),
  setStandardRecord: (domain, type, value) =>
    dispatch(actions.setStandardRecord(domain, type, value)),
  resetSetRecord: () => dispatch(actions.setRecordComplete(false)),
  renewDomain: (domain) => dispatch(services.cart.actions.addToCart(domain)),
  resetSetResolver: () => dispatch(actions.setResolverComplete(false)),
  revealDomain: (domain) => dispatch(actions.revealDomain(domain)),
  resetRevealDomain: () => dispatch(actions.resetRevealDomain()),
  resetTransferDomain: () => dispatch(actions.resetTransferDomain()),
});

const component = connect(mapStateToProps, mapDispatchToProps)(Domain);

component.redux = {
  actions,
  constants,
  reducer,
  selectors,
};

export default component;