// Copyright 2017-2019 @polkadot/ui-react-rx authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ProviderInterface } from '@polkadot/rpc-provider/types';
import { ApiProps } from '../types';

import React from 'react';
import ApiPromise from '@polkadot/api/promise';
import defaults from '@polkadot/rpc-provider/defaults';
import WsProvider from '@polkadot/rpc-provider/ws';
import { InputNumber } from '@polkadot/ui-app/InputNumber';
import keyring from '@polkadot/ui-keyring';
import { isTestChain } from '@polkadot/ui-react-rx/util';
import settings from '@polkadot/ui-settings';
import { ChainProperties } from '@polkadot/types';

import { balanceFormat } from '../util';
import ApiContext from './Context';

type Props = {
  children: React.ReactNode,
  url?: string
};

type State = ApiProps & {
  chain?: string
};

export default class ApiWrapper extends React.PureComponent<Props, State> {
  state: State = {} as State;

  constructor (props: Props) {
    super(props);

    const { url } = props;
    const provider = new WsProvider(url);
    const setApi = (provider: ProviderInterface): void => {
      const apiPromise = new ApiPromise(provider);

      this.setState({ apiPromise }, () => {
        this.updateSubscriptions();
      });
    };
    const setApiUrl = (url: string = defaults.WS_URL): void =>
      setApi(new WsProvider(url));

    this.state = {
      isApiConnected: false,
      isApiReady: false,
      apiPromise: new ApiPromise(provider),
      setApiUrl
    } as State;
  }

  componentDidMount () {
    this.updateSubscriptions();
  }

  private updateSubscriptions () {
    const { apiPromise } = this.state;

    [
      this.subscribeIsConnected,
      this.subscribeIsReady,
      this.subscribeChain
    ].map((fn: Function) => {
      try {
        return fn(apiPromise);
      } catch (error) {
        console.error(error);
        return null;
      }
    });
  }

  private subscribeChain = async (api: ApiPromise) => {
    const [properties = new ChainProperties(), value] = await Promise.all([
      api.rpc.system.properties(),
      api.rpc.system.chain()
    ]);

    const chain = value
      ? value.toString()
      : null;
    const found = settings.availableChains.find(({ name }) => name === chain) || {
      // default should be 42 here, see setAdressPrefix below and change with below
      networkId: undefined, // 42
      tokenDecimals: 0,
      tokenSymbol: undefined
    };

    console.log('found chain', chain, [...properties.entries()]);

    balanceFormat.setDefaultDecimals(properties.get('tokenDecimals') || found.tokenDecimals);
    InputNumber.setUnit(properties.get('tokenSymbol') || found.tokenSymbol);

    // setup keyring only after prefix has been set. The networkId is handled slightly differently here
    // to allow overrides by settings first - revert to normal above when we get rid of invalid specs
    keyring.setAddressPrefix(found.networkId as any || properties.get('networkId') || 42);
    keyring.setDevMode(isTestChain(chain || ''));
    keyring.loadAll();

    this.setState({ chain });
  }

  private subscribeIsConnected = (api: ApiPromise) => {
    api.on('connected', () => {
      this.setState({ isApiConnected: true });
    });

    api.on('disconnected', () => {
      this.setState({ isApiConnected: false });
    });
  }

  private subscribeIsReady = (api: ApiPromise) => {
    api.on('ready', () => {
      const section = Object.keys(api.tx)[0];
      const method = Object.keys(api.tx[section])[0];

      this.setState({
        isApiReady: true,
        apiDefaultTx: api.tx[section][method]
      });
    });
  }

  render () {
    const { apiDefaultTx, apiPromise, chain, isApiConnected, isApiReady, setApiUrl } = this.state;

    return (
      <ApiContext.Provider
        value={{
          apiDefaultTx,
          apiPromise,
          isApiConnected,
          isApiReady: isApiReady && !!chain,
          setApiUrl
        }}
      >
        {this.props.children}
      </ApiContext.Provider>
    );
  }
}
