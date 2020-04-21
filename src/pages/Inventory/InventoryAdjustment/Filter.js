import React, { PureComponent, Fragment } from 'react'
import { FormattedMessage } from 'umi/locale'
import Search from '@material-ui/icons/Search'
import Add from '@material-ui/icons/Add'
import {
  MenuList,
  Popper,
  Paper,
  Grow,
  ClickAwayListener,
  MenuItem,
} from '@material-ui/core'
import {
  withFormikExtend,
  FastField,
  GridContainer,
  GridItem,
  TextField,
  Checkbox,
  Select,
  ProgressButton,
  DateRangePicker,
  Field,
  Button,
} from '@/components'
import { inventoryAdjustmentStatus } from '@/utils/codes'
import Authorized from '@/utils/Authorized'

@withFormikExtend({
  mapPropsToValues: ({ inventoryAdjustment }) =>
    inventoryAdjustment.filter || {},
  handleSubmit: () => {},
  displayName: 'InventoryAdjustmentFilter',
})
class Filter extends PureComponent {
  state = {
    open: false,
  }

  handleToggle = () => {
    this.setState((prev) => {
      return { open: !prev.open }
    })
  }

  handleMassAdjustment = async (e) => {
    this.handleToggle()
    const { inventoryAdjustment } = this.props
    const result = await this.props.dispatch({
      type: 'inventoryAdjustment/getStockDetails',
      payload: {
        id: e,
      },
    })

    this.props.dispatch({
      type: 'inventoryAdjustment/updateState',
      payload: {
        entity: undefined,
        // showModal: !inventoryAdjustment.showModal,
        default: {
          ...inventoryAdjustment.default,
          stockList: result.data,
        },
      },
    })

    this.props.toggleModal()
  }

  render () {
    const { classes, values } = this.props
    const { open } = this.state
    return (
      <div className={classes.filterBar}>
        <GridContainer>
          <GridItem xs={6} md={2}>
            <FastField
              name='transactionNo'
              render={(args) => {
                return <TextField label='Transaction No' {...args} />
              }}
            />
          </GridItem>

          <GridItem xs={6} md={5}>
            <Field
              name='transDates'
              render={(args) => {
                return (
                  <DateRangePicker
                    label='Transaction From Date'
                    label2='To Date'
                    disabled={values.allDate}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>

          <GridItem xs={6} md={2}>
            <Field
              name='allDate'
              render={(args) => {
                return <Checkbox inputLabel='' label='All Date' {...args} />
              }}
            />
          </GridItem>

          <GridItem xs={6} md={2}>
            <FastField
              name='status'
              render={(args) => {
                return (
                  <Select
                    label='Status'
                    options={inventoryAdjustmentStatus}
                    {...args}
                  />
                )
              }}
            />
          </GridItem>
          <GridItem xs={6} md={6}>
            <div className={classes.filterBtn}>
              <ProgressButton
                color='primary'
                icon={<Search />}
                onClick={() => {
                  const { transactionNo, status, transDates, allDate } = values

                  let fromDate
                  let toDate

                  if (!allDate) {
                    if (transDates) {
                      const [
                        from,
                        to,
                      ] = transDates
                      fromDate = from
                      toDate = to
                    }
                  }

                  this.props.dispatch({
                    type: 'inventoryAdjustment/query',
                    payload: {
                      adjustmentTransactionNo: transactionNo,
                      inventoryAdjustmentStatusFK: status,
                      lgteql_adjustmentTransactionDate: fromDate,
                      lsteql_adjustmentTransactionDate: toDate,
                    },
                  })
                }}
              >
                <FormattedMessage id='form.search' />
              </ProgressButton>

              <Authorized authority='inventoryadjustment.newinventoryadjustment'>
                <Fragment>
                  <Button
                    color='primary'
                    icon={null}
                    onClick={() => {
                      const { inventoryAdjustment } = this.props
                      this.props.dispatch({
                        type: 'inventoryAdjustment/updateState',
                        payload: {
                          entity: undefined,
                          default: {
                            ...inventoryAdjustment.default,
                            stockList: undefined,
                          },
                        },
                      })
                      this.props.toggleModal()
                    }}
                  >
                    <Add />
                    Add New
                  </Button>
                  <Button
                    color='primary'
                    icon={null}
                    onClick={this.handleToggle}
                    buttonRef={(node) => {
                      this.anchorElAccount = node
                    }}
                  >
                    Mass Adjustment
                  </Button>
                </Fragment>
              </Authorized>

              <Popper
                open={open}
                anchorEl={this.anchorElAccount}
                transition
                disablePortal
                placement='bottom-end'
                style={{
                  zIndex: 1,
                  width: 185,
                  left: -63,
                }}
              >
                {({ TransitionProps, placement }) => (
                  <Grow
                    {...TransitionProps}
                    id='menu-list'
                    style={{ transformOrigin: '0 0 -30' }}
                  >
                    <Paper className={classes.dropdown}>
                      <ClickAwayListener onClickAway={this.handleToggle}>
                        <MenuList role='menu'>
                          <MenuItem
                            onClick={() => this.handleMassAdjustment(1)}
                          >
                            Medication
                          </MenuItem>
                          <MenuItem
                            onClick={() => this.handleMassAdjustment(2)}
                          >
                            Consumable
                          </MenuItem>
                          <MenuItem
                            onClick={() => this.handleMassAdjustment(3)}
                          >
                            Vaccination
                          </MenuItem>
                        </MenuList>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>
            </div>
          </GridItem>
        </GridContainer>
      </div>
    )
  }
}

export default Filter
