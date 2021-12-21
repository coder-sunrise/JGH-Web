import React, { Fragment } from 'react'
import withWebSocket from '@/components/Decorator/withWebSocket'
// common components
import {
  GridContainer,
  GridItem,
  CheckboxGroup,
  EditableTableGrid,
  CommonTableGrid,
  NumberInput,
} from '@/components'
import { connect } from 'dva'

import { getReportContext, getRawData } from '@/services/report'
import { REPORT_ID } from '@/utils/constants'
import {
  DrugLabelSelectionColumns,
  DrugLabelSelectionColumnExtensions,
} from '../variables'
import TableData from './TableData'

@connect(({ clinicSettings, patient, dispense }) => ({
  clinicSettings: clinicSettings.settings || clinicSettings.default,
  dispense,
  patient,
}))
class DrugLabelSelection extends React.PureComponent {
  state = {
    prescription: [],
    selectedRows: [],
    selectedLanguage: [],
    confirmEnabled: false,
    languageSelected: false,
  }
  columns = [
    {
      name: 'displayName',
      title: 'Item',
    },
    {
      name: 'no',
      title: 'Copies',
    },
  ]
  columnExtension = [
    {
      disabled: true,
      columnName: 'displayName',
      sortingEnabled: false,
      render: row => {
        return (
          <div style={{ position: 'relative' }}>
            <div
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {row.displayName}
            </div>
          </div>
        )
      },
    },
    {
      columnName: 'no',
      type: 'number',
      width: 80,
      sortingEnabled: false,
      render: row => {
        return (
          <p>
            <NumberInput
              max={99}
              precision={0}
              min={1}
              value={row.no}
              defaultValue={1}
            />
          </p>
        )
      },
    },
  ]

  constructor(props) {
    super(props)
    const { dispatch, currentDrugToPrint } = props
    dispatch({
      type: 'dispense/queryDrugLabelList',
      payload: {
        id: this.props.dispense.visitID,
        includeOpenPrescription: true,
      },
    }).then(data => {
      if (data) {
        // filter when click print from table row.
        if (currentDrugToPrint && currentDrugToPrint.id) {
          data = data.filter(
            t => t.visitInvoiceDrugId === currentDrugToPrint.id,
          )
        }
        data = _.orderBy(data, ['displayName'], ['asc'])
        // set default language based on patient tranlsation and clinic setting.
        const preferLanguage =
          (this.props.patient && this.props.patient.translationLinkFK) === 5
            ? 'JP'
            : this.props.clinicSettings.primaryPrintoutLanguage
        this.setState({
          prescription: data.map(x => {
            return { ...x, no: 1 }
          }),
          selectedRows: data.map(item => item.id),
          selectedLanguage: [preferLanguage],
        })
      }
    })
  }
  componentDidMount = () => {}
  handleSelectionChange = rows => {
    this.setState(() => ({
      selectedRows: rows,
    }))
  }

  tableConfig = {
    FuncProps: {
      pager: false,
      selectable: true,
      selectConfig: {
        showSelectAll: true,
        selectByRowClick: false,
        rowSelectionEnabled: () => true,
      },
    },
  }
  confirmPrint = () => {
    this.state.selectedLanguage.forEach(async lan => {
      let printResult = await this.getPrintResult(lan)
      if (!printResult || printResult.length <= 0) return
      await this.props.handlePrint(JSON.stringify(printResult))
      if (
        this.state.selectedLanguage.indexOf(lan) ==
        this.state.selectedLanguage.length - 1
      ) {
        this.props.handleSubmit()
      }
    })
  }
  getPrintResult = async lan => {
    let drugLabelReportID = REPORT_ID.DRUG_LABEL_80MM_45MM
    let patientLabelReportID = REPORT_ID.PATIENT_LABEL_80MM_45MM
    try {
      let settings = JSON.parse(localStorage.getItem('clinicSettings'))
      if (settings && settings.labelPrinterSize === '8.9cmx3.6cm') {
        drugLabelReportID = REPORT_ID.DRUG_LABEL_89MM_36MM
        patientLabelReportID = REPORT_ID.PATIENT_LABEL_89MM_36MM
      } else if (settings && settings.labelPrinterSize === '7.6cmx3.8cm') {
        drugLabelReportID = REPORT_ID.DRUG_LABEL_76MM_38MM
        patientLabelReportID = REPORT_ID.PATIENT_LABEL_76MM_38MM
      } else if (settings && settings.labelPrinterSize === '8.0cmx4.5cm_V2') {
        drugLabelReportID = REPORT_ID.DRUG_LABEL_80MM_45MM_V2
      }

      const { dispense, values, currentDrugToPrint } = this.props
      const { packageItem, dispenseItems, orderItems } = values
      const data = await getRawData(drugLabelReportID, {
        selectedDrugs: JSON.stringify(
          this.state.prescription
            .filter(
              t => this.state.selectedRows.filter(x => x === t.id).length > 0,
            )
            .map(t => {
              return {
                id: t.id,
                vidId: t.visitInvoiceDrugId,
                pinfo: t.pageInfo,
                insId: _.join(t.instructionId, ','),
              }
            }),
        ),
        language: lan,
        visitId: dispense.visitID,
      })
      let finalDrugLabelDetails = []
      data.DrugLabelDetails.forEach(t => {
        var dispenseItemss = (dispenseItems || orderItems).filter(
          x => x.invoiceItemFK === t.invoiceItemId,
        )
        var indicationArray = (t.indication || '').split('\n')
        t.firstLine = indicationArray.length > 0 ? indicationArray[0] : ' '
        t.secondLine = indicationArray.length > 1 ? indicationArray[1] : ' '
        t.thirdLine =
          indicationArray.length > 2
            ? indicationArray[2] +
              ' ' +
              // currently will append all the precaution into last line if it's AND
              (t.isDrugMixture ? _.takeRight(indicationArray, 2).join(' ') : '')
            : ' '
        // If it's drugmixture, then just duplicate by copies.
        if (t.isDrugMixture) {
          for (
            let j = 0;
            j <
            this.state.prescription.find(
              x =>
                x.id === t.index &&
                this.state.selectedRows.filter(tt => tt == x.id).length > 0,
            ).no;
            j++
          ) {
            finalDrugLabelDetails.push(t)
          }
        }
        // If it's normal items, then need to based on Batch and Copies to duplicate.
        else {
          for (let i = 0; i < dispenseItemss.length; i++) {
            let xx = { ...t }
            xx.ExpiryDate = dispenseItemss[i].expiryDate
            xx.BatchNo = dispenseItemss[i].batchNo
            for (
              let j = 0;
              j <
              this.state.prescription.find(
                x =>
                  x.id === t.index &&
                  this.state.selectedRows.filter(tt => tt == x.id).length > 0,
              ).no;
              j++
            ) {
              finalDrugLabelDetails.push(xx)
            }
          }
        }
      })
      data.DrugLabelDetails = finalDrugLabelDetails
      const payload = [
        {
          ReportId: drugLabelReportID,
          ReportData: JSON.stringify({
            ...data,
          }),
        },
      ]
      return payload
    } catch (error) {
      console.log({ error })
    }
    return null
  }

  handlePrintOutLanguageChanged = lang => {
    this.setState({ selectedLanguage: lang })
  }

  handleCommitChanges = ({ rows }) => {
    this.setState({
      prescription: [...rows],
    })
  }
  render() {
    const {
      footer,
      handleSubmit,
      invoiceItems,
      selectedDrugs,
      dispenseItems = [],
      packageItem,
      clinicSettings,
      ...restProps
    } = this.props
    const {
      primaryPrintoutLanguage = 'EN',
      secondaryPrintoutLanguage = '',
    } = clinicSettings
    const showDrugWarning = this.state.selectedRows.length === 0
    const showLanguageWarning = this.state.selectedLanguage.length == 0
    const printLabelDisabled = showDrugWarning || showLanguageWarning
    return (
      <div>
        <GridContainer>
          <GridItem md={12}>
            {this.state.prescription && this.state.prescription.length > 0 && (
              <EditableTableGrid
                size='sm'
                forceRender
                columns={this.columns}
                columnExtensions={this.columnExtension}
                rows={this.state.prescription}
                {...this.tableConfig}
                selection={this.state.selectedRows}
                onSelectionChange={this.handleSelectionChange}
                EditingProps={{
                  showAddCommand: false,
                  showDeleteCommand: false,
                  onCommitChanges: this.handleCommitChanges,
                  showCommandColumn: false,
                }}
              />
            )}
          </GridItem>
          <GridItem>
            {secondaryPrintoutLanguage && (
              <Fragment>
                <span>Print In: </span>
                <div style={{ width: 150, display: 'inline-block' }}>
                  <CheckboxGroup
                    displayInlineBlock={true}
                    value={this.state.selectedLanguage}
                    options={[
                      { value: 'EN', label: 'EN' },
                      { value: 'JP', label: 'JP' },
                    ]}
                    onChange={v => {
                      this.handlePrintOutLanguageChanged(v.target.value)
                    }}
                  />
                </div>
                {showDrugWarning && (
                  <div style={{ color: 'red' }}>
                    * Please select at least one drug to print.
                  </div>
                )}
                {showLanguageWarning && (
                  <div style={{ color: 'red' }}>
                    * Please select at least one language to print.
                  </div>
                )}
              </Fragment>
            )}
          </GridItem>
        </GridContainer>
        {footer &&
          footer({
            cancelProps: {},
            confirmProps: {
              disabled: printLabelDisabled,
            },
            onConfirm: this.confirmPrint,
            confirmBtnText: 'Print',
          })}
      </div>
    )
  }
}
export default withWebSocket()(DrugLabelSelection)
