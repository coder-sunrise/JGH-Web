import React, { PureComponent } from 'react'
import moment from 'moment'
import _ from 'lodash'
// material ui
import { withStyles, Divider } from '@material-ui/core'
import { Collapse } from 'antd'
// common components
import {
  GridItem,
  GridContainer,
  CardContainer,
  NumberInput,
  Tooltip,
} from '@/components'
// utils
import { primaryColor, grayColor } from '@/assets/jss'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'
import CustomStyle from './CustomStyle.less'

const styles = () => ({
  nameColumn: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    width: 330,
    paddingLeft: 8,
    float: 'left',
    marginTop: 6,
  },
  instructionColumn: {
    display: 'inline-block',
    width: 400,
    paddingLeft: 8,
    float: 'left',
    marginTop: 6,
  },
  quantityColumn: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    width: 150,
    paddingLeft: 8,
    float: 'left',
    marginTop: 6,
  },
  actionColumn: {
    width: 30,
    float: 'left',
  },
  addIcon: {
    cursor: 'pointer',
    color: primaryColor,
  },
  rightIcon: {
    position: 'relative',
    fontWeight: 600,
    color: 'white',
    fontSize: '0.7rem',
    padding: '2px 3px',
    height: 20,
    cursor: 'pointer',
    margin: '0px 1px',
    lineHeight: '16px',
  },
})
class Grid extends PureComponent {
  drugMixtureIndicator = (row, right) => {
    const activePrescriptionItemDrugMixture = (
      row.corPrescriptionItemDrugMixture ||
      row.retailPrescriptionItemDrugMixture ||
      []
    ).filter(item => !item.isDeleted)

    return (
      <DrugMixtureInfo
        values={activePrescriptionItemDrugMixture}
        right={right}
      />
    )
  }

  enableSelectItem = item => {
    const { type } = this.props
    if (type === '1') {
      const firstInstruction = (item.corPrescriptionItemInstruction || []).find(
        item => !item.isDeleted,
      )
      if (item.isDrugMixture) {
        const drugMixtures =
          item.corPrescriptionItemDrugMixture ||
          item.retailPrescriptionItemDrugMixture ||
          []
        if (
          drugMixtures.find(
            drugMixture =>
              !drugMixture.isActive ||
              !drugMixture.orderable ||
              drugMixture.inventoryDispenseUOMFK !== drugMixture.uomfk ||
              drugMixture.inventoryPrescribingUOMFK !==
                drugMixture.prescribeUOMFK,
          )
        ) {
          return false
        }
        return true
      }
      return (
        item.isActive &&
        item.orderable &&
        item.inventoryDispenseUOMFK === item.dispenseUOMFK &&
        firstInstruction?.prescribeUOMFK === item.inventoryPrescribingUOMFK
      )
    }
    return (
      item.isActive &&
      item.inventoryDispenseUOMFK === item.dispenseUOMFK &&
      item.inventoryPrescribingUOMFK === item.uomfk
    )
  }

  Visits = () => {
    const {
      classes,
      onSelectItems,
      addedItems,
      type,
      loadVisits,
      isRetail,
      clickCollapseHeader,
      activeKey,
    } = this.props
    return loadVisits.map(o => {
      let items = []
      if (type === '1') {
        if (o.corPrescriptionItem && o.corPrescriptionItem.length > 0) {
          items = _.orderBy(
            o.corPrescriptionItem.filter(drug => {
              return !isRetail || !drug.isExternalPrescription
            }),
            ['drugName'],
            ['asc'],
          )
        } else if (
          o.retailPrescriptionItem &&
          o.retailPrescriptionItem.length > 0
        ) {
          items = _.orderBy(o.retailPrescriptionItem, ['drugName'], ['asc'])
        }
      } else if (type === '2') {
        if (o.corVaccinationItem && o.corVaccinationItem.length > 0) {
          items = _.orderBy(o.corVaccinationItem, ['vaccinationName'], ['asc'])
        }
      }

      const enableItem = items.filter(item => this.enableSelectItem(item))

      return {
        header: (
          <div
            onClick={() => {
              clickCollapseHeader(o.id)
            }}
            style={{ display: 'flex', padding: '3px 0px 8px 0px', height: 36 }}
          >
            <div style={{ marginLeft: 5, alignItems: 'center', marginTop: 14 }}>
              <span>
                Visit Date:&nbsp;{moment(o.visitDate).format('DD MMM YYYY')}
              </span>
            </div>
            <div style={{ alignItems: 'center', marginLeft: 8 }}>
              <span
                className={classes.addIcon}
                style={{ color: enableItem.length ? primaryColor : grayColor }}
                onClick={event => {
                  event.stopPropagation()
                  onSelectItems(enableItem)
                }}
              >
                <span
                  className='material-icons'
                  style={{ position: 'absolute', marginTop: -2 }}
                >
                  add_circle_outline
                </span>
                <span
                  style={{
                    position: 'absolute',
                    marginTop: -2,
                    marginLeft: 30,
                    marginTop: 14,
                  }}
                >
                  Add All
                </span>
              </span>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                alignItems: 'center',
                marginRight: 3,
              }}
            >
              <span className='material-icons'>
                {activeKey.find(key => key === o.id)
                  ? 'expand_more'
                  : 'navigate_next'}
              </span>
            </div>
          </div>
        ),
        key: o.id,
        itemCount: items.length,
        visitDate: o.visitDate,
        content: (
          <div>
            {items.map(item => {
              let addedItem = addedItems.find(added => added.id === item.id)
              const firstInstruction = (
                item.corPrescriptionItemInstruction || []
              ).find(item => !item.isDeleted)
              let warningLabel
              if (type === '1') {
                if (item.isDrugMixture) {
                  const drugMixtures =
                    item.corPrescriptionItemDrugMixture ||
                    item.retailPrescriptionItemDrugMixture ||
                    []
                  if (drugMixtures.find(drugMixture => !drugMixture.isActive)) {
                    warningLabel = '#1'
                  } else if (
                    drugMixtures.find(drugMixture => !drugMixture.orderable)
                  ) {
                    warningLabel = '#2'
                  } else if (
                    drugMixtures.find(
                      drugMixture =>
                        drugMixture.inventoryDispenseUOMFK !==
                          drugMixture.uomfk ||
                        drugMixture.inventoryPrescribingUOMFK !==
                          drugMixture.prescribeUOMFK,
                    )
                  ) {
                    warningLabel = '#3'
                  }
                } else {
                  if (!item.isActive) {
                    warningLabel = '#1'
                  } else if (!item.orderable) {
                    warningLabel = '#2'
                  } else if (
                    item.inventoryDispenseUOMFK !== item.dispenseUOMFK ||
                    firstInstruction?.prescribeUOMFK !==
                      item.inventoryPrescribingUOMFK
                  ) {
                    warningLabel = '#3'
                  } else if (item.isExternalPrescription) {
                    warningLabel = '#4'
                  }
                }
              } else {
                if (!item.isActive) {
                  warningLabel = '#1'
                } else if (
                  item.inventoryDispenseUOMFK !== item.dispenseUOMFK ||
                  item.inventoryPrescribingUOMFK !== item.uomfk
                ) {
                  warningLabel = '#2'
                }
              }

              let paddingRight = 0
              if (
                (item.isActualizedPreOrder || item.isPreOrder) &&
                item.isExclusive
              ) {
                paddingRight = 62
              } else if (
                item.isActualizedPreOrder ||
                item.isPreOrder ||
                item.isExclusive
              ) {
                paddingRight = 34
              }
              if (item.isDrugMixture) {
                paddingRight = 20
              }
              return (
                <div
                  style={{
                    background: addedItem ? 'lightGray' : 'white',
                    width: '100%',
                    fontSize: 14,
                  }}
                >
                  <GridContainer>
                    <div
                      className={classes.nameColumn}
                      style={{
                        paddingRight: paddingRight,
                        position: 'relative',
                      }}
                    >
                      {warningLabel && (
                        <span style={{ color: 'red', fontStyle: 'italic' }}>
                          <sup>{warningLabel}&nbsp;</sup>
                        </span>
                      )}
                      <Tooltip title={item.drugName || item.vaccinationName}>
                        <span>{item.drugName || item.vaccinationName}</span>
                      </Tooltip>
                      <div
                        style={{
                          position: 'absolute',
                          top: '-1px',
                          right: '0px',
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-block',
                            position: 'relative',
                          }}
                        >
                          {item.isDrugMixture &&
                            this.drugMixtureIndicator(item)}
                        </div>
                        {(item.isActualizedPreOrder || item.isPreOrder) && (
                          <Tooltip
                            title={
                              item.isPreOrder
                                ? 'New Pre-Order'
                                : 'Actualized Pre-Order'
                            }
                          >
                            <div
                              className={classes.rightIcon}
                              style={{
                                borderRadius: 4,
                                backgroundColor: item.isPreOrder
                                  ? '#4255bd'
                                  : 'green',
                                display: 'inline-block',
                              }}
                            >
                              Pre
                            </div>
                          </Tooltip>
                        )}
                        {item.isExclusive && (
                          <Tooltip title='The item has no local stock, we will purchase on behalf and charge to patient in invoice'>
                            <div
                              className={classes.rightIcon}
                              style={{
                                borderRadius: 4,
                                backgroundColor: 'green',
                                display: 'inline-block',
                              }}
                            >
                              Excl.
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className={classes.instructionColumn}>
                      <Tooltip
                        title={
                          item.instruction ||
                          `${item.usageMethodDisplayValue ||
                            ''} ${item.dosageDisplayValue ||
                            ''} ${item.uomDisplayValue || ''}`
                        }
                      >
                        <span>
                          {item.instruction ||
                            `${item.usageMethodDisplayValue ||
                              ''} ${item.dosageDisplayValue ||
                              ''} ${item.uomDisplayValue || ''}`}
                        </span>
                      </Tooltip>
                    </div>
                    <div className={classes.quantityColumn}>
                      <Tooltip
                        title={`${item.quantity} ${item.dispenseUOMDisplayValue}`}
                      >
                        <span>
                          {`${item.quantity} ${item.dispenseUOMDisplayValue}`}
                        </span>
                      </Tooltip>
                    </div>
                    <div className={classes.actionColumn}>
                      {this.enableSelectItem(item) &&
                        (!addedItem ? (
                          <span
                            className='material-icons'
                            style={{
                              cursor: 'pointer',
                              color: primaryColor,
                              marginTop: 4,
                              marginLeft: 5,
                            }}
                            onClick={() => {
                              onSelectItems(item)
                            }}
                          >
                            add_circle_outline
                          </span>
                        ) : (
                          <span
                            className='material-icons'
                            style={{
                              cursor: 'pointer',
                              color: 'red',
                              marginTop: 4,
                              marginLeft: 5,
                            }}
                            onClick={() => {
                              onSelectItems(item)
                            }}
                          >
                            remove_circle_outline
                          </span>
                        ))}
                    </div>
                  </GridContainer>
                  <Divider style={{ marginBottom: 1 }} />
                </div>
              )
            })}
          </div>
        ),
      }
    })
  }

  content = () => {
    const {
      type,
      height,
      handelLoadMore,
      moreData,
      isRetail,
      activeKey,
    } = this.props
    let visits = _.orderBy(
      this.Visits().filter(visit => {
        return visit.itemCount > 0
      }),
      ['visitDate'],
      ['desc'],
    )
    const ContentHeight = height - 300
    const visitContentHeight = ContentHeight - 30
    if (visits.length >= 0) {
      return (
        <div>
          <div
            style={{
              overflow: 'auto',
              height: visitContentHeight,
            }}
          >
            <Collapse activeKey={activeKey} expandIconPosition={null}>
              {visits.map(visit => {
                return (
                  <Collapse.Panel
                    header={visit.header}
                    className={CustomStyle.customPanel}
                    key={visit.key}
                  >
                    {visit.content}
                  </Collapse.Panel>
                )
              })}
            </Collapse>
            {moreData && (
              <div
                style={{
                  display: 'inline-Block',
                  float: 'right',
                  marginRight: 10,
                  marginTop: 8,
                }}
              >
                <a
                  style={{ textDecoration: 'underline', fontStyle: 'italic' }}
                  onClick={handelLoadMore}
                >
                  Load More
                </a>
              </div>
            )}
          </div>
          <div
            style={{
              height: 30,
              paddingTop: 10,
            }}
          >
            <div
              style={{
                display: 'inline-Block',
              }}
            >
              {type === '1' && (
                <span>
                  Note:&nbsp;
                  <span style={{ color: 'red', fontStyle: 'italic' }}>
                    <sup>#1&nbsp;</sup>
                  </span>
                  inactive medication &nbsp;&nbsp;
                  <span style={{ color: 'red', fontStyle: 'italic' }}>
                    <sup>#2&nbsp;</sup>
                  </span>
                  non-orderable medication&nbsp;&nbsp;
                  <span style={{ color: 'red', fontStyle: 'italic' }}>
                    <sup>#3&nbsp;</sup>
                  </span>
                  dispense/prescribe UOM changed&nbsp;&nbsp;
                  {!isRetail && (
                    <span>
                      <span style={{ color: 'red', fontStyle: 'italic' }}>
                        <sup>4&nbsp;</sup>
                      </span>
                      external prescription
                    </span>
                  )}
                </span>
              )}
              {type === '2' && (
                <span>
                  Note:&nbsp;
                  <span style={{ color: 'red', fontStyle: 'italic' }}>
                    <sup>#1&nbsp;</sup>
                  </span>
                  inactive vaccination&nbsp;&nbsp;
                  <span style={{ color: 'red', fontStyle: 'italic' }}>
                    <sup>#2&nbsp;</sup>
                  </span>
                  dispense/prescribe UOM changed&nbsp;&nbsp;
                </span>
              )}
            </div>
          </div>
        </div>
      )
    }
    return (
      <div
        style={{
          height: ContentHeight,
          paddingTop: 5,
        }}
      >
        There is no matched records.
      </div>
    )
  }

  render() {
    return <CardContainer hideHeader>{this.content()}</CardContainer>
  }
}
export default withStyles(styles, { withTheme: true })(Grid)
