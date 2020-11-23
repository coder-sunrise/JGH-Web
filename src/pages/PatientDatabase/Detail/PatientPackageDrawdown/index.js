import React, { Component } from 'react'
import { connect } from 'dva'
import SolidExpandMore from '@material-ui/icons/ArrowDropDown'
import moment from 'moment'
import withStyles from '@material-ui/core/styles/withStyles'
import BusinessCenterIcon from '@material-ui/icons/BusinessCenter'
import {
  GridContainer,
  GridItem,
  Button,
  withFormikExtend,
  Accordion,
  DatePicker,
  dateFormatLong,
  SizeContainer,
  CommonModal,
} from '@/components'
import model from './models'
import PackageDrawdownAccordion from './PackageDrawdownAccordion'
import TransferPackage from './transferPackage'

window.g_app.replaceModel(model)

const styles = (theme) => ({
  titleContainer: {
    display: 'flex',
  },
  titleBlack: {
    fontWeight: 'normal',
    color: 'black',
  },
  noRecordsDiv: {
    height: 'calc(100vh - 250px)',
    paddingTop: 5,
    marginLeft: theme.spacing(1),
  },
  contentDiv: {
    height: 'calc(100vh - 250px)',
    overflow: 'scroll',
  },
  drawdownQuantity: {
    marginLeft: theme.spacing(4),
    fontWeight: 'bold',
  },
  drawdownInfo: {
    fontWeight: 'bold',
  },
  drawdownRemarks: {
    marginLeft: theme.spacing(3),
  },
  drawdownGrid: {
    marginTop: theme.spacing(1),
  },
  acknowledgeInfo: {
    marginLeft: theme.spacing(2),
  },
  transferButton: {
    marginTop: -2,
    marginLeft: theme.spacing(2),
  },
})

const parseToOneDecimalString = (value = 0.0) => value.toFixed(1)

@connect(({ patient, patientPackageDrawdown }) => ({
  patient,
  patientPackageDrawdown,
}))
@withFormikExtend({
  authority: [
    'patientdatabase.patientprofiledetails',
  ],
  enableReinitialize: true,
  mapPropsToValues: ({ patientPackageDrawdown }) => {    
    const { list = [] } = patientPackageDrawdown
    return list
  },
  handleSubmit: async (values, { props }) => {
    const {dispatch, patient} = props

    const uncompletedPackages = values.filter(p => !p.isCompleted && !p.isExpired)

    dispatch({
      type: 'patientPackageDrawdown/savePatientPackage',
      payload: {
        patientId: patient.entity.id,
        patientPackage: uncompletedPackages,
      },
    })
  },
  displayName: 'PatientPackageDrawdown',
})
class PatientPackageDrawdown extends Component {
  state = {
    isAllPackageCompleted: false,
    isShowPackageTransferModal: false,
    selectedPackageDrawdown: {},
  }

  componentDidMount () {
    this.refreshPackageDrawdown()
  }

  componentWillReceiveProps (nextProps) {
    const { values } = nextProps
    const uncompletedPackages = values.filter(p => !p.isCompleted && !p.isExpired)
    this.setState({
      isAllPackageCompleted: uncompletedPackages.length <= 0,
    })
  }

  refreshPackageDrawdown = () => {
    const { dispatch, patient } = this.props
    dispatch({
      type: 'patientPackageDrawdown/getPatientPackageDrawdown',
      payload: {
        patientId: patient.entity.id,
      },
    })
  }

  getDrawdownTitle = (row, isCompleted, isExpired) => {
    const { classes } = this.props
    const {
      itemName,
      remainingQuantity,
      totalQuantity,
    } = row

    const totalDrawdownQuantity = totalQuantity - remainingQuantity
    const label = `${itemName} (drawdown to-date: ${parseToOneDecimalString(totalDrawdownQuantity)} / ${parseToOneDecimalString(totalQuantity)})`

    return (
      <div className={classes.titleContainer}>
        {remainingQuantity > 0 ? (
          <p>{label}</p>
        ) : (
          <p><font color='black'>{label}</font></p>
        )}
        {!isCompleted && !isExpired && remainingQuantity > 0 && (
          <Button className={classes.transferButton}
            size='sm'
            color='info'
            justIcon
            onClick={(e) => {
              e.stopPropagation()

              this.setState({
                isShowPackageTransferModal: true,
                selectedPackageDrawdown: row,
              })
            }}
          >
            <BusinessCenterIcon />
          </Button>
        )}
      </div>
    )
  }

  getDrawdownContent = (row) => {
    const { classes } = this.props
    const {
      patientPackageDrawdownTransaction,
    } = row

    return (
      <div>
        {patientPackageDrawdownTransaction.map((transaction) => {
          const dateLabel = `on ${moment(transaction.transactionDate).format('DD MMM YYYY HH:mm')}`
          let infoLabel = `${dateLabel} by ${transaction.performingUserName}`
          if (transaction.transactionType === 'Transfer') {
            if (transaction.transferFromPatient)
              infoLabel = `${dateLabel} received from ${transaction.transferFromPatient}`
            else
              infoLabel = `${dateLabel} transferred to ${transaction.transferToPatient}`
          }

          return (
            <GridContainer className={classes.drawdownGrid}>
              <GridItem md={1}>
                <p className={classes.drawdownQuantity}>
                  {transaction.transferFromPatient ? (
                    <font color='green'>- {parseToOneDecimalString(transaction.transactionQuantity)}</font>
                  ) : (
                    <p>- {parseToOneDecimalString(transaction.transactionQuantity)}</p>
                  )}
                </p>
              </GridItem>
              <GridItem md={11}>
                <div>
                  <div className={classes.titleContainer}>
                    <p className={classes.drawdownInfo}>
                      {infoLabel}
                    </p>
                    {transaction.transactionQuantity > 0 && transaction.signatureDate && (
                    <p className={classes.acknowledgeInfo}><font color='red'>(Acknowledged on {moment(transaction.signatureDate).format('DD MMM YYYY')})</font></p>
                  )}
                  </div>
                  {transaction.remarks && (
                    <p className={classes.drawdownRemarks}>
                      Remark: {transaction.remarks}
                    </p>
                  )}
                </div>
              </GridItem>
            </GridContainer>
          )
        })}
      </div>
    )
  }

  getPackageTitle = (row) => {
    const { classes, values } = this.props
    const {
      packageCode,
      packageName,
      expiryDate,
      purchaseDate,
      isCompleted,
      isExpired,
      id,
    } = row

    return (
      <div className={classes.titleContainer}>
        <GridContainer>
          <GridItem md={8}>
            {isCompleted ? (
              <p>
                <font color='black'> {packageCode} - {packageName}</font>
              </p>
              ) : (
                <p>{packageCode} - {packageName}</p>
            )}
          </GridItem>
          <GridItem md={2}>
            {isCompleted && (
              <p className={classes.titleBlack}>Exp. Date: {expiryDate ? moment(expiryDate).format(dateFormatLong) : 'Nil'}</p>
              )
            }
            {!isCompleted && !isExpired && (
              <SizeContainer size='sm'>
                <div 
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <DatePicker 
                    style={{
                      width: 120, 
                      marginTop: -2,
                    }}
                    label='Exp. Date' 
                    format={dateFormatLong} 
                    value={expiryDate} 
                    onChange={value => {
                      const changedPacakge = values.find(p => p.id === id)
                      if (changedPacakge) {
                        changedPacakge.expiryDate = value || undefined
                      }
                    }              
                }
                  />
                </div>
              </SizeContainer>
              )
            }
            {!isCompleted && isExpired && (
              <p className={classes.titleBlack}>Exp. Date: 
                <font color='red'> {expiryDate ? moment(expiryDate).format(dateFormatLong) : 'Nil'}</font>
              </p>
            )
          }
          </GridItem>
          <GridItem md={2}>
            <p className={classes.titleBlack}>Purchased on: {moment(purchaseDate).format(dateFormatLong)}</p>
          </GridItem>
        </GridContainer>
      </div>
    )
  }

  getPackageContent = (row) => {
    const {
      patientPackageDrawdown,
    } = row

    let expandArrary = []
    let index = 0
    patientPackageDrawdown.forEach(d => {
      expandArrary.push(index)
      index += 1
    })
    expandArrary.push(index)

    return (
      <div>
        <PackageDrawdownAccordion
          defaultActive={expandArrary}
          leftIcon
          expandIcon={<SolidExpandMore fontSize='large' />}
          mode='multiple'
          collapses={patientPackageDrawdown.map((o) => {
            const returnValue = {
              title: this.getDrawdownTitle(o, row.isCompleted, row.isExpired),
              content: this.getDrawdownContent(o),
            }
            return {
              ...returnValue,
              row: o,
            }
          })}
        />
      </div>
    )
  }

  closePackageTransferModal = () => {
    this.setState({
      isShowPackageTransferModal: false,
    })
  }

  confirmPackageTransferModal = () => {
    this.setState({
      isShowPackageTransferModal: false,
    })

    this.refreshPackageDrawdown()
  }

  render () {
    const {
      patientPackageDrawdown: { list = [] },
      patient,
      classes,
    } = this.props

    if(list.length > 0) {      
      return (      
        <div>
          <GridContainer>
            <GridItem md={12}>
              <div className={classes.contentDiv}>
                <Accordion
                  mode='multiple'
                  collapses={list.map((o) => {
                  const returnValue = {
                    title: this.getPackageTitle(o),
                    content: this.getPackageContent(o),
                  }
                  return {
                    ...returnValue,
                    row: o,
                  }
                })}
                />
              </div>
            </GridItem>
            <GridItem md={12}>
              {!this.state.isAllPackageCompleted && patient.entity.isActive && (
              <Button 
                color='primary' 
                onClick={this.props.handleSubmit}
              >
                Save
              </Button>
            )}
              <Button color='primary'>
              Print
              </Button>
            </GridItem>
          </GridContainer>

          <CommonModal
            cancelText='Cancel'
            maxWidth='sm'
            title='Transfering Package Item'
            onClose={this.closePackageTransferModal}
            onConfirm={this.confirmPackageTransferModal}
            open={this.state.isShowPackageTransferModal}
          >
            <TransferPackage selectedPackageDrawdown={this.state.selectedPackageDrawdown} {...this.props} />
          </CommonModal>
        </div>
      )
    }

    return (
      <div className={classes.noRecordsDiv}>
        There is no records.
      </div>
    )
  }
}

export default withStyles(styles, { withTheme: true })(PatientPackageDrawdown)