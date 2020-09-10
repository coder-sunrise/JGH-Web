import React, { PureComponent } from 'react'
import _ from 'lodash'
import { FastField, withFormik } from 'formik'
import {
  confirmBeforeReload,
  commonDataReaderTransform,
  findGetParameter,
  difference,
} from '@/utils/utils'
import AuthorizedContext from '@/components/Context/Authorized'
import Authorized from '@/utils/Authorized'
import Exception403 from '@/pages/Exception/403'

window.beforeReloadHandlerAdded = false
window.dirtyForms = {}
// window._localFormik = {}
const _localAuthority = {}
let lastVersion = null
const withFormikExtend = (props) => (Component) => {
  const {
    displayName,
    authority,
    notDirtyDuration = 1.5,
    onDirtyDiscard,
    onSecondConfirm,
    secondConfirmText,
    confirmText,
    dirtyCheckMessage,
  } = props
  let startDirtyChecking = false
  if (displayName) {
    _localAuthority[displayName] = {}
  }
  const updateDirtyState = (ps) => {
    if (!displayName || displayName.indexOf('Filter') > 0) return
    const { errors, dirty, initialValues, values } = ps
    // console.log({ initialValues, values })
    const _lastFormikUpdate = {
      displayName,
      errors,
      hasError: Object.keys(errors).length > 0,
      dirty,
      // values,
      // str: JSON.stringify(values),
    }
    const ob = window.g_app._store.getState().formik[displayName]
    // console.log('dirty', dirty, displayName, _lastFormikUpdate)

    if (dirty) {
      window.dirtyForms[displayName] = {
        displayName,
        dirtyCheckMessage: window.g_app._store.getState().global.secondConfirmMessage ?? dirtyCheckMessage,
        confirmText,
        showSecondConfirmButton: window.g_app._store.getState().global.isShowSecondConfirmButton ?? false,
        secondConfirmText,
        onDirtyDiscard: () => {
          if (onDirtyDiscard) {
            onDirtyDiscard(ps)
          }
        },
        onSecondConfirm: () => {
          if (onSecondConfirm) {
            onSecondConfirm(ps)
          }
        },
      }
    }

    if (dirty && !window.beforeReloadHandlerAdded) {
      window.beforeReloadHandlerAdded = true

      window.addEventListener('beforeunload', confirmBeforeReload)
    } else if (!dirty) {
      delete window.dirtyForms[displayName]

      if (Object.values(window.dirtyForms).length === 0) {
        window.beforeReloadHandlerAdded = false
        window.removeEventListener('beforeunload', confirmBeforeReload)
      }
    }

    if (!_.isEqual(_lastFormikUpdate, ob)) {
      // console.log('updateDirtyState', displayName, _lastFormikUpdate)

      window.g_app._store.dispatch({
        type: 'formik/updateState',
        payload: {
          [displayName]: _lastFormikUpdate,
        },
      })
    }
  }

  // const updateDirtyState = _.throttle(updateDirtyState, 250, {
  //   maxWait: 1000,
  //   leading: true,
  // })

  // const { mapPropsToValues } = props
  // console.log(props, lastVersion)
  @withFormik({
    // enableReinitialize: lastVersion !== findGetParameter('v'),
    ...props,

    // mapPropsToValues: (p) => {
    //   // console.log(2, p, props)

    //   const { mapPropsToValues } = props
    //   if (!mapPropsToValues) {
    //     return null
    //   }
    //   // console.log('commonDataReaderTransform', p, _localAuthority[displayName].disabled)

    //   return mapPropsToValues({
    //     ...p,
    //     disabled: _localAuthority[displayName].disabled,
    //   })
    // },
    // handleSubmit: (values, ps, a, b) => {
    //   const { handleSubmit: orghandleSubmit } = props
    //   orghandleSubmit.call(this, values, ps)
    //   setTimeout(() => {
    //     updateDirtyState({
    //       displayName,
    //       errors: {},
    //       dirty: false,
    //     })
    //   }, 200)
    // },
  })
  class FormComponet extends PureComponent {
    // shouldComponentUpdate (nextProps, nextStates) {
    //   return false
    // }
    state = {
      authority,
    }

    constructor (ps) {
      super(ps)
      // console.log('FormComponet', displayName)
    }

    componentDidMount () {
      if (!this.props.values.id) {
        this.props.validateForm()
      }

      startDirtyChecking = false
      setTimeout(() => {
        startDirtyChecking = true
      }, notDirtyDuration * 1000)
    }

    componentWillReceiveProps (nextProps) {
      // console.log(this.props, nextProps)

      if (startDirtyChecking) updateDirtyState(nextProps)
    }

    // shouldComponentUpdate = (nextProps) => {
    //   // console.log(
    //   //   nextProps.values,
    //   //   this.props.values,
    //   //   _.isEqual(nextProps.values, this.props.values),
    //   //   difference(nextProps.values, this.props.values),
    //   // )
    //   // console.log(nextProps)
    //   // if (nextProps.isValidating) return false
    //   return (
    //     !_.isEqual(nextProps.values, this.props.values) ||
    //     !_.isEqual(nextProps.errors, this.props.errors)
    //   )
    // }

    componentWillUnmount () {
      startDirtyChecking = false
      // console.log(displayName, window.dirtyForms[displayName])
      if (displayName) {
        const ob = window.g_app._store.getState().formik[displayName]
        if (ob)
          window.g_app._store.dispatch({
            type: 'formik/updateState',
            payload: {
              [displayName]: undefined,
            },
          })
        if (window.dirtyForms[displayName]) {
          delete window.dirtyForms[displayName]
        }

        if (Object.values(window.dirtyForms).length === 0) {
          window.beforeReloadHandlerAdded = false
          window.removeEventListener('beforeunload', confirmBeforeReload)
        }
      }
    }

    render () {
      if (!displayName) return <Component {...this.props} />
      // lastVersion = findGetParameter('v')
      const rights = {}
      if (authority) {
        if (authority.view) {
          rights.view = { name: authority.view, rights: 'enable' }
        }
        if (authority.edit) {
          rights.edit = { name: authority.edit, rights: 'enable' }
        }
      }
      // if (_localAuthority[displayName].matches) {
      //   return (
      //     <AuthorizedContext.Provider
      //       value={_localAuthority[displayName].matches}
      //     >
      //       <Component
      //         {...this.props}
      //         rights={_localAuthority[displayName].matches.rights}
      //       />
      //     </AuthorizedContext.Provider>
      //   )
      // }

      return authority ? (
        <Authorized
          authority={authority}
          noMatch={() => {
            // console.log('nomatch', this.props)

            return <Exception403 />
          }}
        >
          {(matches) => {
            // window.g_app._store.dispatch({
            //   type: 'components/updateState',
            //   payload: {
            //     [displayName]: matches,
            //     // [displayName]: {
            //     //   matches,
            //     //   view: !!matches.find((o) => o.name.indexOf('.view') >= 0),
            //     //   edit: !!matches.find((o) => o.name.indexOf('.edit') >= 0),
            //     // },
            //   },
            // })
            // _localAuthority[displayName].matches = matches
            const r = Authorized.generalCheck(
              matches,
              this.props,
              <Component {...this.props} rights={matches.rights} />,
            )
            return (
              <AuthorizedContext.Provider value={matches}>
                {r}
              </AuthorizedContext.Provider>
            )
          }}
        </Authorized>
      ) : (
          <Component {...this.props} />
        )
    }
  }

  return FormComponet
}

export default withFormikExtend
