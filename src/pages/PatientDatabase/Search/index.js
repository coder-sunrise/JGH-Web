import React, { PureComponent } from 'react'
import { connect } from 'dva'
import { withStyles } from '@material-ui/core'
import AccountCircle from '@material-ui/icons/AccountCircle'
import { getAppendUrl } from '@/utils/utils'
import { compare } from '@/layouts'
import { CardContainer, Button, Tooltip } from '@/components'
import FilterBar from './FilterBar'
import Grid from './Grid'
import Authorized from '@/utils/Authorized'

const styles = () => ({})

const { Secured } = Authorized
@connect(({ patientSearch }) => ({
  patientSearch,
}))
@compare('patientSearch')
@Secured('patientdatabase/searchpatient')
class PatientSearch extends PureComponent {
  constructor (props) {
    super(props)
    // console.log(this)

    const showPatient = (row) => {
      if (!this.props.history || this.props.rights === 'disable') return
      this.props.history.push(
        getAppendUrl({
          md: 'pt',
          cmt: '1',
          pid: row.id,
          v: Date.now(),
        }),
      )
    }
    this.defaultAction = (row) => (
      <Tooltip title='View Patient Profile' placement='bottom'>
        <span>
          <Button
            size='sm'
            onClick={() => showPatient(row)}
            justIcon
            authority='none'
            round
            color='primary'
            style={{ marginRight: 5 }}
          >
            <AccountCircle />
          </Button>
        </span>
      </Tooltip>
    )
    this.defaultOnDblClick = showPatient
    // props.dispatch({
    //   type: 'patientSearch/query',
    // })
    // console.log('c PatientSearch')
  }

  componentDidMount () {
    if (!this.props.disableQueryOnLoad) {
      this.props.dispatch({
        type: 'patientSearch/query',
        payload: {
          sorting: [
            // { columnName: 'isActive', direction: 'asc' },
            { columnName: 'name', direction: 'asc' },
          ],
        },
      })
    }
  }

  componentWillUnmount () {
    this.props.dispatch({
      type: 'patientSearch/updateState',
      payload: {
        // list: [],
        filter: {},
      },
    })
  }

  render () {
    const { props } = this
    // console.log(props)
    const {
      classes,
      renderActionFn = this.defaultAction,
      onRowDblClick = this.defaultOnDblClick,
      simple,
      ...restProps
    } = props
    const newChildren = (
      <React.Fragment>
        <FilterBar {...restProps} simple={simple} />
        <Grid
          simple={simple}
          renderActionFn={renderActionFn}
          onRowDblClick={onRowDblClick}
          {...restProps}
        />
      </React.Fragment>
    )
    return simple ? (
      <div>{newChildren}</div>
    ) : (
      <CardContainer hideHeader>{newChildren}</CardContainer>
    )
  }
}

export default withStyles(styles)(PatientSearch)
