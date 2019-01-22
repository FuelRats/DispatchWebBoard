// Module Imports
import React from 'react'





// Component Imports
import initialState from './initialState'





const {
  Provider: StoreProvider,
  Consumer: StoreConsumer,
} = React.createContext([
  { ...initialState },
  () => ({}),
])





const withStoreProvider = (Target) => (props) => {
  class Store {
    state = { ...initialState }


    render () {
      return (
        <StoreProvider value={[this.state, this.setState]}>
          {this.props.children}
        </StoreProvider>
      )
    }
  }

  return (
    <Store>
      <Target {...props} />
    </Store>
  )
}

const withGlobal = (mapFunc) => (Target) => (props) => (
  <StoreConsumer>
    {([state, setState]) => {
      let mappedState = {
        state,
        setGlobalState: setState,
      }

      if (typeof mapFunc === 'function') {
        mappedState = mapFunc(state, setState)
      }

      return (
        <Target {...{
          ...props,
          ...mappedState,
        }} />
      )
    }}
  </StoreConsumer>
)


export {
  withStoreProvider,
  withGlobal,
}
