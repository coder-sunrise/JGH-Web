import React, { PureComponent } from 'react'
import moment from 'moment'
import _ from 'lodash'
import { Tag } from 'antd'
// material ui
import { withStyles, Divider } from '@material-ui/core'
import { Collapse } from 'antd'
import { Edit, Delete } from '@material-ui/icons'
// common components
import {
  GridItem,
  GridContainer,
  CardContainer,
  NumberInput,
  Tooltip,
  Button
} from '@/components'
// utils
import { primaryColor, dangerColor, grayColor } from '@/assets/jss'
import DrugMixtureInfo from '@/pages/Widgets/Orders/Detail/DrugMixtureInfo'
import DeleteWithPopover from '@/pages/Billing/components/DeleteWithPopover'
import CustomStyle from '../AddMedicationFromPast/CustomStyle.less'

const styles = () => ({
  nameColumn: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    width: 320,
    paddingLeft: 8,
    float: 'left',
    marginTop: 6,
  },
  instructionColumn: {
    display: 'inline-block',
    width: 420,
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
  addIcon: {
    cursor: 'pointer',
    color: primaryColor,
  },
  removeIcon: {
    cursor: 'pointer',
    color: dangerColor,
  },
  tagStyle: {
    fontSize: '0.85rem',
    padding: '1px 3px',
    fontWeight: 500,
    borderRadius: 4
  },
  rightIcon: {
    position: 'absolute',
    bottom: 2,
    fontWeight: 500,
    color: 'white',
    fontSize: '0.7rem',
    padding: '2px 3px',
    height: 20,
    cursor: 'pointer'
  }
})
class Grid extends PureComponent {
  PrescriptionSets = () => {
    const {
      classes,
      onSelectItems,
      addedPrescriptionSets,
      loadPrescriptionSets,
      isRetail,
      clickCollapseHeader,
      activeKey,
      handelDelete,
      handelEdit,
      user,
      selectType,
      generalAccessRight,
    } = this.props

    const drugMixtureIndicator = (row, right) => {
      return (
        <DrugMixtureInfo values={row.prescriptionSetItemDrugMixture || []} right={right} />
      )
    }

    return loadPrescriptionSets.filter(set => selectType === 'All' || set.type === selectType).map((o) => {
      const items = _.orderBy(
        (o.prescriptionSetItem || []).filter((drug) => {
          return !isRetail || !drug.isExternalPrescription
        }),
        [
          'drugName',
        ],
        [
          'asc',
        ],
      )

      const isSelect = addedPrescriptionSets.indexOf(o.id) >= 0
      const selectEnable = items.filter(item => {
        const firstInstruction = (item.prescriptionSetItemInstruction || []).find(item => !item.isDeleted)
        if (item.isDrugMixture || (item.isActive
          && item.inventoryDispenseUOMFK === item.dispenseUOMFK
          && firstInstruction?.prescribeUOMFK === item.inventoryPrescribingUOMFK
        )) {
          return true
        }
      }).length === items.length

      const editEnable = (o.type === 'Personal' || generalAccessRight.rights === "enable")
      return {
        header: (
          <div
            onClick={() => {
              clickCollapseHeader(o.id)
            }}
            style={{ display: 'relative', padding: '3px 0px 8px 0px', height: 36 }}
          >
            <div style={{
              left: 5, position: 'absolute', top: 10,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: 400,
              height: 24
            }}>
              {o.sortOrder >= 0 ? `${o.sortOrder}. ` : ''}
              <Tooltip title={o.prescriptionSetName}>
                <span style={{ fontWeight: 500, lineHeight: '24px' }}>
                  {o.prescriptionSetName}
                </span>
              </Tooltip>
            </div>

            {selectType !== 'Personal' &&
              <div style={{ left: 410, position: 'absolute', top: 8 }}>
                {o.type === 'General' ?
                  <Tag className={classes.tagStyle} style={{ border: '1px solid #99CC99', color: '#7CD55E', backgroundColor: '#F6FFED' }}>General</Tag>
                  :
                  <Tag className={classes.tagStyle} style={{ border: '1px solid lightblue', color: '#354497', backgroundColor: '#E6F7FF' }}>Personal</Tag>
                }
              </div>
            }

            {o.type === 'General' &&
              <div style={{
                position: 'absolute', top: 10,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', right: 110, maxWidth: 300,
              }}>
                <Tooltip title={`Last Modified By: ${o.ownedByUser}`}>
                  <span style={{ lineHeight: '24px' }}>
                    {`Last Modified By: ${o.ownedByUser}`}
                  </span>
                </Tooltip>
              </div>
            }
            <div style={{ position: 'absolute', top: 8, right: 75 }}>
              {!isSelect ? <span
                className={classes.addIcon}
                style={{ color: selectEnable ? primaryColor : grayColor }}
                title={selectEnable ? '' : 'Edit the prescription set to proceed'}
                onClick={selectEnable ? (event) => {
                  event.stopPropagation()
                  onSelectItems(o.id)
                } : undefined}
              >
                <span
                  className='material-icons'
                >
                  add_circle_outline
                </span>
              </span>
                : <span
                  className={classes.removeIcon}
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelectItems(o.id)
                  }}
                >
                  <span
                    className='material-icons'
                  >
                    remove_circle_outline
                  </span>
                </span>
              }
            </div>
            <Button style={{ position: 'absolute', top: 8, right: 35 }}
              disabled={!editEnable}
              justIcon
              color='primary'
              onClick={(event) => {
                event.stopPropagation()
                handelEdit(o)
              }}> <Edit />
            </Button>

            {false && <Button style={{ position: 'absolute', top: 8, right: 0 }}
              disabled={!editEnable}
              justIcon
              color='danger'
              onClick={(event) => {
                event.stopPropagation()
                handelDelete(o.id)
              }}> <Delete />

            </Button>
            }
            <div style={{ position: 'absolute', top: 8, right: 0 }}>
              <DeleteWithPopover
                index={o.id}
                title='Delete Prescription Set'
                contentText='Confirm to remove this prescription set?'
                isFromCollapseHeader
                onConfirmDelete={() => {
                  handelDelete(o.id)
                }}
                disabled={!editEnable}
              />
            </div>
          </div>
        ),
        key: o.id,
        itemCount: items.length,
        content: (
          <div>
            {items.map((item) => {
              const firstInstruction = (item.prescriptionSetItemInstruction || []).find(item => !item.isDeleted)
              let warningLabel
              if (!item.isActive && !item.isDrugMixture) {
                warningLabel = '#1'
              } else if (!item.isDrugMixture
                && (item.inventoryDispenseUOMFK !== item.dispenseUOMFK
                  || firstInstruction?.prescribeUOMFK !== item.inventoryPrescribingUOMFK)) {
                warningLabel = '#2'
              } else if (item.isExternalPrescription) {
                warningLabel = '#3'
              }

              let paddingRight = 0
              if (item.isExclusive) {
                paddingRight = 34
              }
              if (item.isDrugMixture) {
                paddingRight = 20
              }
              return (
                <div
                  style={{
                    width: '100%',
                    fontSize: 14,
                  }}
                >
                  <GridContainer>
                    <div className={classes.nameColumn}
                      style={{ paddingRight: paddingRight }}>
                      {warningLabel && (
                        <span style={{ color: 'red', fontStyle: 'italic' }}>
                          <sup>{warningLabel}&nbsp;</sup>
                        </span>
                      )}
                      <Tooltip title={item.drugName}>
                        <span>{item.drugName}</span>
                      </Tooltip>
                      <div style={{ position: 'relative' }}>
                        {item.isDrugMixture && drugMixtureIndicator(item, -20)}
                        {item.isExclusive && (
                          <Tooltip title='Exclusive Drug'>
                            <div
                              className={classes.rightIcon}
                              style={{
                                right: -30,
                                borderRadius: 4,
                                backgroundColor: 'green',
                              }}
                            >Excl.</div>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className={classes.instructionColumn}>
                      <Tooltip
                        title={item.instruction}
                      >
                        <span>
                          {item.instruction}
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
      isRetail,
      activeKey,
    } = this.props
    let prescriptionSets = _.orderBy(
      this.PrescriptionSets().filter((ps) => {
        return ps.itemCount > 0
      }),
      [
        'prescriptionSetName',
      ],
      [
        'desc',
      ],
    )
    const ContentHeight = height - 300
    const psContentHeight = ContentHeight - 30
    if (prescriptionSets.length >= 0) {
      return (
        <div>
          <div
            style={{
              overflow: 'auto',
              height: psContentHeight,
            }}
          >
            <Collapse activeKey={activeKey} expandIconPosition={null}>
              {prescriptionSets.map((ps) => {
                return (
                  <Collapse.Panel
                    header={ps.header}
                    className={CustomStyle.customPanel}
                    key={ps.key}
                  >
                    {ps.content}
                  </Collapse.Panel>
                )
              })}
            </Collapse>
          </div>
          <div
            style={{
              height: 30,
              paddingTop: 10,
            }}
          >
            <span>
              Note:&nbsp;
              <span style={{ color: 'red', fontStyle: 'italic' }}>
                <sup>#1&nbsp;</sup>
              </span>
              inactive medication &nbsp;&nbsp;
              <span style={{ color: 'red', fontStyle: 'italic' }}>
                <sup>#2&nbsp;</sup>
              </span>
              dispense/prescribe UOM is changed&nbsp;&nbsp;
              {!isRetail && (
                <span>
                  <span style={{ color: 'red', fontStyle: 'italic' }}>
                    <sup>#3&nbsp;</sup>
                  </span>
                  external prescription
                </span>
              )}
            </span>
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

  render () {
    return <CardContainer hideHeader>{this.content()}</CardContainer>
  }
}
export default withStyles(styles, { withTheme: true })(Grid)
