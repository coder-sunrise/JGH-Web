import React, { PureComponent } from 'react'
import lodash from 'lodash'
import { FastField, withFormik } from 'formik'
import { confirmBeforeReload } from '@/utils/utils'

import Authorized from '@/utils/Authorized'

const control = ({ disabledProps } = {}) => (Component) => {
  class BasicComponent extends React.PureComponent {
    // shouldComponentUpdate (nextProps, nextStates) {
    //   return false
    // }

    // constructor (props) {
    //   super(props)
    // }

    // componentDidMount () {}

    // UNSAFE_componentWillReceiveProps (nextProps) {}

    render () {
      if (this.props.authority === 'none') {
        return <Component {...this.props} />
      }
      // console.log(disabledProps)
      const extraCfg = {}
      if (disabledProps) {
        extraCfg[disabledProps] = true
      }

      // console.log(props, this.props, Component)
      return (
        <Authorized.Context.Consumer>
          {({ view, edit }) => {
            // console.log('Authorized.Context.Consumer', view, edit)
            if (!view) return <Component {...this.props} />
            return (
              <Authorized
                authority={[
                  view,
                  edit,
                ]}
                noMatch={() => {
                  if (!this.props.hideIfNoEditRights) {
                    if (Component.displayName === 'RegularButton') {
                      return null
                    }
                    return <Component {...this.props} disabled {...extraCfg} />
                  }
                  return null
                }}
              >
                {(matches) => {
                  return Authorized.generalCheck(
                    matches,
                    this.props,
                    <Component {...this.props} {...extraCfg} />,
                  )
                }}
              </Authorized>
            )
          }}
        </Authorized.Context.Consumer>
      )
    }
  }

  return BasicComponent
}

export default control
